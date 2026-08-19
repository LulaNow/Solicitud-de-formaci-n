-- Tablas para integración con n8n
-- Ejecutar este script en la base de datos PostgreSQL

-- Tabla de solicitudes
CREATE TABLE IF NOT EXISTS solicitudes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_ticket VARCHAR(20) UNIQUE,
    usuario_id UUID NOT NULL,
    tipo_proceso VARCHAR(50),
    estado VARCHAR(20) DEFAULT 'abierto',
    datos_entrada JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para solicitudes
CREATE INDEX IF NOT EXISTS idx_solicitudes_usuario_id ON solicitudes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_tipo_proceso ON solicitudes(tipo_proceso);
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado ON solicitudes(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_created_at ON solicitudes(created_at);

-- Tabla de tareas de flujo
CREATE TABLE IF NOT EXISTS tareas_flujo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitud_id UUID REFERENCES solicitudes(id) ON DELETE CASCADE,
    nombre_tarea VARCHAR(100),
    asignado_a_rol VARCHAR(50),
    estado_tarea VARCHAR(20) DEFAULT 'pendiente',
    resultado_json JSONB,
    webhook_resume_url TEXT,
    vencimiento_sla TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para tareas_flujo
CREATE INDEX IF NOT EXISTS idx_tareas_flujo_solicitud_id ON tareas_flujo(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_tareas_flujo_asignado_a_rol ON tareas_flujo(asignado_a_rol);
CREATE INDEX IF NOT EXISTS idx_tareas_flujo_estado_tarea ON tareas_flujo(estado_tarea);
CREATE INDEX IF NOT EXISTS idx_tareas_flujo_vencimiento_sla ON tareas_flujo(vencimiento_sla);

-- Tabla de historial de pasos
CREATE TABLE IF NOT EXISTS historial_pasos (
    id SERIAL PRIMARY KEY,
    solicitud_id UUID REFERENCES solicitudes(id),
    paso_nombre TEXT,
    detalles TEXT,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para historial_pasos
CREATE INDEX IF NOT EXISTS idx_historial_pasos_solicitud_id ON historial_pasos(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_historial_pasos_fecha ON historial_pasos(fecha);

-- Comentarios para documentación
COMMENT ON TABLE solicitudes IS 'Tabla principal para gestión de solicitudes integradas con n8n';
COMMENT ON COLUMN solicitudes.numero_ticket IS 'Número único de ticket, ej: REQ-1001';
COMMENT ON COLUMN solicitudes.tipo_proceso IS 'Tipo de proceso, ej: alta_cliente, responsable_sanitario';
COMMENT ON COLUMN solicitudes.estado IS 'Estado de la solicitud: abierto, espera, cerrado, cancelado';
COMMENT ON COLUMN solicitudes.datos_entrada IS 'Datos del formulario inicial en formato JSON';

COMMENT ON TABLE tareas_flujo IS 'Tareas individuales dentro del flujo de una solicitud';
COMMENT ON COLUMN tareas_flujo.nombre_tarea IS 'Nombre de la tarea, ej: Aprobación de Gerencia';
COMMENT ON COLUMN tareas_flujo.asignado_a_rol IS 'Rol asignado, ej: admin, validador';
COMMENT ON COLUMN tareas_flujo.estado_tarea IS 'Estado: pendiente, completada, rechazada';
COMMENT ON COLUMN tareas_flujo.resultado_json IS 'Respuesta del usuario en formato JSON';
COMMENT ON COLUMN tareas_flujo.webhook_resume_url IS 'URL para reanudar el flujo en n8n';
COMMENT ON COLUMN tareas_flujo.vencimiento_sla IS 'Fecha límite para cumplir SLA';

COMMENT ON TABLE historial_pasos IS 'Registro de todos los pasos ejecutados en una solicitud';
