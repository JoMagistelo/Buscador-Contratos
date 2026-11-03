import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { createApiApp } from './src/server/apiRouter.js';
import { getDbClient, initDatabaseTables } from './src/server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Configurar límite amplio para ingesta por fragmentos de CSV
  app.use(express.json({ limit: '60mb' }));
  app.use(express.urlencoded({ extended: true, limit: '60mb' }));

  // Inicializar tablas de base de datos automáticamente
  try {
    const client = getDbClient();
    await initDatabaseTables(client);
    console.log('✓ Tablas de base de datos inicializadas.');
  } catch (err: any) {
    console.warn('Nota de inicialización de BD:', err.message || err);
  }

  // Despachador de API que utiliza el mismo Hono router de producción
  const honoApp = createApiApp();

  app.all('/api/*', async (req, res) => {
    try {
      const fullUrl = `${req.protocol}://${req.get('host') || 'localhost'}${req.originalUrl}`;
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value) {
          if (Array.isArray(value)) {
            for (const v of value) headers.append(key, v);
          } else {
            headers.set(key, value);
          }
        }
      }

      const init: RequestInit = {
        method: req.method,
        headers,
      };

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        init.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      }

      const webReq = new Request(fullUrl, init);
      const webRes = await honoApp.fetch(webReq);

      res.status(webRes.status);
      webRes.headers.forEach((val, key) => {
        res.setHeader(key, val);
      });

      const bodyText = await webRes.text();
      res.send(bodyText);
    } catch (apiErr: any) {
      console.error('Error en API:', apiErr);
      res.status(500).json({ error: 'Error interno en servidor API', details: apiErr.message });
    }
  });

  if (!isProd) {
    // Modo Desarrollo: montar middleware de Vite
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Modo Producción: servir estáticos desde ./dist
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Explorador de Contratos APF listo en http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fallo crítico al iniciar servidor:', err);
  process.exit(1);
});
