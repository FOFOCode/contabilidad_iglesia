import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { monto } = await request.json();
    
    // Test del redondeo
    const montoFloat = parseFloat(monto);
    const redondeoSimple = Math.round(montoFloat * 100) / 100;
    const redondeoMejorado = Number((Math.round(montoFloat * 10000) / 10000).toFixed(2));
    
    return NextResponse.json({
      original: monto,
      parseFloat: montoFloat,
      redondeoSimple,
      redondeoMejorado,
      diferencia: Math.abs(redondeoMejorado - redondeoSimple)
    });
    
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}