import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { BarChart3, Building, FileText, Users, DollarSign, Calendar, Loader2 } from 'lucide-react';
import { formatCurrency } from '../shared/contratosSchema.js';

export const AnalyticsView: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error cargando estadísticas:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 shadow-sm space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
        <p className="text-sm font-medium text-slate-600">Calculando estadísticas globales de contratación...</p>
      </div>
    );
  }

  const totals = stats?.totals || { total_contratos: 0, total_proveedores: 0, total_instituciones: 0 };
  const byYear = (stats?.byYear || []).map((y: any) => ({
    year: String(y.year_file),
    contratos: Number(y.count || 0),
    montoMXN: Number(y.total_mxn || 0),
  }));

  const topInst = (stats?.topInstituciones || []).map((i: any) => ({
    siglas: i.siglas_institucion,
    contratos: Number(i.count || 0),
    montoMXN: Number(i.total_mxn || 0),
  }));

  const byMoneda = stats?.byMoneda || [];

  const COLORS = ['#0F766E', '#0284C7', '#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

  return (
    <div className="space-y-6">
      {/* Tarjetas resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Total Contratos Registrados</span>
            <span className="text-2xl font-black text-slate-900 font-mono">
              {Number(totals.total_contratos).toLocaleString('es-MX')}
            </span>
            <span className="text-[10px] text-emerald-600 font-medium block">7 años APF cubiertos</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Proveedores Únicos (RFCs)</span>
            <span className="text-2xl font-black text-slate-900 font-mono">
              {Number(totals.total_proveedores).toLocaleString('es-MX')}
            </span>
            <span className="text-[10px] text-blue-600 font-medium block">Empresas y personas físicas</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Dependencias e Instituciones</span>
            <span className="text-2xl font-black text-slate-900 font-mono">
              {Number(totals.total_instituciones).toLocaleString('es-MX')}
            </span>
            <span className="text-[10px] text-indigo-600 font-medium block">Administración Pública Federal</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Periodo Oficial</span>
            <span className="text-2xl font-black text-slate-900 font-mono">2020 - 2026</span>
            <span className="text-[10px] text-amber-600 font-medium block">CompraNet y Compras MX</span>
          </div>
        </div>
      </div>

      {/* Gráficas analíticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfica: Contratos por Año */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>Distribución Anual de Contratos (2020 - 2026)</span>
              </h3>
              <p className="text-xs text-slate-400">Total de contratos registrados por año de inicio</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byYear} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  formatter={(val: any) => [Number(val).toLocaleString('es-MX'), 'Contratos']}
                  labelFormatter={(lbl) => `Año: ${lbl}`}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                />
                <Bar dataKey="contratos" radius={[6, 6, 0, 0]}>
                  {byYear.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfica: Top 10 Instituciones Compradoras */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              <span>Top 10 Dependencias con Mayor Número de Contratos</span>
            </h3>
            <p className="text-xs text-slate-400">Instituciones ejecutoras de contrataciones</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topInst} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis dataKey="siglas" type="category" tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }} width={75} />
                <Tooltip
                  formatter={(val: any) => [Number(val).toLocaleString('es-MX'), 'Contratos']}
                  labelFormatter={(lbl) => `Institución: ${lbl}`}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                />
                <Bar dataKey="contratos" fill="#0284C7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Desglose por Moneda */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Desglose por Moneda de Contratación (Sin Mezclar Divisas)</span>
          </h3>
          <p className="text-xs text-slate-400">
            Regla de integridad contable: los importes en distintas divisas no se combinan aritméticamente.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {byMoneda.map((m: any, i: number) => (
            <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <span className="font-bold text-slate-900 text-base font-mono block">
                {m.moneda || 'No especificada'}
              </span>
              <span className="text-xs text-slate-500 block mt-1">
                Contratos: <strong>{Number(m.count).toLocaleString('es-MX')}</strong>
              </span>
              <span className="text-xs font-semibold text-emerald-700 block mt-0.5">
                Monto acumulado: {formatCurrency(Number(m.total) || 0, m.moneda || 'MXN')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
