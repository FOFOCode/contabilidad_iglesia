-- ============================================================
-- FUNCIONES PL/pgSQL — Sistema de Contabilidad Iglesia
-- ============================================================
-- Propósito: Mover lógica de agregación pesada a la base de
--            datos para reducir round-trips y procesamiento
--            en Node.js.
--
-- Para aplicar (una sola vez, o al actualizar):
--   psql $DATABASE_URL -f prisma/functions.sql
--   (o usar el script: node scripts/apply-db-functions.mjs)
-- ============================================================


-- ============================================================
-- 1. fn_resumen_dashboard
-- Reemplaza obtenerResumenDashboard() en sistema.ts
-- De ~20 queries → 1 query
-- ============================================================
CREATE OR REPLACE FUNCTION fn_resumen_dashboard()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_inicio_mes     TIMESTAMPTZ;
  v_inicio_mes_ant TIMESTAMPTZ;
  v_fin_mes_ant    TIMESTAMPTZ;
  v_inicio_anio    TIMESTAMPTZ;
BEGIN
  -- Fechas en zona horaria El Salvador (UTC-6, sin DST)
  v_inicio_mes     := DATE_TRUNC('month', NOW() AT TIME ZONE 'America/El_Salvador')
                        AT TIME ZONE 'America/El_Salvador';
  v_inicio_mes_ant := v_inicio_mes - INTERVAL '1 month';
  v_fin_mes_ant    := v_inicio_mes - INTERVAL '1 microsecond';
  v_inicio_anio    := DATE_TRUNC('year', NOW() AT TIME ZONE 'America/El_Salvador')
                        AT TIME ZONE 'America/El_Salvador';

  RETURN (
    WITH
    -- ── Ingresos/egresos del mes ──────────────────────────
    ing_mes AS (
      SELECT im."monedaId", ROUND(SUM(im.monto)::NUMERIC, 2)::FLOAT AS total
      FROM ingreso_montos im
      JOIN ingresos i ON im."ingresoId" = i.id
      WHERE i."fechaRecaudacion" >= v_inicio_mes
      GROUP BY im."monedaId"
    ),
    egr_mes AS (
      SELECT "monedaId", ROUND(SUM(monto)::NUMERIC, 2)::FLOAT AS total
      FROM egresos WHERE "fechaSalida" >= v_inicio_mes
      GROUP BY "monedaId"
    ),
    -- ── Mes anterior ─────────────────────────────────────
    ing_mes_ant AS (
      SELECT im."monedaId", ROUND(SUM(im.monto)::NUMERIC, 2)::FLOAT AS total
      FROM ingreso_montos im
      JOIN ingresos i ON im."ingresoId" = i.id
      WHERE i."fechaRecaudacion" >= v_inicio_mes_ant
        AND i."fechaRecaudacion" <= v_fin_mes_ant
      GROUP BY im."monedaId"
    ),
    egr_mes_ant AS (
      SELECT "monedaId", ROUND(SUM(monto)::NUMERIC, 2)::FLOAT AS total
      FROM egresos
      WHERE "fechaSalida" >= v_inicio_mes_ant AND "fechaSalida" <= v_fin_mes_ant
      GROUP BY "monedaId"
    ),
    -- ── Acumulado anual ───────────────────────────────────
    ing_anio AS (
      SELECT im."monedaId", ROUND(SUM(im.monto)::NUMERIC, 2)::FLOAT AS total
      FROM ingreso_montos im
      JOIN ingresos i ON im."ingresoId" = i.id
      WHERE i."fechaRecaudacion" >= v_inicio_anio
      GROUP BY im."monedaId"
    ),
    egr_anio AS (
      SELECT "monedaId", ROUND(SUM(monto)::NUMERIC, 2)::FLOAT AS total
      FROM egresos WHERE "fechaSalida" >= v_inicio_anio
      GROUP BY "monedaId"
    ),
    -- ── Cajas activas con saldos ──────────────────────────
    cajas_act AS (
      SELECT id, nombre, "esGeneral", "sociedadId", "tipoIngresoId"
      FROM cajas WHERE activa = true ORDER BY orden
    ),
    ip AS (
      SELECT i."cajaId", im."monedaId", SUM(im.monto)::FLOAT AS total
      FROM ingreso_montos im JOIN ingresos i ON im."ingresoId" = i.id
      WHERE i."cajaId" IN (SELECT id FROM cajas_act)
      GROUP BY i."cajaId", im."monedaId"
    ),
    is2 AS (
      SELECT i."cajaSecundariaId" AS "cajaId", im."monedaId", SUM(im.monto)::FLOAT AS total
      FROM ingreso_montos im JOIN ingresos i ON im."ingresoId" = i.id
      WHERE i."cajaSecundariaId" IN (SELECT id FROM cajas_act)
      GROUP BY i."cajaSecundariaId", im."monedaId"
    ),
    ea AS (
      SELECT "cajaId", "monedaId", SUM(monto)::FLOAT AS total
      FROM egresos WHERE "cajaId" IN (SELECT id FROM cajas_act)
      GROUP BY "cajaId", "monedaId"
    ),
    da AS (
      SELECT "cajaId", "monedaId", SUM(monto)::FLOAT AS total
      FROM donaciones WHERE "cajaId" IN (SELECT id FROM cajas_act)
      GROUP BY "cajaId", "monedaId"
    )
    SELECT jsonb_build_object(
      -- Catálogo de monedas
      'monedas', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'id', id, 'codigo', codigo, 'simbolo', simbolo,
          'esPrincipal', "esPrincipal", 'activa', activa, 'orden', orden
        ) ORDER BY "esPrincipal" DESC, orden), '[]')
        FROM monedas WHERE activa = true
      ),
      -- Totales del mes por moneda
      'ingresosMes', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object('monedaId', "monedaId", 'total', total)), '[]')
        FROM ing_mes
      ),
      'egresosMes', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object('monedaId', "monedaId", 'total', total)), '[]')
        FROM egr_mes
      ),
      -- Totales mes anterior
      'ingresosMesAnterior', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object('monedaId', "monedaId", 'total', total)), '[]')
        FROM ing_mes_ant
      ),
      'egresosMesAnterior', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object('monedaId', "monedaId", 'total', total)), '[]')
        FROM egr_mes_ant
      ),
      -- Acumulado anual
      'ingresosAnio', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object('monedaId', "monedaId", 'total', total)), '[]')
        FROM ing_anio
      ),
      'egresosAnio', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object('monedaId', "monedaId", 'total', total)), '[]')
        FROM egr_anio
      ),
      -- Cajas con saldos
      'cajasConSaldos', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', c.id,
            'nombre', c.nombre,
            'esGeneral', c."esGeneral",
            'saldos', (
              SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'monedaId', m.id,
                'saldo', ROUND((
                  CASE
                    WHEN (c."sociedadId" IS NOT NULL OR c."tipoIngresoId" IS NOT NULL)
                      THEN COALESCE(i2.total, 0) + COALESCE(i1.total, 0)
                    WHEN c."esGeneral"
                      THEN COALESCE(i1.total, 0) + COALESCE(d.total, 0)
                    ELSE COALESCE(i1.total, 0)
                  END - COALESCE(e.total, 0)
                )::NUMERIC, 2)::FLOAT
              )), '[]')
              FROM monedas m
              LEFT JOIN ip  i1 ON i1."cajaId" = c.id AND i1."monedaId" = m.id
              LEFT JOIN is2 i2 ON i2."cajaId" = c.id AND i2."monedaId" = m.id
              LEFT JOIN ea  e  ON e."cajaId"  = c.id AND  e."monedaId" = m.id
              LEFT JOIN da  d  ON d."cajaId"  = c.id AND  d."monedaId" = m.id
              WHERE m.activa = true
            )
          )
        ORDER BY (SELECT orden FROM cajas WHERE id = c.id)), '[]')
        FROM cajas_act c
      ),
      -- Últimos 5 ingresos
      'ultimosIngresos', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'id', i.id,
          'fechaRecaudacion', i."fechaRecaudacion",
          'sociedad',     jsonb_build_object('nombre', s.nombre),
          'tipoIngreso',  jsonb_build_object('nombre', ti.nombre),
          'caja',         jsonb_build_object('nombre', c.nombre),
          'montos', (
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
              'monto', im.monto::FLOAT,
              'moneda', jsonb_build_object('simbolo', m2.simbolo, 'codigo', m2.codigo)
            )), '[]')
            FROM ingreso_montos im
            JOIN monedas m2 ON m2.id = im."monedaId"
            WHERE im."ingresoId" = i.id
          )
        )), '[]')
        FROM (
          SELECT id, "fechaRecaudacion", "sociedadId", "tipoIngresoId", "cajaId", "creadoEn"
          FROM ingresos ORDER BY "creadoEn" DESC LIMIT 5
        ) i
        JOIN sociedades s  ON s.id  = i."sociedadId"
        JOIN tipos_ingreso ti ON ti.id = i."tipoIngresoId"
        JOIN cajas c        ON c.id  = i."cajaId"
      ),
      -- Últimos 5 egresos
      'ultimosEgresos', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'id', e.id,
          'fechaSalida', e."fechaSalida",
          'solicitante', e.solicitante,
          'monto',  e.monto::FLOAT,
          'tipoGasto', jsonb_build_object('nombre', tg.nombre),
          'caja',      jsonb_build_object('nombre', c.nombre),
          'moneda',    jsonb_build_object('simbolo', m.simbolo, 'codigo', m.codigo)
        )), '[]')
        FROM (
          SELECT id, "fechaSalida", solicitante, monto, "tipoGastoId", "cajaId", "monedaId", "creadoEn"
          FROM egresos ORDER BY "creadoEn" DESC LIMIT 5
        ) e
        JOIN tipos_gasto tg ON tg.id = e."tipoGastoId"
        JOIN cajas c        ON c.id  = e."cajaId"
        JOIN monedas m      ON m.id  = e."monedaId"
      ),
      -- Contadores simples
      'contadores', jsonb_build_object(
        'totalIngresos', (SELECT COUNT(*)::INT FROM ingresos WHERE "fechaRecaudacion" >= v_inicio_mes),
        'totalEgresos',  (SELECT COUNT(*)::INT FROM egresos  WHERE "fechaSalida"      >= v_inicio_mes),
        'totalCajas',    (SELECT COUNT(*)::INT FROM cajas    WHERE activa = true)
      )
    )
  );
END;
$$;


-- ============================================================
-- 2. fn_saldo_caja
-- Reemplaza obtenerSaldoCaja() en operaciones.ts
-- De 4 queries secuenciales → 1 query
-- ============================================================
CREATE OR REPLACE FUNCTION fn_saldo_caja(
  p_caja_id   TEXT,
  p_moneda_id TEXT DEFAULT NULL
)
RETURNS TABLE(
  "monedaId"      TEXT,
  "monedaCodigo"  TEXT,
  "monedaSimbolo" TEXT,
  ingresos        FLOAT,
  egresos         FLOAT,
  saldo           FLOAT
)
LANGUAGE SQL
STABLE
AS $$
  WITH
  caja_info AS (
    SELECT "esGeneral",
           ("sociedadId" IS NOT NULL OR "tipoIngresoId" IS NOT NULL) AS es_subcaja
    FROM cajas WHERE id = p_caja_id
  ),
  monedas_sel AS (
    SELECT id, codigo, simbolo, "esPrincipal", orden
    FROM monedas
    WHERE activa = true
      AND (p_moneda_id IS NULL OR id = p_moneda_id)
  ),
  ip AS (
    SELECT im."monedaId", ROUND(SUM(im.monto)::NUMERIC, 2)::FLOAT AS total
    FROM ingreso_montos im
    JOIN ingresos i ON im."ingresoId" = i.id
    WHERE i."cajaId" = p_caja_id
      AND (p_moneda_id IS NULL OR im."monedaId" = p_moneda_id)
    GROUP BY im."monedaId"
  ),
  is2 AS (
    SELECT im."monedaId", ROUND(SUM(im.monto)::NUMERIC, 2)::FLOAT AS total
    FROM ingreso_montos im
    JOIN ingresos i ON im."ingresoId" = i.id
    WHERE i."cajaSecundariaId" = p_caja_id
      AND (p_moneda_id IS NULL OR im."monedaId" = p_moneda_id)
    GROUP BY im."monedaId"
  ),
  da AS (
    SELECT "monedaId", ROUND(SUM(monto)::NUMERIC, 2)::FLOAT AS total
    FROM donaciones
    WHERE "cajaId" = p_caja_id
      AND (p_moneda_id IS NULL OR "monedaId" = p_moneda_id)
    GROUP BY "monedaId"
  ),
  ea AS (
    SELECT "monedaId", ROUND(SUM(monto)::NUMERIC, 2)::FLOAT AS total
    FROM egresos
    WHERE "cajaId" = p_caja_id
      AND (p_moneda_id IS NULL OR "monedaId" = p_moneda_id)
    GROUP BY "monedaId"
  )
  SELECT
    m.id      AS "monedaId",
    m.codigo  AS "monedaCodigo",
    m.simbolo AS "monedaSimbolo",
    ROUND((
      CASE WHEN ci.es_subcaja
        THEN COALESCE(i2.total, 0) + COALESCE(i1.total, 0)
        ELSE COALESCE(i1.total, 0)
           + CASE WHEN ci."esGeneral" THEN COALESCE(d.total, 0) ELSE 0 END
      END
    )::NUMERIC, 2)::FLOAT                          AS ingresos,
    ROUND(COALESCE(e.total, 0)::NUMERIC, 2)::FLOAT AS egresos,
    ROUND((
      CASE WHEN ci.es_subcaja
        THEN COALESCE(i2.total, 0) + COALESCE(i1.total, 0)
        ELSE COALESCE(i1.total, 0)
           + CASE WHEN ci."esGeneral" THEN COALESCE(d.total, 0) ELSE 0 END
      END - COALESCE(e.total, 0)
    )::NUMERIC, 2)::FLOAT                          AS saldo
  FROM monedas_sel m
  CROSS JOIN caja_info ci
  LEFT JOIN ip  i1 ON i1."monedaId" = m.id
  LEFT JOIN is2 i2 ON i2."monedaId" = m.id
  LEFT JOIN da  d  ON  d."monedaId" = m.id
  LEFT JOIN ea  e  ON  e."monedaId" = m.id
  ORDER BY m."esPrincipal" DESC, m.orden;
$$;


-- ============================================================
-- 3. fn_cajas_con_saldos
-- Reemplaza obtenerCajasConSaldos() en operaciones.ts
-- De 8+ queries + JS loops → 1 query
-- ============================================================
CREATE OR REPLACE FUNCTION fn_cajas_con_saldos()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_cajas_reales    JSONB;
  v_caja_don        JSONB := '[]'::JSONB;
  v_caja_fil        JSONB := '[]'::JSONB;
  v_monedas         JSONB;
  v_tiene_fil       BOOLEAN;
  v_tiene_don_track BOOLEAN;
  v_tiene_data_fil  BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM cajas
                WHERE nombre = 'Filiales' AND activa = true AND "esGeneral" = false)
    INTO v_tiene_fil;

  SELECT EXISTS(SELECT 1 FROM donaciones_tracking LIMIT 1)
    INTO v_tiene_don_track;

  SELECT EXISTS(SELECT 1 FROM diezmos_filiales LIMIT 1)
      OR EXISTS(SELECT 1 FROM egresos_filiales  LIMIT 1)
    INTO v_tiene_data_fil;

  -- ── Cajas reales ──────────────────────────────────────────
  WITH
  mon AS (
    SELECT id, codigo, simbolo, "esPrincipal", orden
    FROM monedas WHERE activa = true
    ORDER BY "esPrincipal" DESC, orden
  ),
  caj AS (
    SELECT c.id, c.nombre, c.descripcion, c."esGeneral",
           c."sociedadId", c."tipoIngresoId",
           c.orden, c.activa,
           s.nombre  AS sociedad_nombre,
           ti.nombre AS tipo_ingreso_nombre
    FROM cajas c
    LEFT JOIN sociedades   s  ON s.id  = c."sociedadId"
    LEFT JOIN tipos_ingreso ti ON ti.id = c."tipoIngresoId"
    WHERE c.activa = true
    ORDER BY c.orden
  ),
  ip AS (
    SELECT i."cajaId", im."monedaId", SUM(im.monto)::FLOAT AS total
    FROM ingreso_montos im JOIN ingresos i ON im."ingresoId" = i.id
    WHERE i."cajaId" IN (SELECT id FROM caj)
    GROUP BY i."cajaId", im."monedaId"
  ),
  is2 AS (
    SELECT i."cajaSecundariaId" AS "cajaId", im."monedaId", SUM(im.monto)::FLOAT AS total
    FROM ingreso_montos im JOIN ingresos i ON im."ingresoId" = i.id
    WHERE i."cajaSecundariaId" IS NOT NULL
      AND i."cajaSecundariaId" IN (SELECT id FROM caj)
    GROUP BY i."cajaSecundariaId", im."monedaId"
  ),
  ea AS (
    SELECT "cajaId", "monedaId", SUM(monto)::FLOAT AS total
    FROM egresos WHERE "cajaId" IN (SELECT id FROM caj)
    GROUP BY "cajaId", "monedaId"
  ),
  da AS (
    SELECT "cajaId", "monedaId", SUM(monto)::FLOAT AS total
    FROM donaciones WHERE "cajaId" IN (SELECT id FROM caj)
    GROUP BY "cajaId", "monedaId"
  ),
  df AS (
    SELECT "monedaId", SUM(monto)::FLOAT AS total
    FROM diezmos_filiales GROUP BY "monedaId"
  ),
  ef AS (
    SELECT "monedaId", SUM(monto)::FLOAT AS total
    FROM egresos_filiales GROUP BY "monedaId"
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id',             c.id,
      'nombre',         c.nombre,
      'descripcion',    c.descripcion,
      'activa',         c.activa,
      'esGeneral',      c."esGeneral",
      'sociedadId',     c."sociedadId",
      'tipoIngresoId',  c."tipoIngresoId",
      'orden',          c.orden,
      'esVirtual',      false,
      'sociedad',   CASE WHEN c.sociedad_nombre    IS NOT NULL
                      THEN jsonb_build_object('nombre', c.sociedad_nombre)    ELSE NULL END,
      'tipoIngreso', CASE WHEN c.tipo_ingreso_nombre IS NOT NULL
                      THEN jsonb_build_object('nombre', c.tipo_ingreso_nombre) ELSE NULL END,
      'saldos', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'monedaId',      m.id,
          'monedaCodigo',  m.codigo,
          'monedaSimbolo', m.simbolo,
          'ingresos', ROUND((
            CASE
              WHEN (c."sociedadId" IS NOT NULL OR c."tipoIngresoId" IS NOT NULL)
                THEN COALESCE(i2.total, 0) + COALESCE(i1.total, 0)
              WHEN c."esGeneral"
                THEN COALESCE(i1.total, 0) + COALESCE(d.total, 0)
              ELSE COALESCE(i1.total, 0)
            END
            + CASE WHEN c.nombre = 'Filiales' AND NOT c."esGeneral"
                THEN COALESCE(diezf.total, 0) ELSE 0 END
          )::NUMERIC, 2)::FLOAT,
          'egresos', ROUND((
            COALESCE(e.total, 0)
            + CASE WHEN c.nombre = 'Filiales' AND NOT c."esGeneral"
                THEN COALESCE(egrf.total, 0) ELSE 0 END
          )::NUMERIC, 2)::FLOAT,
          'saldo', ROUND((
            CASE
              WHEN (c."sociedadId" IS NOT NULL OR c."tipoIngresoId" IS NOT NULL)
                THEN COALESCE(i2.total, 0) + COALESCE(i1.total, 0)
              WHEN c."esGeneral"
                THEN COALESCE(i1.total, 0) + COALESCE(d.total, 0)
              ELSE COALESCE(i1.total, 0)
            END
            + CASE WHEN c.nombre = 'Filiales' AND NOT c."esGeneral"
                THEN COALESCE(diezf.total, 0) ELSE 0 END
            - COALESCE(e.total, 0)
            - CASE WHEN c.nombre = 'Filiales' AND NOT c."esGeneral"
                THEN COALESCE(egrf.total, 0) ELSE 0 END
          )::NUMERIC, 2)::FLOAT
        )), '[]')
        FROM mon m
        LEFT JOIN ip  i1   ON i1."cajaId"  = c.id AND i1."monedaId" = m.id
        LEFT JOIN is2 i2   ON i2."cajaId"  = c.id AND i2."monedaId" = m.id
        LEFT JOIN ea  e    ON  e."cajaId"  = c.id AND  e."monedaId" = m.id
        LEFT JOIN da  d    ON  d."cajaId"  = c.id AND  d."monedaId" = m.id
        LEFT JOIN df  diezf ON diezf."monedaId" = m.id
        LEFT JOIN ef  egrf  ON  egrf."monedaId" = m.id
      )
    ) ORDER BY c.orden
  ), '[]') INTO v_cajas_reales
  FROM caj c;

  -- ── Caja virtual "Donaciones" ─────────────────────────────
  IF v_tiene_don_track THEN
    SELECT jsonb_build_array(jsonb_build_object(
      'id', 'virtual-donaciones', 'nombre', 'Donaciones',
      'descripcion', 'Resumen de todas las donaciones recibidas',
      'activa', true, 'esGeneral', false,
      'sociedadId', NULL, 'tipoIngresoId', NULL,
      'orden', 9998, 'esVirtual', true,
      'sociedad', NULL, 'tipoIngreso', NULL,
      'saldos', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'monedaId',      m.id,
          'monedaCodigo',  m.codigo,
          'monedaSimbolo', m.simbolo,
          'ingresos', ROUND(COALESCE(dt.total, 0)::NUMERIC, 2)::FLOAT,
          'egresos',  0::FLOAT,
          'saldo',    ROUND(COALESCE(dt.total, 0)::NUMERIC, 2)::FLOAT
        )), '[]')
        FROM monedas m
        LEFT JOIN (
          SELECT "monedaId", SUM(monto)::FLOAT AS total
          FROM donaciones_tracking GROUP BY "monedaId"
        ) dt ON dt."monedaId" = m.id
        WHERE m.activa = true
        ORDER BY m."esPrincipal" DESC, m.orden
      )
    )) INTO v_caja_don;
  END IF;

  -- ── Caja virtual "Filiales" (solo si no existe real) ──────
  IF NOT v_tiene_fil AND v_tiene_data_fil THEN
    SELECT jsonb_build_array(jsonb_build_object(
      'id', 'virtual-filiales', 'nombre', 'Filiales',
      'descripcion', 'Diezmos y egresos de todas las filiales',
      'activa', true, 'esGeneral', false,
      'sociedadId', NULL, 'tipoIngresoId', NULL,
      'orden', 9999, 'esVirtual', true,
      'sociedad', NULL, 'tipoIngreso', NULL,
      'saldos', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'monedaId',      m.id,
          'monedaCodigo',  m.codigo,
          'monedaSimbolo', m.simbolo,
          'ingresos', ROUND(COALESCE(dz.total, 0)::NUMERIC, 2)::FLOAT,
          'egresos',  ROUND(COALESCE(ef.total, 0)::NUMERIC, 2)::FLOAT,
          'saldo',    ROUND((COALESCE(dz.total, 0) - COALESCE(ef.total, 0))::NUMERIC, 2)::FLOAT
        )), '[]')
        FROM monedas m
        LEFT JOIN (SELECT "monedaId", SUM(monto)::FLOAT AS total FROM diezmos_filiales GROUP BY "monedaId") dz ON dz."monedaId" = m.id
        LEFT JOIN (SELECT "monedaId", SUM(monto)::FLOAT AS total FROM egresos_filiales  GROUP BY "monedaId") ef ON ef."monedaId" = m.id
        WHERE m.activa = true
        ORDER BY m."esPrincipal" DESC, m.orden
      )
    )) INTO v_caja_fil;
  END IF;

  -- ── Monedas serializadas ──────────────────────────────────
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', id, 'codigo', codigo, 'nombre', nombre, 'simbolo', simbolo,
    'activa', activa, 'esPrincipal', "esPrincipal",
    'tasaCambio', "tasaCambio"::FLOAT, 'orden', orden
  ) ORDER BY "esPrincipal" DESC, orden), '[]')
  FROM monedas WHERE activa = true
  INTO v_monedas;

  RETURN jsonb_build_object(
    'cajas',   v_cajas_reales || v_caja_don || v_caja_fil,
    'monedas', v_monedas
  );
END;
$$;


-- ============================================================
-- 4. fn_saldo_filiales
-- Reemplaza obtenerSaldoFiliales() en filiales.ts
-- De 3 queries → 1 query
-- ============================================================
CREATE OR REPLACE FUNCTION fn_saldo_filiales()
RETURNS TABLE(
  "monedaId"      TEXT,
  "monedaCodigo"  TEXT,
  "monedaSimbolo" TEXT,
  ingresos        FLOAT,
  egresos         FLOAT,
  saldo           FLOAT
)
LANGUAGE SQL
STABLE
AS $$
  WITH
  dz AS (
    SELECT "monedaId", ROUND(SUM(monto)::NUMERIC, 2)::FLOAT AS total
    FROM diezmos_filiales GROUP BY "monedaId"
  ),
  ef AS (
    SELECT "monedaId", ROUND(SUM(monto)::NUMERIC, 2)::FLOAT AS total
    FROM egresos_filiales GROUP BY "monedaId"
  )
  SELECT
    m.id      AS "monedaId",
    m.codigo  AS "monedaCodigo",
    m.simbolo AS "monedaSimbolo",
    ROUND(COALESCE(d.total, 0)::NUMERIC, 2)::FLOAT                          AS ingresos,
    ROUND(COALESCE(e.total, 0)::NUMERIC, 2)::FLOAT                          AS egresos,
    ROUND((COALESCE(d.total, 0) - COALESCE(e.total, 0))::NUMERIC, 2)::FLOAT AS saldo
  FROM monedas m
  LEFT JOIN dz d ON d."monedaId" = m.id
  LEFT JOIN ef e ON e."monedaId" = m.id
  WHERE m.activa = true
  ORDER BY m."esPrincipal" DESC, m.orden;
$$;


-- ============================================================
-- 5. fn_resumen_filiales
-- Reemplaza obtenerResumenFiliales() en filiales.ts
-- De 4 queries + JS aggregation → 1 query
-- ============================================================
CREATE OR REPLACE FUNCTION fn_resumen_filiales()
RETURNS JSONB
LANGUAGE SQL
STABLE
AS $$
  WITH
  mon AS (
    SELECT id, codigo, simbolo, "esPrincipal", "tasaCambio"::FLOAT AS "tasaCambio", orden, nombre, activa
    FROM monedas WHERE activa = true
    ORDER BY "esPrincipal" DESC, orden
  ),
  fil AS (
    SELECT f.id, f.nombre, f.pastor, f.activa, f.orden,
           p.id AS "paisId", p.nombre AS "paisNombre"
    FROM filiales f
    JOIN paises p ON p.id = f."paisId"
    WHERE f.activa = true
    ORDER BY f.orden
  ),
  dz_fil AS (
    SELECT "filialId", "monedaId", ROUND(SUM(monto)::NUMERIC, 2)::FLOAT AS total
    FROM diezmos_filiales GROUP BY "filialId", "monedaId"
  ),
  dz_mon AS (
    SELECT "monedaId", ROUND(SUM(monto)::NUMERIC, 2)::FLOAT AS total
    FROM diezmos_filiales GROUP BY "monedaId"
  ),
  ef_mon AS (
    SELECT "monedaId", ROUND(SUM(monto)::NUMERIC, 2)::FLOAT AS total
    FROM egresos_filiales GROUP BY "monedaId"
  )
  SELECT jsonb_build_object(
    'filiales', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id',     f.id,
        'nombre', f.nombre,
        'pastor', f.pastor,
        'activa', f.activa,
        'orden',  f.orden,
        'pais',   jsonb_build_object('id', f."paisId", 'nombre', f."paisNombre"),
        'saldos', (
          SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'monedaId',      m.id,
            'monedaCodigo',  m.codigo,
            'monedaSimbolo', m.simbolo,
            'total', ROUND(COALESCE(d.total, 0)::NUMERIC, 2)::FLOAT
          )), '[]')
          FROM mon m
          LEFT JOIN dz_fil d ON d."filialId" = f.id AND d."monedaId" = m.id
        )
      ) ORDER BY f.orden), '[]')
      FROM fil f
    ),
    'totalesGenerales', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'monedaId',      m.id,
        'monedaCodigo',  m.codigo,
        'monedaSimbolo', m.simbolo,
        'totalIngresos', ROUND(COALESCE(d.total, 0)::NUMERIC, 2)::FLOAT,
        'totalEgresos',  ROUND(COALESCE(e.total, 0)::NUMERIC, 2)::FLOAT,
        'saldo',         ROUND((COALESCE(d.total, 0) - COALESCE(e.total, 0))::NUMERIC, 2)::FLOAT
      )), '[]')
      FROM mon m
      LEFT JOIN dz_mon d ON d."monedaId" = m.id
      LEFT JOIN ef_mon e ON e."monedaId" = m.id
    ),
    'monedas', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', id, 'codigo', codigo, 'nombre', nombre, 'simbolo', simbolo,
        'activa', activa, 'esPrincipal', "esPrincipal",
        'tasaCambio', "tasaCambio", 'orden', orden
      ) ORDER BY "esPrincipal" DESC, orden), '[]')
      FROM mon
    ),
    'tiposGasto', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'nombre', nombre) ORDER BY orden), '[]')
      FROM tipos_gasto WHERE activo = true
    )
  );
$$;
