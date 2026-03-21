"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import PortalLayout from "@/components/portal/PortalLayout";

export default function ServicePortalPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: portalConfig, isLoading: configLoading } = trpc.servicePortal.getPortalConfig.useQuery();
  const { data: categories, isLoading: categoriesLoading } = trpc.servicePortal.getCategories.useQuery();
  const { data: items, isLoading: itemsLoading } = trpc.servicePortal.getItems.useQuery({
    categoryId: selectedCategory || undefined,
    search: searchQuery || undefined,
  });
  const { data: publicForms, isLoading: formsLoading } = trpc.forms.list.useQuery({
    limit: 20,
    status: "PUBLISHED"
  });

  const popularItems = items?.slice(0, 6) || [];
  const availableForms = publicForms?.items.filter(f => f.isPublic) || [];

  // Check if portal is disabled
  if (configLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando portal...</p>
        </div>
      </div>
    );
  }

  if (!portalConfig?.enabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-2xl w-full text-center">
          <div className="text-8xl mb-6">🚧</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Portal en Mantenimiento
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {portalConfig?.maintenanceMessage ||
              "El portal de servicios está temporalmente deshabilitado. Por favor, intenta más tarde o contacta al administrador."}
          </p>
          <div className="bg-indigo-50 rounded-lg p-6">
            <p className="text-sm text-gray-700">
              <strong>¿Necesitas ayuda urgente?</strong><br />
              Contacta a soporte: soporte@mdm-materiales.com
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PortalLayout>
      {/* Hero Section */}
      <div className="mb-8 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4">Portal de Servicios</h1>
            <p className="text-xl text-indigo-100 mb-8">
              Solicita materiales, equipos y servicios de forma rápida y sencilla
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="¿Qué necesitas hoy? Busca materiales, equipos, servicios..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 rounded-full text-gray-900 text-lg shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/50"
                />
                <button className="absolute right-2 top-2 bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700 transition-colors">
                  🔍 Buscar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Categorías</h2>

        {categoriesLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`p-6 rounded-xl transition-all shadow-lg hover:shadow-xl ${
                selectedCategory === null
                  ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="text-4xl mb-2">📦</div>
              <div className="font-semibold">Todos</div>
            </button>

            {categories?.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-6 rounded-xl transition-all shadow-lg hover:shadow-xl ${
                  selectedCategory === category.id
                    ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
                style={{
                  backgroundColor: selectedCategory === category.id ? undefined : category.color || undefined,
                }}
              >
                <div className="text-4xl mb-2">{category.icon || "📁"}</div>
                <div className="font-semibold text-sm">{category.name}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Popular/Featured Items */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            {selectedCategory ? "Items en esta categoría" : "Servicios Populares"}
          </h2>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              Ver todos →
            </button>
          )}
        </div>

        {itemsLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : items && items.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/portal/item/${item.slug}`}
                className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group"
              >
                {item.image && (
                  <div className="h-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    <span className="text-6xl">{item.icon || "📦"}</span>
                  </div>
                )}

                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {item.name}
                    </h3>
                    {!item.isAvailable && (
                      <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
                        No disponible
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {item.shortDescription}
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      {item.estimatedTime && (
                        <span className="text-gray-500">
                          ⏱️ {item.estimatedTime}
                        </span>
                      )}
                      {item.price && (
                        <span className="text-green-600 font-semibold">
                          ${item.price}
                        </span>
                      )}
                    </div>
                    <span className="text-indigo-600 font-semibold group-hover:translate-x-1 transition-transform">
                      Solicitar →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No se encontraron resultados
            </h3>
            <p className="text-gray-600">
              Intenta con otra búsqueda o categoría
            </p>
          </div>
        )}
      </div>

      {/* Public Forms Section */}
      {availableForms.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Formularios Disponibles</h2>
              <p className="text-gray-600 mt-1">Completa formularios de solicitud y registro</p>
            </div>
          </div>

          {formsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableForms.map((form) => (
                <Link
                  key={form.id}
                  href={`/f/${form.slug}`}
                  className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group border-2 border-transparent hover:border-indigo-200"
                >
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">📝</div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {form.name}
                        </h3>
                        <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full mt-1">
                          Público
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {form.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {form.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-500">
                        <span>📋</span>
                        <span>{form._count.fields} campos</span>
                      </div>
                      <span className="text-indigo-600 font-semibold group-hover:translate-x-1 transition-transform">
                        Completar →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Mis Solicitudes
              </h3>
              <p className="text-gray-600 mb-4">
                Revisa el estado de tus solicitudes
              </p>
              <Link
                href="/portal/my-requests"
                className="text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                Ver solicitudes →
              </Link>
            </div>

            <div className="text-center">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Soporte
              </h3>
              <p className="text-gray-600 mb-4">
                ¿Necesitas ayuda? Contáctanos
              </p>
              <Link
                href="/portal/support"
                className="text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                Obtener ayuda →
              </Link>
            </div>

            <div className="text-center">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Base de Conocimiento
              </h3>
              <p className="text-gray-600 mb-4">
                Encuentra respuestas rápidas
              </p>
              <Link
                href="/portal/kb"
                className="text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                Explorar →
              </Link>
            </div>
          </div>
        </div>
      </div>

    </PortalLayout>
  );
}
