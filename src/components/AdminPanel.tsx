import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Database,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Play,
  Pause,
  Trash2,
  HardDrive,
  FileText,
  Clock,
  ShieldAlert,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import {
  inspectCsvHeader,
  CsvValidationSummary,
  ChunkCsvUploader,
  ChunkProgress,
} from '../services/csvImporter.js';

interface AdminPanelProps {
  isAdminLoggedIn: boolean;
  setIsAdminLoggedIn: (val: boolean) => void;
  onNavigateToGuide: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isAdminLoggedIn,
  setIsAdminLoggedIn,
  onNavigateToGuide,
}) => {
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [adminStatus, setAdminStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [initTableMsg, setInitTableMsg] = useState('');

  // Estados de importación de archivo
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileSummary, setFileSummary] = useState<CsvValidationSummary | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [isInspecting, setIsInspecting] = useState(false);

  const [uploadProgress, setUploadProgress] = useState<ChunkProgress | null>(null);
  const uploaderRef = useRef<ChunkCsvUploader | null>(null);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/admin/status');
      if (res.ok) {
        const data = await res.json();
        setAdminStatus(data);
      } else if (res.status === 401) {
        setIsAdminLoggedIn(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isAdminLoggedIn) {
      fetchStatus();
    }
  }, [isAdminLoggedIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAdminLoggedIn(true);
        if (data.token) {
          sessionStorage.setItem('admin_token', data.token);
        }
        fetchStatus();
      } else {
        setLoginError(data.error || 'Contraseña incorrecta');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Error de conexión');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    sessionStorage.removeItem('admin_token');
    setIsAdminLoggedIn(false);
    setAdminStatus(null);
  };

  const handleInitTables = async () => {
    setInitTableMsg('Inicializando...');
    try {
      const res = await fetch('/api/admin/init-tables', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('admin_token') || ''}`,
        },
      });
      const data = await res.json();
      setInitTableMsg(data.message || (data.success ? 'Tablas verificadas.' : 'Error'));
      fetchStatus();
    } catch (err: any) {
      setInitTableMsg(`Error: ${err.message}`);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsInspecting(true);
    setUploadProgress(null);

    try {
      const summary = await inspectCsvHeader(file);
      setFileSummary(summary);
      setSelectedYear(summary.detectedYear);
    } catch (err: any) {
      alert(`Error al inspeccionar CSV: ${err.message}`);
      setSelectedFile(null);
    } finally {
      setIsInspecting(false);
    }
  };

  const handleStartUpload = async () => {
    if (!selectedFile || !fileSummary) return;

    const token = sessionStorage.getItem('admin_token') || '';
    const uploader = new ChunkCsvUploader({
      file: selectedFile,
      token,
      year: selectedYear,
      fileSha256: fileSummary.sha256,
      chunkSizeRows: 300,
      onProgress: (p) => setUploadProgress({ ...p }),
    });

    uploaderRef.current = uploader;

    try {
      await uploader.start();
      fetchStatus();
    } catch (err: any) {
      console.error('Fallo en carga:', err);
    }
  };

  const handleDeleteFile = async (sha256: string) => {
    if (!confirm('¿Deseas eliminar los contratos correspondientes a esta versión del archivo?')) {
      return;
    }

    try {
      const res = await fetch('/api/admin/delete-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('admin_token') || ''}`,
        },
        body: JSON.stringify({ sha256 }),
      });

      if (res.ok) {
        fetchStatus();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Si no está autenticado, mostrar formulario de acceso
  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-8">
        <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-center text-slate-900">Acceso Administrativo</h2>
        <p className="text-xs text-center text-slate-500 mt-1 mb-6">
          Panel privado para inicialización de base de datos y carga de archivos CSV de CompraNet y Compras MX.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contraseña de Administrador (ADMIN_PASSWORD)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña de administración..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {loginError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{loginError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <Lock className="w-4 h-4" />}
            <span>Entrar al Panel</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <button
            onClick={onNavigateToGuide}
            className="text-xs text-emerald-700 hover:underline inline-flex items-center gap-1 font-medium"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>¿Primera vez? Ver guía de configuración paso a paso</span>
          </button>
        </div>
      </div>
    );
  }

  // Panel Administrativo Activo
  return (
    <div className="space-y-6">
      {/* Barra superior del panel */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-lg font-bold">Panel de Administración APF</h2>
          </div>
          <p className="text-xs text-slate-400">
            Conexión activa: <strong className="text-emerald-400">{adminStatus?.connectionType || 'Turso Cloud / SQLite'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleInitTables}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verificar Tablas e Índices</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-200 border border-red-800 text-xs font-semibold transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {initTableMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{initTableMsg}</span>
        </div>
      )}

      {/* Métricas de Almacenamiento y Cuota Gratuita Turso */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Contratos en Base de Datos</span>
              <span className="text-xl font-black text-slate-900 font-mono">
                {Number(adminStatus?.totalContratos || 0).toLocaleString('es-MX')}
              </span>
              <span className="text-[10px] text-slate-400">Meta total: 535,022 registros</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Consumo Almacenamiento</span>
              <span className="text-xl font-black text-slate-900 font-mono">
                {adminStatus?.estimatedStorageMB || 0} MB / {adminStatus?.freeLimitStorageMB || 5120} MB
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">Plan gratuito Turso (5 GB)</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Archivos Registrados</span>
              <span className="text-xl font-black text-slate-900 font-mono">
                {(adminStatus?.archivos || []).length} / 7 bases
              </span>
              <span className="text-[10px] text-indigo-600 font-medium">CompraNet 2020-24 • ComprasMX 25-26</span>
            </div>
          </div>
        </div>
      </div>

      {/* Asistente de Carga por Fragmentos de CSV */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-emerald-600" />
            <span>Importador Oficial de CSV (Fragmentación en Navegador)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Soporta archivos de más de 150 MB (ej. 2023 con 169k filas). El archivo se decodifica en <strong>Windows-1252</strong>, preservando acentos, conservando ambas columnas <em>Moneda</em> y <em>Convenio modificatorio</em>, y enviando micro-lotes que no saturan Cloudflare Workers.
          </p>
        </div>

        {/* Selector de Archivo */}
        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-emerald-500 transition-colors bg-slate-50/50">
          <input
            type="file"
            accept=".csv"
            id="csv-file-input"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="csv-file-input" className="cursor-pointer space-y-2 block">
            <UploadCloud className="w-8 h-8 mx-auto text-slate-400" />
            <div className="text-xs font-semibold text-slate-700">
              {selectedFile ? selectedFile.name : 'Haz clic para seleccionar un CSV de tu computadora'}
            </div>
            <div className="text-[11px] text-slate-400">
              Formatos soportados: CONTRATOS_COMPRANET_2020 a 2024, CONTRATOS_COMPRASMX_2025 y 2026.
            </div>
          </label>
        </div>

        {/* Resumen de pre-inspección del archivo */}
        {isInspecting && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Calculando huella digital SHA-256 e inspeccionando las 73 columnas...</span>
          </div>
        )}

        {fileSummary && !isInspecting && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Archivo</span>
                <span className="font-semibold text-slate-800 block truncate" title={fileSummary.fileName}>
                  {fileSummary.fileName}
                </span>
                <span className="text-[10px] text-slate-500">
                  {(fileSummary.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Año Asignado</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="font-bold text-slate-900 bg-white border border-slate-300 rounded px-1 text-xs mt-0.5"
                >
                  {[2020, 2021, 2022, 2023, 2024, 2025, 2026].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 block">Inicio de contrato</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Estructura Columnas</span>
                <span className="font-bold text-slate-900 block">
                  {fileSummary.detectedColumnsCount} columnas
                </span>
                <span className="text-[10px] text-emerald-600 font-medium">
                  {fileSummary.has73Columns ? '✓ 73 columnas oficiales' : 'Columnas detectadas'}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Huella SHA-256</span>
                <span className="font-mono text-[10px] text-slate-700 block truncate" title={fileSummary.sha256}>
                  {fileSummary.sha256.substring(0, 16)}...
                </span>
                <span className="text-[10px] text-slate-400">Verificación idempotente</span>
              </div>
            </div>

            {/* Aviso de columnas duplicadas preservadas */}
            {fileSummary.duplicateHeadersDetected.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <strong>Encabezados duplicados identificados y protegidos:</strong> Se detectaron{' '}
                  {fileSummary.duplicateHeadersDetected.join(', ')}. Ambas instancias se conservan independientemente como Moneda_1 / Moneda_2 y Convenio_1 / Convenio_2 sin sobreescritura.
                </div>
              </div>
            )}

            {/* Botón de inicio de carga */}
            {!uploadProgress && (
              <button
                onClick={handleStartUpload}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                <span>Iniciar Carga por Fragmentos a Base Permanente</span>
              </button>
            )}
          </div>
        )}

        {/* Panel de progreso de carga en vivo */}
        {uploadProgress && (
          <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {uploadProgress.status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />}
                {uploadProgress.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {uploadProgress.status === 'paused' && <Pause className="w-4 h-4 text-amber-400" />}
                <span className="font-bold text-sm">
                  {uploadProgress.status === 'completed'
                    ? '✓ ¡Carga Completada con Éxito!'
                    : uploadProgress.status === 'paused'
                    ? 'Carga Pausada'
                    : 'Importando contratos en vivo...'}
                </span>
              </div>
              <span className="font-mono text-xs text-emerald-400 font-bold">
                {uploadProgress.percentage}%
              </span>
            </div>

            {/* Barra de progreso */}
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress.percentage}%` }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-300 pt-1">
              <div>
                Filas importadas: <strong className="text-white font-mono">{uploadProgress.processedRows.toLocaleString('es-MX')}</strong>
              </div>
              <div>
                Velocidad: <strong className="text-white font-mono">{uploadProgress.speedRowsPerSec} filas/seg</strong>
              </div>
              <div>
                Lotes enviados: <strong className="text-white font-mono">{uploadProgress.currentChunk}</strong>
              </div>
              <div>
                Codificación: <strong className="text-emerald-400">Windows-1252</strong>
              </div>
            </div>

            {/* Controles de pausa y reanudar */}
            {uploadProgress.status !== 'completed' && (
              <div className="flex items-center gap-2 pt-2">
                {uploadProgress.status === 'uploading' ? (
                  <button
                    onClick={() => uploaderRef.current?.pause()}
                    className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pausar</span>
                  </button>
                ) : (
                  <button
                    onClick={() => uploaderRef.current?.resume()}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Reanudar</span>
                  </button>
                )}
                <button
                  onClick={() => uploaderRef.current?.cancel()}
                  className="px-4 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 text-xs font-medium text-red-200"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Historial de archivos cargados */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-600" />
              <span>Bases Cargadas Permanentemente en Turso</span>
            </h3>
            <p className="text-xs text-slate-400">
              Registros disponibles 24/7 para el buscador público sin necesidad de mantener el navegador abierto.
            </p>
          </div>
          <button
            onClick={fetchStatus}
            disabled={loadingStatus}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Actualizar tabla"
          >
            <RotateCcw className={`w-4 h-4 ${loadingStatus ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Año</th>
                <th className="py-2.5 px-3">Archivo Original</th>
                <th className="py-2.5 px-3">Filas Importadas</th>
                <th className="py-2.5 px-3">Tamaño</th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-3">Fecha de Carga</th>
                <th className="py-2.5 px-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(adminStatus?.archivos || []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Aún no se ha cargado ningún archivo CSV. Selecciona un archivo en la sección superior para comenzar.
                  </td>
                </tr>
              ) : (
                adminStatus.archivos.map((f: any) => (
                  <tr key={f.sha256} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold font-mono text-slate-800">{f.year}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{f.nombre_archivo}</td>
                    <td className="py-2.5 px-3 font-mono font-medium text-emerald-700">
                      {Number(f.filas_importadas || 0).toLocaleString('es-MX')}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {((Number(f.tamano_bytes) || 0) / (1024 * 1024)).toFixed(1)} MB
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        {f.estado || 'completado'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">{f.fecha_importacion}</td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleDeleteFile(f.sha256)}
                        className="p-1 rounded text-red-600 hover:bg-red-50 hover:text-red-800 transition-colors"
                        title="Eliminar esta versión de archivo para actualizarla"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
