-- Script para crear las tablas cdrs y grupos_asignacion
-- Ejecutar este script en la base de datos PostgreSQL

-- Crear tabla cdrs
CREATE TABLE IF NOT EXISTS "cdrs" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "gerente_talento_cultura" TEXT NOT NULL,
    "gerente_cdr" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cdrs_pkey" PRIMARY KEY ("id")
);

-- Crear tabla grupos_asignacion
CREATE TABLE IF NOT EXISTS "grupos_asignacion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grupos_asignacion_pkey" PRIMARY KEY ("id")
);
