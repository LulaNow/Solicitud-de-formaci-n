"use client";

import { useState, useEffect } from "react";

type Scene =
  | "night"
  | "storm"
  | "sunny"
  | "snow"
  | "christmas"
  | "halloween"
  | "muertos"
  | "patrias"
  | "valentine"
  | "reyes"
  | "constitucion"
  | "bandera"
  | "juarez"
  | "cincodemayo"
  | "revolucion"
  | "newyear"
  | "laborday"
  | "guadalupe"
  | "holyweek";

interface SceneOption {
  id: Scene;
  name: string;
  emoji: string;
  description: string;
  category: "weather" | "holiday" | "patriotic";
}

const SCENE_OPTIONS: SceneOption[] = [
  // Weather
  { id: "sunny", name: "Soleado", emoji: "☀️", description: "Día soleado", category: "weather" },
  { id: "night", name: "Noche", emoji: "🌙", description: "Noche estrellada", category: "weather" },
  { id: "storm", name: "Tormenta", emoji: "⛈️", description: "Tormenta eléctrica", category: "weather" },
  { id: "snow", name: "Nieve", emoji: "❄️", description: "Nevando", category: "weather" },
  
  // Holidays
  { id: "christmas", name: "Navidad", emoji: "🎄", description: "Temporada navideña", category: "holiday" },
  { id: "newyear", name: "Año Nuevo", emoji: "🎆", description: "Celebración de año nuevo", category: "holiday" },
  { id: "reyes", name: "Día de Reyes", emoji: "👑", description: "6 de enero", category: "holiday" },
  { id: "valentine", name: "San Valentín", emoji: "💝", description: "14 de febrero", category: "holiday" },
  { id: "halloween", name: "Halloween", emoji: "🎃", description: "31 de octubre", category: "holiday" },
  { id: "muertos", name: "Día de Muertos", emoji: "💀", description: "1-2 de noviembre", category: "holiday" },
  { id: "guadalupe", name: "Virgen de Guadalupe", emoji: "🌹", description: "12 de diciembre", category: "holiday" },
  { id: "holyweek", name: "Semana Santa", emoji: "✝️", description: "Marzo/Abril", category: "holiday" },
  
  // Patriotic
  { id: "constitucion", name: "Día de la Constitución", emoji: "📜", description: "5 de febrero", category: "patriotic" },
  { id: "bandera", name: "Día de la Bandera", emoji: "🇲🇽", description: "24 de febrero", category: "patriotic" },
  { id: "juarez", name: "Benito Juárez", emoji: "🎩", description: "21 de marzo", category: "patriotic" },
  { id: "laborday", name: "Día del Trabajo", emoji: "⚒️", description: "1 de mayo", category: "patriotic" },
  { id: "cincodemayo", name: "Cinco de Mayo", emoji: "🎺", description: "5 de mayo", category: "patriotic" },
  { id: "patrias", name: "Fiestas Patrias", emoji: "🎊", description: "15-16 de septiembre", category: "patriotic" },
  { id: "revolucion", name: "Revolución Mexicana", emoji: "🌟", description: "20 de noviembre", category: "patriotic" },
];

interface SceneSelectorPopupProps {
  currentScene: Scene;
  onSceneChange: (scene: Scene) => void;
}

export function SceneSelectorPopup({ currentScene, onSceneChange }: SceneSelectorPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "weather" | "holiday" | "patriotic">("all");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + B
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      
      // ESC to close
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const filteredScenes = SCENE_OPTIONS.filter(
    (scene) => selectedCategory === "all" || scene.category === selectedCategory
  );

  const handleSceneSelect = (sceneId: Scene) => {
    onSceneChange(sceneId);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
        onClick={() => setIsOpen(false)}
      />

      {/* Popup */}
      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Selector de Escenas</h2>
                <p className="text-indigo-100 text-sm">
                  Presiona <kbd className="px-2 py-1 bg-white/20 rounded">Ctrl/Cmd + Shift + B</kbd> para abrir/cerrar
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Category Filter */}
          <div className="border-b border-gray-200 p-4 bg-gray-50">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  selectedCategory === "all"
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                📦 Todas
              </button>
              <button
                onClick={() => setSelectedCategory("weather")}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  selectedCategory === "weather"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                🌤️ Clima
              </button>
              <button
                onClick={() => setSelectedCategory("holiday")}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  selectedCategory === "holiday"
                    ? "bg-pink-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                🎉 Festividades
              </button>
              <button
                onClick={() => setSelectedCategory("patriotic")}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  selectedCategory === "patriotic"
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                🇲🇽 Cívicas
              </button>
            </div>
          </div>

          {/* Scene Grid */}
          <div className="p-6 overflow-y-auto max-h-[50vh]">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredScenes.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => handleSceneSelect(scene.id)}
                  className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                    currentScene === scene.id
                      ? "border-indigo-600 bg-indigo-50 shadow-lg"
                      : "border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md"
                  }`}
                >
                  <div className="text-5xl mb-2">{scene.emoji}</div>
                  <div className="font-bold text-gray-900 mb-1">{scene.name}</div>
                  <div className="text-xs text-gray-600">{scene.description}</div>
                  {currentScene === scene.id && (
                    <div className="mt-2 text-xs font-semibold text-indigo-600">
                      ✓ Activa
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                <span className="font-semibold">{filteredScenes.length}</span> escenas disponibles
              </div>
              <div className="flex gap-4">
                <div>
                  <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">ESC</kbd> Cerrar
                </div>
                <div>
                  <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl/Cmd+Shift+B</kbd> Toggle
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
