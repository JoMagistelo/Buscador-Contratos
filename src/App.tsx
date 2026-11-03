import React, { useState } from 'react';
import { Navbar, TabType } from './components/Navbar.js';
import { IndividualSearch } from './components/IndividualSearch.js';
import { BulkSearch } from './components/BulkSearch.js';
import { AnalyticsView } from './components/AnalyticsView.js';
import { AdminPanel } from './components/AdminPanel.js';
import { DeploymentGuide } from './components/DeploymentGuide.js';
import { ContractModal } from './components/ContractModal.js';
import { ShieldCheck, FileSpreadsheet, ExternalLink } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('individual');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return Boolean(typeof window !== 'undefined' && sessionStorage.getItem('admin_token'));
  });

  const [selectedContract, setSelectedContract] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingContract, setLoadingContract] = useState(false);

  const handleSelectContract = async (id: string) => {
    setLoadingContract(true);
    setIsModalOpen(true);
    try {
      const response = await fetch('/api/contract/detail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
        body: JSON.stringify({ id }),
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedContract(data);
      }
    } catch (err) {
      console.error('Error cargando ficha de contrato:', err);
    } finally {
      setLoadingContract(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800 font-sans antialiased selection:bg-emerald-200 selection:text-emerald-900">
      {/* Navegación y franja de privacidad */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* Contenido principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'individual' && (
          <IndividualSearch onSelectContract={handleSelectContract} />
        )}

        {activeTab === 'bulk' && (
          <BulkSearch onSelectContract={handleSelectContract} />
        )}

        {activeTab === 'analytics' && <AnalyticsView />}

        {activeTab === 'admin' && (
          <AdminPanel
            isAdminLoggedIn={isAdminLoggedIn}
            setIsAdminLoggedIn={setIsAdminLoggedIn}
            onNavigateToGuide={() => setActiveTab('guide')}
          />
        )}

        {activeTab === 'guide' && <DeploymentGuide />}
      </main>

      {/* Ficha modal con las 73 columnas oficiales */}
      <ContractModal
        contract={selectedContract}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedContract(null);
        }}
      />

      {/* Pie de página institucional */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center font-bold text-white text-xs">
                APF
              </div>
              <div>
                <p className="font-bold text-slate-200">EXPLORADOR DE CONTRATOS APF</p>
                <p className="text-[11px] text-slate-400">
                  Herramienta documental de consulta y análisis de contrataciones públicas federales de México.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Privacidad garantizada: Búsquedas efímeras en RAM</span>
              </span>
              <span className="text-slate-600">•</span>
              <a
                href="https://comprasmx.buengobierno.gob.mx/datos-abiertos"
                target="_blank"
                rel="noreferrer"
                className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1 text-slate-300"
              >
                <span>Fuente oficial Compras MX</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-slate-600">•</span>
              <button
                onClick={() => setActiveTab('guide')}
                className="hover:text-emerald-400 transition-colors text-slate-300"
              >
                Guía de Despliegue Cloudflare &amp; Turso
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-[10px] text-slate-500">
            Datos públicos correspondientes a CompraNet (2020 a 2024) y Compras MX (2025 a 2026). 73 columnas preservadas sin alteración.
          </div>
        </div>
      </footer>
    </div>
  );
}
