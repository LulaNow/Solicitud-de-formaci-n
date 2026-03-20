"use client";

import { trpc } from "@/lib/trpc/client";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import {
  ClipboardList, Plus, Edit2, Trash2, User, Calendar,
  Clock, CheckCircle, XCircle, AlertCircle,
} from "lucide-react";

const statusConfig: Record<string, { text: string; class: string; icon: React.ComponentType<{ className?: string }> }> = {
  PENDING: { text: "Pendiente", class: "bg-amber-100 text-amber-700", icon: Clock },
  IN_PROGRESS: { text: "En Proceso", class: "bg-blue-100 text-blue-700", icon: AlertCircle },
  COMPLETED: { text: "Completada", class: "bg-green-100 text-green-700", icon: CheckCircle },
  CANCELLED: { text: "Cancelada", class: "bg-gray-100 text-gray-700", icon: XCircle },
};

export default function TasksPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAssignee, setNewAssignee] = useState("");

  const { data, isLoading, refetch } = trpc.tasks.list.useQuery({
    limit: 50,
    status: statusFilter as "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | undefined || undefined,
  });
  const { data: internalUsers } = trpc.tasks.internalUsers.useQuery();
  const createTask = trpc.tasks.create.useMutation({ onSuccess: () => { refetch(); resetForm(); } });
  const updateTask = trpc.tasks.update.useMutation({ onSuccess: () => { refetch(); setEditingTask(null); } });
  const deleteTask = trpc.tasks.delete.useMutation({ onSuccess: () => refetch() });

  function resetForm() {
    setNewName("");
    setNewDescription("");
    setNewAssignee("");
    setShowCreateModal(false);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    createTask.mutate({
      name: newName,
      description: newDescription || undefined,
      assignedToId: newAssignee || undefined,
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tareas</h1>
          <p className="text-sm text-gray-500">Gestión de tareas con auditoría</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-600 hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          Nueva Tarea
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        {[
          { value: "", label: "Todas" },
          { value: "PENDING", label: "Pendientes" },
          { value: "IN_PROGRESS", label: "En Proceso" },
          { value: "COMPLETED", label: "Completadas" },
          { value: "CANCELLED", label: "Canceladas" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === opt.value
                ? "bg-brand-500 text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {showCreateModal && (
        <div className="mb-6 rounded-lg border border-brand-200 bg-brand-50/50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Nueva Tarea</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Nombre *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  placeholder="Descripción breve de la tarea"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  placeholder="Detalles adicionales..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Asignar a</label>
                <select
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="">Sin asignar</option>
                  {internalUsers?.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.username})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createTask.isPending}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-brand-600 disabled:opacity-50"
              >
                {createTask.isPending ? "Creando..." : "Crear Tarea"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : !data?.items.length ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white py-16">
          <ClipboardList className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">No hay tareas {statusFilter ? "con este filtro" : "aún"}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Tarea</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Asignado a</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Creado por</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Creado</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actualizado</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actualizado por</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.items.map((task) => {
                const status = statusConfig[task.status] || statusConfig.PENDING;
                const StatusIcon = status.icon;
                return (
                  <tr key={task.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{task.name}</p>
                        {task.description && (
                          <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">{task.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {editingTask === task.id ? (
                        <select
                          defaultValue={task.status}
                          onChange={(e) => {
                            updateTask.mutate({
                              id: task.id,
                              status: e.target.value as "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED",
                            });
                          }}
                          className="rounded border border-gray-300 px-2 py-1 text-xs outline-none focus:border-brand-500"
                        >
                          <option value="PENDING">Pendiente</option>
                          <option value="IN_PROGRESS">En Proceso</option>
                          <option value="COMPLETED">Completada</option>
                          <option value="CANCELLED">Cancelada</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.class}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.text}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {task.assignedTo ? (
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-gray-700">{task.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{task.createdBy.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(task.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(task.updatedAt)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {task.updatedBy?.name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingTask(editingTask === task.id ? null : task.id)}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                          title="Editar estado"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { if (confirm("¿Eliminar esta tarea?")) deleteTask.mutate(task.id); }}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
