"use client";

import { trpc } from "@/lib/trpc/client";
import { useState } from "react";
import {
  Menu,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Link2,
} from "lucide-react";

type MenuChild = {
  id: string;
  label: string;
  labelEs: string | null;
  icon: string | null;
  path: string | null;
  order: number;
  isActive: boolean;
  parentId: string | null;
  permissionId: string | null;
};

type MenuParent = MenuChild & {
  children: MenuChild[];
  permission: { id: string; name: string; key: string } | null;
};

export default function AdminMenusPage() {
  const { data: items, isLoading, refetch } = trpc.menus.list.useQuery();
  const { data: permissions } = trpc.menus.permissions.useQuery();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editLabelEs, setEditLabelEs] = useState("");
  const [editPath, setEditPath] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editPermissionId, setEditPermissionId] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newPath, setNewPath] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [newPermissionId, setNewPermissionId] = useState<string | null>(null);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const updateMenu = trpc.menus.update.useMutation({
    onSuccess: () => {
      refetch();
      setEditingId(null);
    },
  });
  const createMenu = trpc.menus.create.useMutation({
    onSuccess: () => {
      refetch();
      resetCreate();
    },
  });
  const deleteMenu = trpc.menus.delete.useMutation({
    onSuccess: () => refetch(),
  });
  const reorderMenu = trpc.menus.reorder.useMutation({
    onSuccess: () => refetch(),
  });

  function startEdit(item: MenuChild) {
    setEditingId(item.id);
    setEditLabel(item.label);
    setEditLabelEs(item.labelEs || "");
    setEditPath(item.path || "");
    setEditIcon(item.icon || "");
    setEditPermissionId(item.permissionId);
  }

  function saveEdit() {
    if (!editingId) return;
    updateMenu.mutate({
      id: editingId,
      label: editLabel,
      labelEs: editLabelEs || undefined,
      path: editPath || undefined,
      icon: editIcon || undefined,
      permissionId: editPermissionId,
    });
  }

  function resetCreate() {
    setShowCreate(false);
    setCreateParentId(null);
    setNewLabel("");
    setNewPath("");
    setNewIcon("");
    setNewPermissionId(null);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    createMenu.mutate({
      label: newLabel,
      labelEs: newLabel,
      path: newPath || undefined,
      icon: newIcon || undefined,
      parentId: createParentId,
      permissionId: newPermissionId,
    });
  }

  function moveItem(
    parentItems: MenuChild[],
    index: number,
    direction: -1 | 1,
  ) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= parentItems.length) return;

    const reordered = parentItems.map((item, i) => ({
      id: item.id,
      order:
        i === index
          ? parentItems[newIndex].order
          : i === newIndex
            ? parentItems[index].order
            : item.order,
      parentId: item.parentId,
    }));
    reorderMenu.mutate(reordered);
  }

  function toggleActive(id: string, current: boolean) {
    updateMenu.mutate({ id, isActive: !current });
  }

  const rootItems = (items ?? []) as MenuParent[];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menú</h1>
          <p className="text-sm text-gray-500">
            Configuración del menú dinámico del portal
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreate(true);
            setCreateParentId(null);
          }}
          className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-600 hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          Nuevo Módulo
        </button>
      </div>

      {showCreate && (
        <div className="mb-6 rounded-lg border border-brand-200 bg-brand-50/50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            {createParentId ? "Nuevo Sub-menú" : "Nuevo Módulo de Menú"}
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  placeholder="Ej: Reportes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Ruta
                </label>
                <input
                  type="text"
                  value={newPath}
                  onChange={(e) => setNewPath(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  placeholder="/reportes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Icono
                </label>
                <input
                  type="text"
                  value={newIcon}
                  onChange={(e) => setNewIcon(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  placeholder="FileText"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Permiso RBAC
                </label>
                <select
                  value={newPermissionId || ""}
                  onChange={(e) => setNewPermissionId(e.target.value || null)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="">Auto-detectar / Ninguno</option>
                  {permissions?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.module} — {p.name} ({p.key})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createMenu.isPending}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {createMenu.isPending ? "Creando..." : "Crear"}
              </button>
              <button
                type="button"
                onClick={resetCreate}
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
      ) : (
        <div className="space-y-2">
          {rootItems.map((item, index) => (
            <div
              key={item.id}
              className="rounded-lg border border-gray-200 bg-white shadow-sm"
            >
              <div className="flex items-center gap-2 px-4 py-3">
                <GripVertical className="h-4 w-4 cursor-grab text-gray-300" />

                <div className="flex gap-1">
                  <button
                    onClick={() => moveItem(rootItems, index, -1)}
                    disabled={index === 0}
                    className="rounded p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => moveItem(rootItems, index, 1)}
                    disabled={index === rootItems.length - 1}
                    className="rounded p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                {item.children.length > 0 && (
                  <button
                    onClick={() =>
                      setExpanded((p) => ({ ...p, [item.id]: !p[item.id] }))
                    }
                    className="text-gray-400"
                  >
                    {expanded[item.id] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                )}

                <Menu className="h-4 w-4 text-brand-500" />

                {editingId === item.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      value={editLabelEs}
                      onChange={(e) => setEditLabelEs(e.target.value)}
                      className="w-32 rounded border border-gray-300 px-2 py-1 text-sm"
                      placeholder="Nombre"
                    />
                    <input
                      value={editPath}
                      onChange={(e) => setEditPath(e.target.value)}
                      className="w-32 rounded border border-gray-300 px-2 py-1 text-sm"
                      placeholder="Ruta"
                    />
                    <input
                      value={editIcon}
                      onChange={(e) => setEditIcon(e.target.value)}
                      className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
                      placeholder="Icono"
                    />
                    <select
                      value={editPermissionId || ""}
                      onChange={(e) =>
                        setEditPermissionId(e.target.value || null)
                      }
                      className="w-40 rounded border border-gray-300 px-2 py-1 text-xs"
                    >
                      <option value="">Sin permiso</option>
                      {permissions?.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.key}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={saveEdit}
                      className="rounded bg-brand-500 p-1 text-white hover:bg-brand-600"
                    >
                      <Save className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded bg-gray-200 p-1 text-gray-600 hover:bg-gray-300"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-800">
                      {item.labelEs || item.label}
                    </span>
                    <span className="ml-2 text-xs text-gray-400">
                      {item.path || "Grupo"}
                    </span>
                    {item.permission && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600">
                        <Link2 className="h-2.5 w-2.5" />
                        {item.permission.key}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleActive(item.id, item.isActive)}
                    className={`rounded p-1 ${item.isActive ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
                    title={item.isActive ? "Desactivar" : "Activar"}
                  >
                    {item.isActive ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => startEdit(item)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setShowCreate(true);
                      setCreateParentId(item.id);
                    }}
                    className="rounded p-1 text-gray-400 hover:bg-brand-50 hover:text-brand-600"
                    title="Agregar hijo"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  {item.children.length === 0 && (
                    <button
                      onClick={() => {
                        if (confirm("¿Eliminar este menú?"))
                          deleteMenu.mutate(item.id);
                      }}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {(expanded[item.id] || item.children.length > 0) &&
                item.children.length > 0 && (
                  <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-1">
                    {item.children.map(
                      (child: MenuChild, childIndex: number) => (
                        <div
                          key={child.id}
                          className="flex items-center gap-2 rounded-md px-4 py-2 transition-colors hover:bg-white"
                        >
                          <div className="flex gap-1">
                            <button
                              onClick={() =>
                                moveItem(item.children, childIndex, -1)
                              }
                              disabled={childIndex === 0}
                              className="rounded p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() =>
                                moveItem(item.children, childIndex, 1)
                              }
                              disabled={childIndex === item.children.length - 1}
                              className="rounded p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                          </div>

                          <ChevronRight className="h-3 w-3 text-gray-400" />

                          {editingId === child.id ? (
                            <div className="flex flex-1 items-center gap-2">
                              <input
                                value={editLabelEs}
                                onChange={(e) => setEditLabelEs(e.target.value)}
                                className="w-32 rounded border border-gray-300 px-2 py-1 text-sm"
                                placeholder="Nombre"
                              />
                              <input
                                value={editPath}
                                onChange={(e) => setEditPath(e.target.value)}
                                className="w-32 rounded border border-gray-300 px-2 py-1 text-sm"
                                placeholder="Ruta"
                              />
                              <input
                                value={editIcon}
                                onChange={(e) => setEditIcon(e.target.value)}
                                className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
                                placeholder="Icono"
                              />
                              <button
                                onClick={saveEdit}
                                className="rounded bg-brand-500 p-1 text-white hover:bg-brand-600"
                              >
                                <Save className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="rounded bg-gray-200 p-1 text-gray-600 hover:bg-gray-300"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex-1">
                              <span className="text-sm text-gray-700">
                                {child.labelEs || child.label}
                              </span>
                              <span className="ml-2 text-xs text-gray-400">
                                {child.path}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                toggleActive(child.id, child.isActive)
                              }
                              className={`rounded p-1 ${child.isActive ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
                            >
                              {child.isActive ? (
                                <Eye className="h-3 w-3" />
                              ) : (
                                <EyeOff className="h-3 w-3" />
                              )}
                            </button>
                            <button
                              onClick={() => startEdit(child)}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("¿Eliminar?"))
                                  deleteMenu.mutate(child.id);
                              }}
                              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
