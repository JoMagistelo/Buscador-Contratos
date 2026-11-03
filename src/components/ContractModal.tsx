import React, { useState } from 'react';
import { X, ExternalLink, Copy, Check, FileText, DollarSign, Building, Shield, Users, Layers, Info } from 'lucide-react';
import { COLUMNAS_OFICIALES_73, CSV_COLUMN_KEYS_73, formatCurrency } from '../shared/contratosSchema.js';

interface ContractModalProps {
  contract: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ContractModal: React.FC<ContractModalProps> = ({ contract, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('todos');

  if (!isOpen || !contract) return null;

  const rawData: Record<string, any> = contract.raw_data || {};

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(contract, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categories = [
    { id: 'todos', label: 'Todas las 73 Columnas', icon: Layers },
    { id: 'general', label: 'General y Contrato', icon: FileText },
    { id: 'financiero', label: 'Importes y Finanzas', icon: DollarSign },
    { id: 'proveedor', label: 'Proveedor y RFC', icon: Users },
    { id: 'procedimiento', label: 'Procedimiento y Licitación', icon: Shield },
    { id: 'convenio', label: 'Convenios Modificatorios', icon: Building },
    { id: 'adicional', label: 'Técnicos y Metadatos', icon: Info },
  ];

  const filteredColumns = activeCategory === 'todos'
    ? COLUMNAS_OFICIALES_73
    : COLUMNAS_OFICIALES_73.filter(c => c.categoria === activeCategory);

  // Los valores originales tienen prioridad sobre campos derivados; las columnas
  // duplicadas están identificadas por su posición real (45/55 y 46/56).
  const getColumnValue = (col: typeof COLUMNAS_OFICIALES_73[0]) => {
    const rawKey = CSV_COLUMN_KEYS_73[col.index];
    if (Object.prototype.hasOwnProperty.call(rawData, rawKey)) return rawData[rawKey];
    if (Object.prototype.hasOwnProperty.call(rawData, col.headerOriginal)) return rawData[col.headerOriginal];
    return contract[col.id] ?? '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Encabezado del Modal */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-start justify-between">
          <div className="pr-4">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Año {contract.year_file || 'N/A'}
              </span>
              <span className="text-slate-400 text-xs font-mono">
                Cód: {contract.codigo_contrato || 'S/N'}
              </span>
              {contract.estatus_contrato && (
                <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300">
                  {contract.estatus_contrato}
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-100 line-clamp-2">
              {contract.titulo_contrato || contract.descripcion_contrato || 'Ficha Oficial del Contrato'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Institución: <strong className="text-slate-200">{contract.nombre_institucion || contract.siglas_institucion}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {contract.direccion_anuncio && (
              <a
                href={contract.direccion_anuncio}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-sm"
              >
                <span>Anuncio Oficial</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={handleCopyJson}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Copiar JSON completo"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Resumen clave superior */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-slate-500 block text-[11px]">Proveedor / Contratista</span>
            <span className="font-semibold text-slate-800 block truncate" title={contract.nombre_proveedor}>
              {contract.nombre_proveedor || 'No especificado'}
            </span>
            <span className="font-mono text-emerald-700 text-[11px] block mt-0.5">
              RFC: {contract.rfc_proveedor || 'Sin RFC'}
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-slate-500 block text-[11px]">Importe del Contrato</span>
            <span className="font-bold text-slate-900 text-sm block">
              {formatCurrency(Number(contract.importe_contrato) || 0, contract.moneda || 'MXN')}
            </span>
            <span className="text-slate-400 text-[10px]">Moneda: {contract.moneda || 'MXN'}</span>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-slate-500 block text-[11px]">Vigencia</span>
            <span className="font-medium text-slate-700 block">
              {contract.fecha_inicio || 'S/F'} al {contract.fecha_fin || 'S/F'}
            </span>
            <span className="text-slate-400 text-[10px]">Duración oficial</span>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-slate-500 block text-[11px]">Procedimiento</span>
            <span className="font-medium text-slate-700 block truncate" title={contract.tipo_procedimiento}>
              {contract.tipo_procedimiento || 'No especificado'}
            </span>
            <span className="text-slate-400 text-[10px] font-mono">
              Exp: {contract.codigo_procedimiento || 'S/N'}
            </span>
          </div>
        </div>

        {/* Filtro por categorías de columnas */}
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-300 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-slate-500" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Lista estructurada de columnas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            {filteredColumns.map((col) => {
              const val = getColumnValue(col);
              const isUrl = col.tipo === 'url' || String(val).startsWith('http');
              const isNumeric = col.tipo === 'numero' && typeof val === 'number';

              return (
                <div key={col.id} className="py-2 flex flex-col border-b border-slate-100 last:border-b-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <span className="text-slate-400 font-mono text-[10px]">#{col.index + 1}</span>
                      {col.etiqueta}
                    </span>
                    <span className="text-[10px] text-slate-400 italic hidden sm:inline truncate max-w-[200px]" title={col.headerOriginal}>
                      {col.headerOriginal}
                    </span>
                  </div>

                  <div className="mt-1 text-xs text-slate-800 break-words">
                    {val === '' || val === null || val === undefined ? (
                      <span className="text-slate-300 italic">Vacio</span>
                    ) : isUrl ? (
                      <a
                        href={String(val)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 hover:underline flex items-center gap-1 font-mono text-[11px] break-all"
                      >
                        <span>{String(val)}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ) : isNumeric ? (
                      <span className="font-mono font-medium">
                        {formatCurrency(Number(val), contract.moneda || 'MXN')}
                      </span>
                    ) : (
                      <span className="font-normal">{String(val)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pie del modal */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
          <span>73 columnas oficiales preservadas íntegramente.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
