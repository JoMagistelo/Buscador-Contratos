import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Play,
  RotateCcw,
  Download,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { normalizeRFC, formatCurrency } from '../shared/contratosSchema.js';
import { exportContratosToExcel, exportNotFoundListToExcel } from '../services/excelExporter.js';

interface BulkSearchProps {
  onSelectContract: (id: string) => void;
}

export const BulkSearch: React.FC<BulkSearchProps> = ({ onSelectContract }) => {
  const [rawText, setRawText] = useState('');
  const [deduplicate, setDeduplicate] = useState(true);
  const [parsedItems, setParsedItems] = useState<Array<{ name: string; rfc: string }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [matches, setMatches] = useState<any[]>([]);
  const [notFound, setNotFound] = useState<any[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'matches' | 'not_found'>('matches');

  // Procesar texto pegado desde Excel o lista
  const handleParseInput = (text: string) => {
    setRawText(text);
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

    const items: Array<{ name: string; rfc: string }> = [];
    const seen = new Set<string>();

    for (const line of lines) {
      // Ignorar cabeceras si se pegaron con encabezado
      if (line.toLowerCase().startsWith('nombre') || line.toLowerCase().startsWith('rfc') || line.toLowerCase().startsWith('proveedor')) {
        continue;
      }

      // Si viene separado por tabulaciones (copiado directo desde Excel)
      const tabs = line.split('\t').map(p => p.trim());
      let name = '';
      let rfc = '';

      if (tabs.length >= 2) {
        // Detectar cuál de las 2 columnas es RFC
        const p0 = normalizeRFC(tabs[0]);
        const p1 = normalizeRFC(tabs[1]);

        if (p0.length >= 10 && p0.length <= 13 && /^[A-Z&Ñ]{3,4}\d{6}/.test(p0)) {
          rfc = p0;
          name = tabs[1];
        } else if (p1.length >= 10 && p1.length <= 13 && /^[A-Z&Ñ]{3,4}\d{6}/.test(p1)) {
          rfc = p1;
          name = tabs[0];
        } else {
          name = tabs[0];
          rfc = tabs[1];
        }
      } else {
        // Una sola columna: determinar si es RFC o Nombre
        const testRfc = normalizeRFC(line);
        if (testRfc.length >= 10 && testRfc.length <= 13 && /^[A-Z&Ñ]{3,4}\d{6}/.test(testRfc)) {
          rfc = testRfc;
        } else {
          name = line;
        }
      }

      const key = `${name.toLowerCase()}|${rfc.toUpperCase()}`;
      if (deduplicate && seen.has(key)) {
        continue;
      }
      seen.add(key);

      if (name || rfc) {
        items.push({ name, rfc });
      }
    }

    setParsedItems(items);
  };

  const handleClear = () => {
    setRawText('');
    setParsedItems([]);
    setMatches([]);
    setNotFound([]);
    setProgress(0);
    setIsProcessing(false);
  };

  const handleExecuteBulkSearch = async () => {
    if (parsedItems.length === 0) return;

    setIsProcessing(true);
    setProgress(0);
    setMatches([]);
    setNotFound([]);

    const batchSize = 15; // Lotes pequeños para respuesta fluida y cuotas gratuitas
    const allMatches: any[] = [];
    const allNotFound: any[] = [];

    for (let i = 0; i < parsedItems.length; i += batchSize) {
      const batch = parsedItems.slice(i, i + batchSize);

      try {
        const response = await fetch('/api/search/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          },
          body: JSON.stringify({
            items: batch,
            limitPerTerm: 25,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.matches) allMatches.push(...data.matches);
          if (data.notFound) allNotFound.push(...data.notFound);
        }
      } catch (err) {
        console.error('Error procesando lote masivo:', err);
      }

      const currentProgress = Math.round(((i + batch.length) / parsedItems.length) * 100);
      setProgress(currentProgress);
      setMatches([...allMatches]);
      setNotFound([...allNotFound]);
    }

    setIsProcessing(false);
  };

  // Exportar todos los contratos encontrados
  const handleExportMatches = async () => {
    const flatContracts: any[] = [];
    for (const m of matches) {
      for (const c of m.contracts) {
        flatContracts.push({
          ...c,
          termino_buscado: m.inputName || m.inputRfc,
          tipo_coincidencia: m.matchType,
        });
      }
    }

    await exportContratosToExcel(
      flatContracts,
      `Contratos_APF_Masiva_${new Date().toISOString().slice(0, 10)}.xlsx`,
      'Contratos Encontrados'
    );
  };

  // Exportar términos no encontrados
  const handleExportNotFound = async () => {
    await exportNotFoundListToExcel(
      notFound,
      `Sin_Coincidencias_APF_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const totalContractsFound = matches.reduce((sum, m) => sum + (m.contractsCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Panel de pegado y configuración */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>Búsqueda Masiva por Lista o Copiado desde Excel</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Copia y pega directamente dos columnas desde Excel (<strong>Nombre</strong> y <strong>RFC</strong>) o una lista de proveedores.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={deduplicate}
                onChange={(e) => {
                  setDeduplicate(e.target.checked);
                  handleParseInput(rawText);
                }}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Eliminar duplicados</span>
            </label>
          </div>
        </div>

        <textarea
          rows={5}
          value={rawText}
          onChange={(e) => handleParseInput(e.target.value)}
          placeholder={`Pega aquí desde Excel. Ejemplo:\nCOMERCIALIZADORA NACIONAL S.A. DE C.V.\tCNA980101XYZ\nJUAN PEREZ HERNANDEZ\tPEHJ800101ABC\nBBA830831LJ2`}
          className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-600 focus:outline-none"
        />

        {/* Barra de acción */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-600">
            {parsedItems.length > 0 ? (
              <span>
                <strong>{parsedItems.length}</strong> términos detectados listos para consultar.
              </span>
            ) : (
              <span className="text-slate-400">Ingresa o pega tu lista arriba</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleClear}
              disabled={!rawText && parsedItems.length === 0}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar</span>
            </button>

            <button
              onClick={handleExecuteBulkSearch}
              disabled={parsedItems.length === 0 || isProcessing}
              className="flex-1 sm:flex-initial px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Procesando ({progress}%)...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-emerald-400" />
                  <span>Consultar Lista en Base APF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Barra de progreso interactiva */}
        {isProcessing && (
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs text-slate-600 font-medium">
              <span>Buscando en 535,022 contratos públicos...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Resumen de resultados y pestañas */}
      {(matches.length > 0 || notFound.length > 0) && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('matches')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  activeTab === 'matches'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Con Contratos ({matches.length} proveedores • {totalContractsFound} contratos)</span>
              </button>

              <button
                onClick={() => setActiveTab('not_found')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  activeTab === 'not_found'
                    ? 'bg-red-900 text-white shadow-xs'
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>Sin Coincidencias ({notFound.length})</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {activeTab === 'matches' && matches.length > 0 && (
                <button
                  onClick={handleExportMatches}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Contratos (.xlsx)</span>
                </button>
              )}

              {activeTab === 'not_found' && notFound.length > 0 && (
                <button
                  onClick={handleExportNotFound}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar No Encontrados (.xlsx)</span>
                </button>
              )}
            </div>
          </div>

          {/* Vista Pestaña: Coincidencias Encontradas */}
          {activeTab === 'matches' && (
            <div className="space-y-3">
              {matches.map((item, idx) => {
                const isExpanded = expandedIndex === idx;
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-colors"
                  >
                    <div
                      onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                      className="p-4 flex items-center justify-between cursor-pointer bg-slate-50/50 hover:bg-slate-100/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {item.inputName || item.inputRfc}
                            </span>
                            {item.matchType === 'EXACT_RFC' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Coincidencia Exacta RFC
                              </span>
                            )}
                            {item.matchType === 'EXACT_NAME' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                                Coincidencia Nombre Exacto
                              </span>
                            )}
                            {item.matchType === 'FUZZY_NAME' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                Coincidencia Aproximada
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">
                            RFC Consultado: {item.inputRfc || 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="font-bold text-slate-900 text-sm block">
                            {formatCurrency(item.totalAmountMXN, 'MXN')}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {item.contractsCount} contrato{item.contractsCount !== 1 ? 's' : ''} registrado{item.contractsCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Desplegable con los contratos del proveedor */}
                    {isExpanded && (
                      <div className="p-4 border-t border-slate-200 bg-white">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-600 font-semibold">
                              <tr>
                                <th className="py-2 px-3">Año</th>
                                <th className="py-2 px-3">Código</th>
                                <th className="py-2 px-3">Título / Objeto</th>
                                <th className="py-2 px-3">Institución</th>
                                <th className="py-2 px-3 text-right">Importe</th>
                                <th className="py-2 px-3 text-center">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {item.contracts.map((c: any) => (
                                <tr key={c.id} className="hover:bg-slate-50">
                                  <td className="py-2 px-3 font-mono font-medium">{c.year_file}</td>
                                  <td className="py-2 px-3 font-mono text-slate-900">{c.codigo_contrato}</td>
                                  <td className="py-2 px-3 max-w-xs truncate" title={c.titulo_contrato}>
                                    {c.titulo_contrato}
                                  </td>
                                  <td className="py-2 px-3 font-semibold text-slate-700">{c.siglas_institucion}</td>
                                  <td className="py-2 px-3 text-right font-mono font-semibold">
                                    {formatCurrency(Number(c.importe_contrato) || 0, c.moneda || 'MXN')}
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => onSelectContract(c.id)}
                                        className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                                        title="Ver 73 columnas"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                      {c.direccion_anuncio && (
                                        <a
                                          href={c.direccion_anuncio}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                        </a>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Vista Pestaña: Sin Coincidencias */}
          {activeTab === 'not_found' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 bg-red-50/50 border-b border-red-100 text-xs text-red-800 flex items-center justify-between">
                <span>
                  Los siguientes <strong>{notFound.length}</strong> términos no arrojaron contratos registrados en las bases oficiales de CompraNet ni Compras MX (2020-2026).
                </span>
                <button
                  onClick={handleExportNotFound}
                  className="px-3 py-1 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Exportar Esta Lista a Excel</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 uppercase font-semibold text-[11px]">
                    <tr>
                      <th className="py-2.5 px-4">#</th>
                      <th className="py-2.5 px-4">RFC Buscado</th>
                      <th className="py-2.5 px-4">Nombre / Razón Social</th>
                      <th className="py-2.5 px-4">Estatus en Base de Datos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {notFound.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-4 font-mono font-medium text-slate-800">
                          {item.rfc || <span className="text-slate-300 italic">No proporcionado</span>}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-800">
                          {item.name || <span className="text-slate-300 italic">No proporcionado</span>}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                            0 contratos encontrados
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
