import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Download,
  ExternalLink,
  Eye,
  RotateCcw,
  Building2,
  Calendar,
  DollarSign,
  AlertCircle,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { formatCurrency } from '../shared/contratosSchema.js';
import { exportContratosToExcel } from '../services/excelExporter.js';

interface IndividualSearchProps {
  onSelectContract: (id: string) => void;
}

export const IndividualSearch: React.FC<IndividualSearchProps> = ({ onSelectContract }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [selectedInst, setSelectedInst] = useState<string>('');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [results, setResults] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [copiedRfc, setCopiedRfc] = useState<string | null>(null);

  const availableYears = [2020, 2021, 2022, 2023, 2024, 2025, 2026];
  const popularAgencies = ['IMSS', 'CFE', 'ISSSTE', 'SEDENA', 'PEMEX', 'BIENESTAR', 'SCT', 'SEP', 'SALUD'];

  const performSearch = useCallback(async (newPage = page) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const payload: any = {
        query: searchTerm,
        page: newPage,
        pageSize,
        filters: {},
      };

      if (selectedYears.length > 0) payload.filters.years = selectedYears;
      if (selectedCurrency) payload.filters.currency = selectedCurrency;
      if (selectedInst) payload.filters.institutions = [selectedInst];
      if (minAmount && !isNaN(Number(minAmount))) payload.filters.minAmount = Number(minAmount);
      if (maxAmount && !isNaN(Number(maxAmount))) payload.filters.maxAmount = Number(maxAmount);

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Error al consultar contratos');
      const data = await response.json();
      setResults(data.items || []);
      setTotalCount(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || 1);
    } catch (err) {
      console.error(err);
      setResults([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedYears, selectedCurrency, selectedInst, minAmount, maxAmount, page, pageSize]);

  // Ejecutar búsqueda inicial o al cambiar filtros principales
  useEffect(() => {
    performSearch(1);
  }, [selectedYears, selectedCurrency, selectedInst, pageSize]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(1);
  };

  const handleResetFilters = () => {
    setSelectedYears([]);
    setSelectedCurrency('');
    setSelectedInst('');
    setMinAmount('');
    setMaxAmount('');
    setSearchTerm('');
    setPage(1);
  };

  const toggleYear = (year: number) => {
    setSelectedYears(prev =>
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
    );
  };

  const handleExport = async () => {
    if (results.length === 0) return;
    await exportContratosToExcel(
      results,
      `Contratos_APF_Busqueda_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const handleCopyRfc = (rfc: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(rfc);
    setCopiedRfc(rfc);
    setTimeout(() => setCopiedRfc(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Barra de búsqueda principal */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por RFC (ej. BBA830831LJ2), Razón Social, Persona Física o Código de Contrato..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-600 text-sm placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-xs shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Buscar Contratos</span>
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors flex items-center justify-center gap-2 shrink-0 ${
                showFilters || selectedYears.length > 0 || selectedCurrency || selectedInst || minAmount || maxAmount
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filtros</span>
              {(selectedYears.length > 0 || selectedCurrency || selectedInst) && (
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
              )}
            </button>
          </div>

          {/* Filtros avanzados colapsables */}
          {showFilters && (
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-150">
              {/* Filtro por Año */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Año de inicio del contrato
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {availableYears.map((yr) => (
                    <button
                      type="button"
                      key={yr}
                      onClick={() => toggleYear(yr)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        selectedYears.includes(yr)
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtro por Dependencia / Institución */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Dependencia (Siglas)
                </label>
                <select
                  value={selectedInst}
                  onChange={(e) => setSelectedInst(e.target.value)}
                  className="w-full py-1.5 px-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Todas las instituciones</option>
                  {popularAgencies.map((inst) => (
                    <option key={inst} value={inst}>
                      {inst}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Moneda */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                  Moneda
                </label>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="w-full py-1.5 px-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">Todas las divisas</option>
                  <option value="MXN">MXN - Pesos Mexicanos</option>
                  <option value="USD">USD - Dólares Americanos</option>
                  <option value="EUR">EUR - Euros</option>
                </select>
              </div>

              {/* Rango de montos */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-slate-700">Rango de Importe (Monto antes de impuestos)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Mínimo ($)"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="w-1/2 py-1.5 px-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="text-slate-400 text-xs">-</span>
                  <input
                    type="number"
                    placeholder="Máximo ($)"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="w-1/2 py-1.5 px-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-end justify-end md:col-span-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpiar todos los filtros</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Barra de estado y exportación */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
        <div>
          <span className="text-sm font-semibold text-slate-800">
            {totalCount.toLocaleString('es-MX')} contratos encontrados
          </span>
          {searchTerm && (
            <span className="text-xs text-slate-500 ml-2">
              (Búsqueda para: &quot;<strong className="text-slate-700">{searchTerm}</strong>&quot;)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Mostrar:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="py-1 px-2 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none"
            >
              <option value="15">15</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>

          <button
            onClick={handleExport}
            disabled={results.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Tabla de resultados */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
            <p className="text-sm font-medium">Consultando registros públicos de contratos...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-3">
            <AlertCircle className="w-10 h-10 mx-auto text-slate-300" />
            <h3 className="font-semibold text-slate-700 text-base">No se encontraron contratos</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {hasSearched
                ? 'Verifica que el RFC esté completo o prueba buscando únicamente el apellido o parte del nombre.'
                : 'Ingresa un término de búsqueda o selecciona los filtros para comenzar.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-900 text-slate-200 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Año</th>
                  <th className="py-3 px-4">Código Contrato</th>
                  <th className="py-3 px-4">Proveedor / Contratista</th>
                  <th className="py-3 px-4">RFC</th>
                  <th className="py-3 px-4">Institución</th>
                  <th className="py-3 px-4 text-right">Importe</th>
                  <th className="py-3 px-4">Vigencia</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => onSelectContract(c.id)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-slate-500 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                        {c.year_file}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                      {c.codigo_contrato || 'S/N'}
                    </td>
                    <td className="py-3 px-4 max-w-[240px]">
                      <div className="font-semibold text-slate-900 truncate" title={c.nombre_proveedor}>
                        {c.nombre_proveedor || 'No especificado'}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate" title={c.titulo_contrato}>
                        {c.titulo_contrato || c.descripcion_contrato}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 inline-flex">
                        <span>{c.rfc_proveedor || 'Sin RFC'}</span>
                        {c.rfc_proveedor && (
                          <button
                            onClick={(e) => handleCopyRfc(c.rfc_proveedor, e)}
                            className="p-0.5 hover:text-emerald-950 transition-colors"
                            title="Copiar RFC"
                          >
                            {copiedRfc === c.rfc_proveedor ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 block">
                        {c.siglas_institucion || 'Dependencia'}
                      </span>
                      <span className="text-[10px] text-slate-400 block max-w-[130px] truncate" title={c.nombre_institucion}>
                        {c.nombre_institucion}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="font-bold text-slate-900 font-mono">
                        {formatCurrency(Number(c.importe_contrato) || 0, c.moneda || 'MXN')}
                      </div>
                      <div className="text-[10px] text-slate-400">{c.moneda || 'MXN'}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                      <div>{c.fecha_inicio || 'S/F'}</div>
                      <div className="text-[10px] text-slate-400">al {c.fecha_fin || 'S/F'}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onSelectContract(c.id)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="Ver Ficha Completa (73 columnas)"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {c.direccion_anuncio && (
                          <a
                            href={c.direccion_anuncio}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                            title="Abrir Anuncio Oficial"
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
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Página <strong>{page}</strong> de <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => performSearch(1)}
                disabled={page === 1}
                className="px-2.5 py-1 rounded-md border border-slate-300 bg-white text-xs disabled:opacity-40 hover:bg-slate-50"
              >
                Primera
              </button>
              <button
                onClick={() => performSearch(page - 1)}
                disabled={page <= 1}
                className="px-2.5 py-1 rounded-md border border-slate-300 bg-white text-xs disabled:opacity-40 hover:bg-slate-50"
              >
                Anterior
              </button>
              <button
                onClick={() => performSearch(page + 1)}
                disabled={page >= totalPages}
                className="px-2.5 py-1 rounded-md border border-slate-300 bg-white text-xs disabled:opacity-40 hover:bg-slate-50"
              >
                Siguiente
              </button>
              <button
                onClick={() => performSearch(totalPages)}
                disabled={page === totalPages}
                className="px-2.5 py-1 rounded-md border border-slate-300 bg-white text-xs disabled:opacity-40 hover:bg-slate-50"
              >
                Última
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
