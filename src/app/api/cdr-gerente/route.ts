import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cdr = searchParams.get('cdr');

    if (!cdr) {
      return NextResponse.json(
        { success: false, error: 'CDR es requerido' },
        { status: 400 }
      );
    }

    console.log('[API CDR Gerente] Consultando CDR:', cdr);

    // Buscar el CDR en la tabla cdrs
    const cdrData = await prisma.cdr.findFirst({
      where: { valor: cdr },
    });

    if (!cdrData) {
      console.log('[API CDR Gerente] CDR no encontrado');
      return NextResponse.json({
        success: false,
        error: 'CDR no encontrado',
      });
    }

    console.log('[API CDR Gerente] CDR encontrado:', cdrData);
    console.log('[API CDR Gerente] Gerente CDR (correo):', cdrData.gerenteCdr);

    // Buscar el usuario por correo electrónico
    const usuario = await prisma.user.findFirst({
      where: { email: cdrData.gerenteCdr },
      select: {
        name: true,
        email: true,
      },
    });

    if (usuario) {
      console.log('[API CDR Gerente] Usuario encontrado:', usuario.name);
      return NextResponse.json({
        success: true,
        gerenteCdr: cdrData.gerenteCdr,
        nombreGerente: usuario.name,
      });
    } else {
      console.log('[API CDR Gerente] Usuario no encontrado, usando correo como nombre');
      return NextResponse.json({
        success: true,
        gerenteCdr: cdrData.gerenteCdr,
        nombreGerente: cdrData.gerenteCdr, // Usar correo si no se encuentra el usuario
      });
    }
  } catch (error) {
    console.error('[API CDR Gerente] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al consultar gerente CDR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
