import React from 'react';
import { Search, FileSpreadsheet, BarChart3, ShieldCheck, Database, HelpCircle, Lock } from 'lucide-react';

export type TabType = 'individual' | 'bulk' | 'analytics' | 'admin' | 'guide';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isAdminLoggedIn: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, isAdminLoggedIn }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y título de la plataforma */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('individual')}>
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-lg text-white shadow-inner">
              APF
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-wide text-slate-100">
                  EXPLORADOR DE CONTRATOS APF
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  CompraNet • Compras MX
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Buscador público y masivo de compras públicas federales 2020-2026
              </p>
            </div>
          </div>

          {/* Menú de navegación */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('individual')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'individual'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Buscador</span>
            </button>

            <button
              onClick={() => setActiveTab('bulk')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'bulk'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Búsqueda Masiva</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden md:inline">Estadísticas</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'admin'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {isAdminLoggedIn ? <Database className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4" />}
              <span className="hidden md:inline">Administración</span>
              {isAdminLoggedIn && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'guide'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title="Guía de despliegue paso a paso"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden lg:inline">Guía</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Franja de privacidad garantizada */}
      <div className="bg-slate-950 border-t border-slate-850 px-4 py-1 text-center text-[11px] text-slate-400 flex items-center justify-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline" />
        <span>
          <strong>Privacidad total:</strong> Búsquedas procesadas en memoria volátil. Ningún nombre, RFC o consulta es registrado ni almacenado en base de datos.
        </span>
      </div>
    </header>
  );
};
