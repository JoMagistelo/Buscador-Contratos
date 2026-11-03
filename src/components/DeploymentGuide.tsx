import React, { useState } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const DeploymentGuide: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [openStep, setOpenStep] = useState<number | null>(1);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const steps = [
    {
      num: 1,
      title: 'Crear tus 3 cuentas gratuitas (Sin tarjeta bancaria)',
      summary: 'Regístrate en los 3 servicios que mantendrán tu aplicación en línea para siempre.',
      content: (
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            No necesitas tarjeta de crédito ni pagar un solo centavo. Abre estas tres páginas y regístrate con tu correo o cuenta de Google:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1">
                GitHub.com <ExternalLink className="w-3 h-3" />
              </a>: Donde guardarás el código fuente de tu aplicación de forma privada.
            </li>
            <li>
              <a href="https://turso.tech" target="_blank" rel="noreferrer" className="text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1">
                Turso.tech <ExternalLink className="w-3 h-3" />
              </a>: Base de datos permanente con 5 GB de almacenamiento gratuito (más de 535,000 contratos ocupan ~640 MB).
            </li>
            <li>
              <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer" className="text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1">
                Cloudflare.com <ExternalLink className="w-3 h-3" />
              </a>: Alojamiento público gratuito para el buscador con 100,000 consultas diarias.
            </li>
          </ul>
        </div>
      ),
    },
    {
      num: 2,
      title: 'Crear la base de datos en Turso y obtener claves',
      summary: 'Crear la base de datos "contratos-apf" con dos clics en el panel de Turso.',
      content: (
        <div className="space-y-3 text-xs text-slate-600">
          <ol className="list-decimal pl-5 space-y-2">
            <li>Inicia sesión en <strong>Turso.tech</strong>.</li>
            <li>Haz clic en el botón azul <strong>&quot;Create database&quot;</strong>.</li>
            <li>En el campo de nombre, escribe: <code className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-800">contratos-apf</code>.</li>
            <li>Selecciona la región más cercana (ejemplo: <em>us-east</em> o <em>iad</em>).</li>
            <li>Haz clic en <strong>&quot;Create&quot;</strong>.</li>
            <li>
              En la pantalla de tu base, verás la <strong>Database URL</strong> (comienza con <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">libsql://contratos-apf-...turso.io</code>). Copia ese valor.
            </li>
            <li>
              Haz clic en la pestaña <strong>&quot;Tokens&quot;</strong> o en <strong>&quot;Generate Token&quot;</strong>, crea un token y cópialo.
            </li>
          </ol>
        </div>
      ),
    },
    {
      num: 3,
      title: 'Exportar el código a GitHub desde Google AI Studio',
      summary: 'Conectar AI Studio con tu repositorio de GitHub.',
      content: (
        <div className="space-y-3 text-xs text-slate-600">
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>En la esquina superior derecha de la interfaz de Google AI Studio, busca el botón <strong>&quot;Export&quot;</strong> o <strong>&quot;GitHub&quot;</strong>.</li>
            <li>Autoriza tu cuenta de GitHub.</li>
            <li>Crea un repositorio nuevo, nómbralo por ejemplo <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">explorador-contratos-apf</code> (puedes marcarlo como Privado si prefieres).</li>
            <li>Confirma la exportación. Todos los archivos quedarán guardados en tu repositorio.</li>
          </ol>
        </div>
      ),
    },
    {
      num: 4,
      title: 'Conectar GitHub con Cloudflare Workers',
      summary: 'Vincular Cloudflare para que publique tu aplicación automáticamente.',
      content: (
        <div className="space-y-3 text-xs text-slate-600">
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Entra a tu panel de <strong>Cloudflare</strong>.</li>
            <li>En el menú lateral izquierdo, haz clic en <strong>Workers &amp; Pages</strong> → <strong>Create application</strong>.</li>
            <li>Selecciona la pestaña <strong>Pages / Workers</strong> o <strong>&quot;Connect to Git&quot;</strong>.</li>
            <li>Selecciona tu cuenta de GitHub y el repositorio <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">explorador-contratos-apf</code>.</li>
            <li>En los ajustes de compilación (Build settings):
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Build command: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">npm run build</code></li>
                <li>Output directory: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">dist</code></li>
              </ul>
            </li>
            <li>Haz clic en <strong>&quot;Save and Deploy&quot;</strong>.</li>
          </ol>
        </div>
      ),
    },
    {
      num: 5,
      title: 'Configurar las 4 Variables y Secretos en Cloudflare',
      summary: 'Pegar las 4 credenciales privadas en Settings → Variables and Secrets.',
      content: (
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            En tu aplicación de Cloudflare, ve a <strong>Settings</strong> → <strong>Variables and Secrets</strong>. Agrega las siguientes 4 variables tipo <strong>Secret</strong>:
          </p>
          <div className="space-y-2">
            {[
              { key: 'TURSO_DATABASE_URL', desc: 'URL de tu base Turso (libsql://contratos-apf-...turso.io)' },
              { key: 'TURSO_AUTH_TOKEN', desc: 'Token de acceso generado en Turso' },
              { key: 'ADMIN_PASSWORD', desc: 'Contraseña segura que elijas para entrar al panel administrativo' },
              { key: 'ADMIN_SESSION_SECRET', desc: 'Cadena secreta aleatoria de al menos 32 caracteres para firmar sesiones' },
            ].map((v) => (
              <div key={v.key} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <code className="font-bold text-slate-900 font-mono text-[11px]">{v.key}</code>
                  <p className="text-[11px] text-slate-500">{v.desc}</p>
                </div>
                <button
                  onClick={() => handleCopy(v.key, v.key)}
                  className="p-1 rounded text-slate-400 hover:text-slate-800"
                  title="Copiar nombre de variable"
                >
                  {copiedKey === v.key ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400">
            Haz clic en <strong>&quot;Deploy&quot;</strong> para que los secretos surtan efecto de inmediato.
          </p>
        </div>
      ),
    },
    {
      num: 6,
      title: 'Cargar los 7 archivos CSV desde el Panel de Administración',
      summary: 'Subir los archivos en el orden recomendado comprobando el progreso en vivo.',
      content: (
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            Abre tu enlace público asignado por Cloudflare (ej. <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">https://tu-app.workers.dev</code>), entra a la pestaña <strong>&quot;Administración&quot;</strong> e introduce tu <strong>ADMIN_PASSWORD</strong>.
          </p>
          <p>
            Orden recomendado de carga para verificar el importador:
          </p>
          <ol className="list-decimal pl-5 space-y-1">
            <li><strong>CONTRATOS_COMPRANET_2020.CSV</strong> (5 filas — se carga en 1 segundo).</li>
            <li><strong>CONTRATOS_COMPRANET_2021.CSV</strong> (31 filas).</li>
            <li><strong>CONTRATOS_COMPRANET_2022.CSV</strong> (1,678 filas).</li>
            <li><strong>CONTRATOS_COMPRANET_2024.CSV</strong> (146,509 filas).</li>
            <li><strong>CONTRATOS_COMPRASMX_2025.CSV</strong> (128,880 filas).</li>
            <li><strong>CONTRATOS_COMPRASMX_2026.CSV</strong> (88,089 filas).</li>
            <li><strong>CONTRATOS_COMPRANET_2023.CSV</strong> (169,830 filas — el más grande, ~160 MB).</li>
          </ol>
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
            <strong>Verificación final:</strong> Al terminar de subir los 7 archivos, el contador en el panel debe marcar <strong>535,022 registros</strong>.
          </div>
        </div>
      ),
    },
    {
      num: 7,
      title: 'Cómo actualizar contratos en el futuro cuando Compras MX publique nuevos archivos',
      summary: 'Procedimiento de reemplazo de versiones sin duplicados.',
      content: (
        <div className="space-y-2 text-xs text-slate-600">
          <p>
            Cuando descargues un CSV actualizado desde{' '}
            <a href="https://comprasmx.buengobierno.gob.mx/datos-abiertos" target="_blank" rel="noreferrer" className="text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1">
              comprasmx.buengobierno.gob.mx/datos-abiertos <ExternalLink className="w-3 h-3" />
            </a>:
          </p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Entra al <strong>Panel de Administración</strong>.</li>
            <li>En la tabla de bases cargadas, pulsa el botón de eliminar junto a la versión del año que vas a reemplazar.</li>
            <li>Selecciona el nuevo archivo CSV e inicia la carga por fragmentos.</li>
            <li>La base se actualizará con los nuevos contratos sin crear registros duplicados.</li>
          </ol>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-bold text-slate-900">
            Guía Paso a Paso para Principiantes: Publicación Gratuita 24/7
          </h2>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Esta guía te enseña exactamente cómo publicar tu buscador en internet para que cualquier persona pueda usarlo sin que tengas que dejar tu computadora encendida. Todo funciona bajo los planes gratuitos de <strong>Turso Cloud</strong> y <strong>Cloudflare Workers</strong>, sin tarjeta bancaria.
        </p>

        <div className="flex items-center gap-2 pt-1">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-xs text-slate-700 font-medium">
            Garantía: $0 pesos mensuales, 5 GB de almacenamiento en Turso y 100,000 visitas diarias en Cloudflare.
          </span>
        </div>
      </div>

      {/* Acordeón de pasos */}
      <div className="space-y-3">
        {steps.map((st) => {
          const isOpen = openStep === st.num;
          return (
            <div
              key={st.num}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-colors"
            >
              <div
                onClick={() => setOpenStep(isOpen ? null : st.num)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <span className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 font-bold text-sm flex items-center justify-center shrink-0">
                    {st.num}
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{st.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{st.summary}</p>
                  </div>
                </div>

                <div className="text-slate-400">
                  {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </div>
              </div>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 border-t border-slate-100 bg-slate-50/30 animate-in fade-in duration-150">
                  {st.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
