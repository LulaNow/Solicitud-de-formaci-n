"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft, Save, Edit2, X } from "lucide-react";
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
  gridColumn?: number; // 1-12 (Tailwind grid)
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

export default function NewFormPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [fields, setFields] = useState<Field[]>([]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [modalField, setModalField] = useState<Field>({
    label: "",
    fieldKey: "",
    type: "TEXT",
    required: false,
    order: 0,
    gridColumn: 12, // Full width by default
  });

  const createForm = trpc.forms.create.useMutation({
    onSuccess: () => {
      router.push("/forms");
    },
  });

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
      gridColumn: 12, // Full width by default
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = generateSlug(name);
    createForm.mutate({
      name,
      slug,
      description,
      isPublic,
      fields: fields.map((f, i) => ({ ...f, order: i })),
    });
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/forms"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Formulario</h1>
          <p className="text-sm text-gray-500">
            Crea un formulario dinámico con campos personalizados
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
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
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                {generateSlug(name) || "se-generara-automaticamente"}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Se genera automáticamente desde el nombre del formulario
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
          </div>
        </div>

        {/* Campos del formulario */}
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
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-brand-300 hover:shadow-sm"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {field.label || "Sin etiqueta"}
                      </span>
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {
                          fieldTypes.find((ft) => ft.value === field.type)
                            ?.label
                        }
                      </span>
                      {field.required && (
                        <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
                          Obligatorio
                        </span>
                      )}
                      {field.gridColumn && field.gridColumn < 12 && (
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                          {field.gridColumn === 6
                            ? "1/2"
                            : field.gridColumn === 4
                              ? "1/3"
                              : field.gridColumn === 3
                                ? "1/4"
                                : `${field.gridColumn}/12`}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Key:{" "}
                      <code className="rounded bg-gray-100 px-1">
                        {field.fieldKey}
                      </code>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditFieldModal(index)}
                      className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-brand-600"
                      title="Editar campo"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeField(index)}
                      className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
                      title="Eliminar campo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/forms"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={createForm.isPending || !name || fields.length === 0}
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
          >
            {createForm.isPending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Crear Formulario
              </>
            )}
          </button>
        </div>

        {createForm.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">
              Error: {createForm.error.message}
            </p>
          </div>
        )}
      </form>

      {/* Modal para agregar/editar campo */}
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

                {/* Grid Layout Selector */}
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
