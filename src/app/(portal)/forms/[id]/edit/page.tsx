"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { useRouter, useParams } from "next/navigation";
import { Plus, Trash2, ArrowLeft, Save, Edit2, X, Globe, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";

type FieldType =
  | "TEXT"
  | "NUMBER"
  | "EMAIL"
  | "DATE"
  | "DATETIME"
  | "SELECT"
  | "MULTI_SELECT"
  | "CHECKBOX"
  | "RADIO"
  | "TEXTAREA"
  | "FILE"
  | "URL"
  | "PHONE";

interface Field {
  label: string;
  fieldKey: string;
  type: FieldType;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: string[];
  defaultValue?: string;
  order: number;
  gridColumn?: number;
  gridRow?: number;
}

const fieldTypes: { value: FieldType; label: string }[] = [
  { value: "TEXT", label: "Texto" },
  { value: "NUMBER", label: "Número" },
  { value: "EMAIL", label: "Email" },
  { value: "DATE", label: "Fecha" },
  { value: "DATETIME", label: "Fecha y Hora" },
  { value: "SELECT", label: "Selección" },
  { value: "MULTI_SELECT", label: "Selección Múltiple" },
  { value: "CHECKBOX", label: "Checkbox" },
  { value: "RADIO", label: "Radio" },
  { value: "TEXTAREA", label: "Área de Texto" },
  { value: "FILE", label: "Archivo" },
  { value: "URL", label: "URL" },
  { value: "PHONE", label: "Teléfono" },
];

export default function EditFormPage() {
  const router = useRouter();
  const params = useParams();
  const formId = params.id as string;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [fields, setFields] = useState<Field[]>([]);

  const { data: form, isLoading } = trpc.forms.getById.useQuery(formId);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [modalField, setModalField] = useState<Field>({
    label: "",
    fieldKey: "",
    type: "TEXT",
    required: false,
    order: 0,
    gridColumn: 12,
  });

  // Drag and drop state
  const [draggedField, setDraggedField] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Resize state
  const [resizingField, setResizingField] = useState<number | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);

  const utils = trpc.useUtils();

  const updateForm = trpc.forms.update.useMutation({
    onSuccess: () => {
      utils.forms.list.invalidate();
      router.push("/forms");
    },
  });

  const publishForm = trpc.forms.publish.useMutation({
    onSuccess: () => {
      utils.forms.getById.invalidate(formId);
      utils.forms.list.invalidate();
    },
  });

  useEffect(() => {
    if (form) {
      setName(form.name);
      setDescription(form.description || "");
      setIsPublic(form.isPublic);
      setFields(
        form.fields.map((f) => ({
          label: f.label,
          fieldKey: f.fieldKey,
          type: f.type as FieldType,
          placeholder: f.placeholder || undefined,
          helpText: f.helpText || undefined,
          required: f.required,
          options: f.options
            ? Array.isArray(f.options)
              ? f.options
              : []
            : undefined,
          defaultValue: f.defaultValue || undefined,
          order: f.order,
          gridColumn: f.gridColumn ?? 12,
        }))
      );
    }
  }, [form]);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const openAddFieldModal = () => {
    setModalField({
      label: "",
      fieldKey: "",
      type: "TEXT",
      required: false,
      order: fields.length,
      gridColumn: 12,
    });
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  const openEditFieldModal = (index: number) => {
    setModalField({ ...fields[index] });
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingIndex(null);
  };

  const saveField = () => {
    if (!modalField.label) return;

    if (editingIndex !== null) {
      const newFields = [...fields];
      newFields[editingIndex] = modalField;
      setFields(newFields);
    } else {
      setFields([...fields, { ...modalField, order: fields.length }]);
    }
    closeModal();
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleDragStart = (index: number) => {
    setDraggedField(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedField === null) return;

    const newFields = [...fields];
    const [draggedItem] = newFields.splice(draggedField, 1);
    newFields.splice(dropIndex, 0, draggedItem);

    setFields(newFields.map((f, i) => ({ ...f, order: i })));
    setDraggedField(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedField(null);
    setDragOverIndex(null);
  };

  const handleResizeStart = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingField(index);
    setResizeStartX(e.clientX);
    setResizeStartWidth(fields[index].gridColumn || 12);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (resizingField === null) return;

    const deltaX = e.clientX - resizeStartX;
    const pixelsPerColumn = 60;
    const columnChange = Math.round(deltaX / pixelsPerColumn);

    let newWidth = resizeStartWidth + columnChange;

    if (newWidth <= 3) newWidth = 3;
    else if (newWidth <= 4) newWidth = 4;
    else if (newWidth <= 6) newWidth = 6;
    else newWidth = 12;

    newWidth = Math.max(3, Math.min(12, newWidth));

    const newFields = [...fields];
    newFields[resizingField] = {
      ...newFields[resizingField],
      gridColumn: newWidth,
    };
    setFields(newFields);
  };

  const handleResizeEnd = () => {
    setResizingField(null);
  };

  useEffect(() => {
    if (resizingField !== null) {
      document.addEventListener("mousemove", handleResizeMove);
      document.addEventListener("mouseup", handleResizeEnd);
      return () => {
        document.removeEventListener("mousemove", handleResizeMove);
        document.removeEventListener("mouseup", handleResizeEnd);
      };
    }
  }, [resizingField, resizeStartX, resizeStartWidth, fields]);

  const organizeFieldsIntoRows = () => {
    const rows: Field[][] = [];
    let currentRow: Field[] = [];
    let currentRowWidth = 0;

    fields.forEach((field) => {
      const fieldWidth = field.gridColumn || 12;

      if (currentRowWidth + fieldWidth > 12) {
        if (currentRow.length > 0) {
          rows.push(currentRow);
        }
        currentRow = [field];
        currentRowWidth = fieldWidth;
      } else {
        currentRow.push(field);
        currentRowWidth += fieldWidth;
      }
    });

    if (currentRow.length > 0) {
      rows.push(currentRow);
    }

    return rows;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateForm.mutate({
      id: formId,
      name,
      description,
      isPublic,
      fields: fields.map((f, i) => ({ ...f, order: i })),
    });
  };

  const rows = organizeFieldsIntoRows();

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <p className="text-gray-600">Formulario no encontrado</p>
        <Link href="/forms" className="mt-4 text-brand-600 hover:text-brand-700">
          Volver a formularios
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/forms"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Editar Formulario</h1>
            {form && (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                form.status === 'PUBLISHED'
                  ? 'bg-green-100 text-green-700'
                  : form.status === 'ARCHIVED'
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-yellow-100 text-yellow-700'
              }`}>
                {form.status === 'PUBLISHED' ? '✅ Publicado' : form.status === 'ARCHIVED' ? 'Archivado' : '📝 Borrador'}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Modifica los campos y configuración del formulario
          </p>
        </div>
        {form && form.status !== 'PUBLISHED' && (
          <button
            type="button"
            onClick={() => publishForm.mutate(formId)}
            disabled={publishForm.isPending}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            <Globe className="h-4 w-4" />
            {publishForm.isPending ? 'Publicando...' : 'Publicar'}
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Información Básica
          </h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nombre del Formulario *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder="Ej: Solicitud de Materiales"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Slug (URL)
              </label>
              <input
                type="text"
                value={form.slug}
                disabled
                className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-600"
              />
              <p className="mt-1 text-xs text-gray-500">
                El slug no se puede modificar después de crear el formulario
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                placeholder="Describe el propósito de este formulario..."
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-700">
                  Formulario público (no requiere autenticación)
                </label>
              </div>

              {isPublic && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-800">Formulario Público Activo</span>
                  </div>
                  <p className="text-xs text-green-700 mb-2">
                    Los usuarios externos pueden acceder a este formulario sin iniciar sesión usando la siguiente URL:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-white px-3 py-1.5 text-sm text-green-800 border border-green-200 truncate">
                      {typeof window !== 'undefined' ? window.location.origin : ''}/f/{form.slug}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/f/${form.slug}`);
                      }}
                      className="rounded-lg border border-green-300 bg-white p-1.5 text-green-600 hover:bg-green-100 transition-colors"
                      title="Copiar URL"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <a
                      href={`/f/${form.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-green-300 bg-white p-1.5 text-green-600 hover:bg-green-100 transition-colors"
                      title="Abrir formulario"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Campos</h2>
            <button
              type="button"
              onClick={openAddFieldModal}
              className="flex items-center gap-2 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
            >
              <Plus className="h-4 w-4" />
              Agregar Campo
            </button>
          </div>

          {fields.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-12 text-center">
              <p className="text-sm text-gray-500">
                No hay campos aún. Haz clic en "Agregar Campo" para comenzar.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
                💡 <strong>Editor Interactivo:</strong> Arrastra campos para
                reordenar • Arrastra el borde derecho para cambiar ancho • Clic
                en ✏️ para editar
              </div>

              {rows.map((row, rowIndex) => (
                <div key={rowIndex} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">
                      Fila {rowIndex + 1}
                    </span>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>

                  <div className="grid grid-cols-12 gap-3">
                    {row.map((field) => {
                      const fieldIndex = fields.indexOf(field);
                      const colSpan = field.gridColumn || 12;

                      return (
                        <div
                          key={fieldIndex}
                          draggable
                          onDragStart={() => handleDragStart(fieldIndex)}
                          onDragOver={(e) => handleDragOver(e, fieldIndex)}
                          onDrop={(e) => handleDrop(e, fieldIndex)}
                          onDragEnd={handleDragEnd}
                          className={`relative col-span-${colSpan} cursor-move rounded-lg border-2 bg-white p-3 transition-all ${
                            draggedField === fieldIndex
                              ? "border-brand-500 opacity-50"
                              : dragOverIndex === fieldIndex
                                ? "border-brand-300 bg-brand-50"
                                : "border-gray-200 hover:border-brand-200 hover:shadow-sm"
                          }`}
                          style={{
                            gridColumn: `span ${colSpan} / span ${colSpan}`,
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900 truncate">
                                  {field.label || "Sin etiqueta"}
                                </span>
                                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 whitespace-nowrap">
                                  {
                                    fieldTypes.find(
                                      (ft) => ft.value === field.type,
                                    )?.label
                                  }
                                </span>
                              </div>
                              <div className="mt-1 flex items-center gap-2">
                                <code className="text-xs text-gray-500 truncate">
                                  {field.fieldKey}
                                </code>
                                {field.required && (
                                  <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700 whitespace-nowrap">
                                    Obligatorio
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEditFieldModal(fieldIndex)}
                                className="rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-600"
                                title="Editar"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeField(fieldIndex)}
                                className="rounded p-1.5 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                                title="Eliminar"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {colSpan < 12 && (
                            <div
                              onMouseDown={(e) =>
                                handleResizeStart(e, fieldIndex)
                              }
                              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize group hover:bg-brand-500/20"
                              title="Arrastra para cambiar ancho"
                            >
                              <div className="absolute right-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-gray-300 transition-colors group-hover:bg-brand-500" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/forms"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={updateForm.isPending || !name || fields.length === 0}
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
          >
            {updateForm.isPending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>

        {updateForm.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">
              Error: {updateForm.error.message}
            </p>
          </div>
        )}
      </form>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingIndex !== null ? "Editar Campo" : "Nuevo Campo"}
              </h3>
              <button
                onClick={closeModal}
                className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Etiqueta del Campo *
                  </label>
                  <input
                    type="text"
                    value={modalField.label}
                    onChange={(e) => {
                      const label = e.target.value;
                      setModalField({
                        ...modalField,
                        label,
                        fieldKey: generateSlug(label),
                      });
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    placeholder="Ej: Nombre completo"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Key (Identificador)
                  </label>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                    {modalField.fieldKey || "se-generara-automaticamente"}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Se genera automáticamente desde la etiqueta
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Tipo de Campo *
                  </label>
                  <select
                    value={modalField.type}
                    onChange={(e) =>
                      setModalField({
                        ...modalField,
                        type: e.target.value as FieldType,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    {fieldTypes.map((ft) => (
                      <option key={ft.value} value={ft.value}>
                        {ft.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Placeholder
                  </label>
                  <input
                    type="text"
                    value={modalField.placeholder || ""}
                    onChange={(e) =>
                      setModalField({
                        ...modalField,
                        placeholder: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    placeholder="Texto de ejemplo en el campo"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Texto de Ayuda
                  </label>
                  <input
                    type="text"
                    value={modalField.helpText || ""}
                    onChange={(e) =>
                      setModalField({ ...modalField, helpText: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    placeholder="Descripción adicional del campo"
                  />
                </div>

                {(modalField.type === "SELECT" ||
                  modalField.type === "MULTI_SELECT" ||
                  modalField.type === "RADIO") && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Opciones (una por línea)
                    </label>
                    <textarea
                      value={(modalField.options || []).join("\n")}
                      onChange={(e) =>
                        setModalField({
                          ...modalField,
                          options: e.target.value
                            .split("\n")
                            .filter((o) => o.trim()),
                        })
                      }
                      rows={5}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                      placeholder="Opción 1&#10;Opción 2&#10;Opción 3"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Ancho del Campo (Grid Layout)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { cols: 12, label: "Ancho Completo", icon: "▬▬▬▬" },
                      { cols: 6, label: "1/2 (Mitad)", icon: "▬▬ ▬▬" },
                      { cols: 4, label: "1/3 (Tercio)", icon: "▬ ▬ ▬" },
                      { cols: 3, label: "1/4 (Cuarto)", icon: "▬▬▬▬" },
                    ].map((option) => (
                      <button
                        key={option.cols}
                        type="button"
                        onClick={() =>
                          setModalField({
                            ...modalField,
                            gridColumn: option.cols,
                          })
                        }
                        className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-xs transition-all ${
                          modalField.gridColumn === option.cols
                            ? "border-brand-500 bg-brand-50 text-brand-700"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <span className="text-lg">{option.icon}</span>
                        <span className="font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Los campos se organizarán automáticamente en una cuadrícula
                    de 12 columnas
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="modal-required"
                    checked={modalField.required}
                    onChange={(e) =>
                      setModalField({
                        ...modalField,
                        required: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <label
                    htmlFor="modal-required"
                    className="text-sm text-gray-700"
                  >
                    Campo obligatorio
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 p-4">
              <button
                onClick={closeModal}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={saveField}
                disabled={!modalField.label}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
              >
                {editingIndex !== null ? "Guardar Cambios" : "Agregar Campo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
