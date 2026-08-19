import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { requirePermission } from "../trpc";
import { TRPCError } from "@trpc/server";
import { decryptJson } from "@/lib/security/encryption";

export const requestsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        status: z.enum(["PENDING", "IN_PROGRESS", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
        formId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.requestRegistry.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        where: {
          ...(input.status ? { status: input.status } : {}),
          ...(input.formId ? { formId: input.formId } : {}),
        },
        orderBy: { createdAt: "desc" },
        include: {
          form: { select: { name: true, slug: true } },
          submittedBy: { select: { name: true, email: true } },
        },
      });

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        const nextItem = items.pop();
        nextCursor = nextItem?.id;
      }

      return {
        items: items.map((item) => ({
          ...item,
          submittedData: undefined,
        })),
        nextCursor,
      };
    }),

  getById: requirePermission("requests.read")
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const request = await ctx.prisma.requestRegistry.findUnique({
        where: { id: input },
        include: {
          form: { include: { fields: { orderBy: { order: "asc" } } } },
          submittedBy: { select: { name: true, email: true } },
        },
      });
      if (!request) throw new TRPCError({ code: "NOT_FOUND" });

      let decryptedData: Record<string, unknown> = {};
      try {
        decryptedData = decryptJson(request.submittedData);
      } catch {
        decryptedData = { error: "No se pudo descifrar los datos" };
      }

      return {
        ...request,
        submittedData: decryptedData,
      };
    }),

  updateStatus: requirePermission("requests.manage")
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["PENDING", "IN_PROGRESS", "APPROVED", "REJECTED", "CANCELLED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.requestRegistry.update({
        where: { id: input.id },
        data: {
          status: input.status,
          processedAt: ["APPROVED", "REJECTED", "CANCELLED"].includes(input.status) ? new Date() : null,
        },
      });

      await ctx.prisma.auditLog.create({
        data: {
          userId: ctx.user.id,
          action: "UPDATE_STATUS",
          entity: "RequestRegistry",
          entityId: input.id,
          changes: { status: input.status },
        },
      });

      return { success: true };
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const userEmail = ctx.user.email;

    const [total, pending, inProgress, approved, rejected, assignedTasks] = await Promise.all([
      // Total: todas las solicitudes del usuario
      ctx.prisma.solicitud.count({ where: { usuarioId: userId } }),
      // Pendientes: estado "Pendiente"
      ctx.prisma.solicitud.count({ where: { usuarioId: userId, estado: "Pendiente" } }),
      // En Proceso: estado "abierto" o "Activa"
      ctx.prisma.solicitud.count({
        where: {
          usuarioId: userId,
          estado: { in: ["abierto", "Activa"] }
        }
      }),
      // Aprobadas: estado "Completado"
      ctx.prisma.solicitud.count({ where: { usuarioId: userId, estado: "Completado" } }),
      // Rechazadas: estado "Rechazado"
      ctx.prisma.solicitud.count({ where: { usuarioId: userId, estado: "Rechazado" } }),
      // Tareas asignadas
      ctx.prisma.tareaFlujo.count({ where: { asignadoARol: userEmail } }),
    ]);
    return { total, pending, inProgress, approved, rejected, assignedTasks };
  }),

  assignedTasks: protectedProcedure.query(async ({ ctx }) => {
    const userEmail = ctx.user.email;

    const tareas = await ctx.prisma.tareaFlujo.findMany({
      where: { asignadoARol: userEmail },
      include: {
        solicitud: {
          include: {
            tareasFlujo: true,
            historialPasos: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const tareasConUsuario = await Promise.all(
      tareas.map(async (tarea) => {
        let usuarioCreador = null;
        if (tarea.solicitud.usuarioId) {
          usuarioCreador = await ctx.prisma.user.findUnique({
            where: { id: tarea.solicitud.usuarioId },
            select: { name: true, email: true },
          });
        }

        return {
          id: tarea.id,
          numeroTicket: tarea.solicitud.numeroTicket || null,
          nombreSolicitud: tarea.solicitud.tipoProceso || "Sin descripción",
          usuarioCreador: usuarioCreador?.name || "Usuario desconocido",
          nombreTarea: tarea.nombreTarea || "Sin nombre",
          tipoTarea: tarea.tipoTarea || "Tarea",
          estadoTarea: tarea.estadoTarea,
          createdAt: tarea.createdAt,
          solicitudId: tarea.solicitudId,
        };
      })
    );

    return tareasConUsuario;
  }),

  getTaskDetail: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const tarea = await ctx.prisma.tareaFlujo.findUnique({
        where: { id: input },
        include: {
          solicitud: true,
        },
      });

      if (!tarea) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tarea no encontrada" });
      }

      let usuarioCreador = null;
      if (tarea.solicitud.usuarioId) {
        usuarioCreador = await ctx.prisma.user.findUnique({
          where: { id: tarea.solicitud.usuarioId },
          select: { name: true, email: true },
        });
      }

      let datosEntrada: Record<string, unknown> = {};
      if (tarea.solicitud.datosEntrada) {
        try {
          datosEntrada = tarea.solicitud.datosEntrada as Record<string, unknown>;
        } catch {
          datosEntrada = {};
        }
      }

      let cdrDescripcion = null;
      if (datosEntrada.cdr) {
        const cdr = await ctx.prisma.cdr.findFirst({
          where: { valor: datosEntrada.cdr as string },
        });
        cdrDescripcion = cdr?.nombre || null;
      }

      return {
        id: tarea.id,
        numeroTicket: tarea.solicitud.numeroTicket || "Sin número",
        nombreSolicitud: tarea.solicitud.tipoProceso || "Sin descripción",
        usuarioCreador: usuarioCreador?.name || "Usuario desconocido",
        emailCreador: usuarioCreador?.email || "",
        nombreTarea: tarea.nombreTarea || "Sin nombre",
        tipoTarea: tarea.tipoTarea || "Tarea",
        estadoTarea: tarea.estadoTarea,
        estadoSolicitud: tarea.solicitud.estado,
        createdAt: tarea.createdAt,
        solicitudCreatedAt: tarea.solicitud.createdAt,
        solicitudId: tarea.solicitudId,
        datosEntrada,
        cdrDescripcion,
        webhookResumeUrl: tarea.webhookResumeUrl,
      };
    }),

  closeTask: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        status: z.enum(["completo", "incompleto"]),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tarea = await ctx.prisma.tareaFlujo.findUnique({
        where: { id: input.taskId },
      });

      if (!tarea) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tarea no encontrada" });
      }

      await ctx.prisma.tareaFlujo.update({
        where: { id: input.taskId },
        data: {
          estadoTarea: input.status === "completo" ? "Completada" : "Incompleta",
          resultadoJson: {
            status: input.status,
            comments: input.comments || "",
            closedBy: ctx.user.email,
            closedAt: new Date().toISOString(),
          },
        },
      });

      await ctx.prisma.historialPaso.create({
        data: {
          solicitudId: tarea.solicitudId,
          pasoNombre: `Tarea cerrada: ${input.status}`,
          detalles: input.comments || "Sin comentarios",
        },
      });

      return { success: true };
    }),

  saveParametros: protectedProcedure
    .input(
      z.object({
        numeroTicket: z.string(),
        parametros: z.array(
          z.object({
            nombre: z.string(),
            porcentajeAsignado: z.string(),
            cumple: z.boolean(),
            noCumple: z.boolean(),
          })
        ),
        totalCosto: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Calcular porcentaje total asignado
      const porcentajeTotal = input.parametros.reduce((sum, param) => {
        const porcentaje = parseFloat(param.porcentajeAsignado) || 0;
        return sum + porcentaje;
      }, 0);

      // Calcular monto de beca (porcentaje del total)
      const montoBeca = (input.totalCosto * porcentajeTotal) / 100;

      // Verificar si ya existe un registro para este ticket
      const existente = await ctx.prisma.parametro.findFirst({
        where: { numeroTicket: input.numeroTicket },
      });

      if (existente) {
        // Actualizar registro existente
        const parametro = await ctx.prisma.parametro.update({
          where: { id: existente.id },
          data: {
            jsonParametros: input.parametros,
            porcentajeAsignado: porcentajeTotal,
            montoBeca: montoBeca,
          },
        });

        return {
          success: true,
          parametro,
          porcentajeTotal,
          montoBeca,
        };
      } else {
        // Crear nuevo registro
        const parametro = await ctx.prisma.parametro.create({
          data: {
            numeroTicket: input.numeroTicket,
            jsonParametros: input.parametros,
            porcentajeAsignado: porcentajeTotal,
            montoBeca: montoBeca,
          },
        });

        return {
          success: true,
          parametro,
          porcentajeTotal,
          montoBeca,
        };
      }
    }),

  getParametros: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const parametro = await ctx.prisma.parametro.findFirst({
        where: { numeroTicket: input },
      });

      return parametro;
    }),

  mySolicitudes: protectedProcedure
    .query(async ({ ctx }) => {
      const solicitudes = await ctx.prisma.solicitud.findMany({
        where: {
          usuarioId: ctx.user.id,
        },
        include: {
          tareasFlujo: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return solicitudes;
    }),

  getSolicitudDetail: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const solicitud = await ctx.prisma.solicitud.findUnique({
        where: {
          id: input,
        },
        include: {
          tareasFlujo: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      if (!solicitud) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Solicitud no encontrada',
        });
      }

      // Verificar que el usuario sea el dueño de la solicitud
      if (solicitud.usuarioId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No tienes permiso para ver esta solicitud',
        });
      }

      return solicitud;
    }),

  reporteSolicitudes: protectedProcedure
    .query(async ({ ctx }) => {
      // Verificar que el usuario tenga permisos (Administrador o Usuario Interno)
      const hasAccess = ctx.user.roles.includes("Administrador") ||
                        ctx.user.roles.includes("Usuario Interno");

      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No tienes permiso para ver este reporte',
        });
      }

      // Obtener todas las solicitudes con sus parámetros
      const solicitudes = await ctx.prisma.solicitud.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Obtener todos los parámetros
      const parametros = await ctx.prisma.parametro.findMany();
      const parametrosMap = new Map(
        parametros.map(p => [p.numeroTicket, p])
      );

      // Combinar datos
      const reporte = solicitudes.map(solicitud => {
        const datosEntrada = solicitud.datosEntrada as Record<string, any> || {};
        const parametro = solicitud.numeroTicket ? parametrosMap.get(solicitud.numeroTicket) : null;

        return {
          numeroTicket: solicitud.numeroTicket || '',
          convocatoria: solicitud.convocatoria || '',
          cdr: datosEntrada.cdr || '',
          evento: datosEntrada.evento || '',
          modalidad: datosEntrada.modalidad || '',
          tipo: datosEntrada.tipo || '',
          noEmpleado: datosEntrada.no_empleado || '',
          nombre: datosEntrada.nombre || '',
          fechaIngreso: datosEntrada.fecha_ingreso || '',
          puesto: datosEntrada.puesto || '',
          antiguedad: datosEntrada.antiguedad || '',
          ceco: datosEntrada.ceco || '',
          funciones: datosEntrada.funciones || '',
          participantes: datosEntrada.participantes || '',
          areas: datosEntrada.areas || '',
          nombreCurso: datosEntrada.nombre_curso || '',
          institucion: datosEntrada.institucion || '',
          duracion: datosEntrada.duracion || '',
          tipoPrograma: datosEntrada.tipo_programa || '',
          fechaInicio: datosEntrada.fecha_inicio || '',
          fechaFin: datosEntrada.fecha_fin || '',
          beneficio: datosEntrada.beneficio || '',
          tipoMoneda: datosEntrada.tipo_moneda || '',
          costo: datosEntrada.costo || '',
          tipoIva: datosEntrada.tipo_iva || '',
          iva: datosEntrada.iva || '',
          retencionIva: datosEntrada.retencion_iva || '',
          retencionIsr: datosEntrada.retencion_isr || '',
          total: datosEntrada.total || '',
          porcentajeAsignado: parametro?.porcentajeAsignado?.toString() || '',
          montoBeca: parametro?.montoBeca?.toString() || '',
          autorizador: datosEntrada.autorizador || '',
          estado: solicitud.estado || '',
          createdAt: solicitud.createdAt,
        };
      });

      return reporte;
    }),
});
