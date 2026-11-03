import { Hono } from 'hono';
import {
  getDbClient,
  initDatabaseTables,
  insertContratosBatch,
  searchIndividual,
  searchBulk,
  getContratoFull,
  getGlobalStats,
  getAdminStatus,
  deleteImportedFile,
  isUsingTursoRemote,
} from './db.js';
import { createSessionToken, verifySessionToken } from './auth.js';

export interface EnvBindings {
  TURSO_DATABASE_URL?: string;
  TURSO_AUTH_TOKEN?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_SESSION_SECRET?: string;
  ASSETS?: { fetch(request: Request): Promise<Response> };
}

export function createApiApp(bindings?: EnvBindings) {
  const app = new Hono<{ Bindings: EnvBindings }>();

  // Helper para resolver variables de entorno tanto en Cloudflare Workers como en Node
  const getEnvVar = (c: any, key: keyof EnvBindings): string => {
    return c.env?.[key] || bindings?.[key] || (typeof process !== 'undefined' ? process.env[key] : '') || '';
  };

  // Helper de autenticación administrativa
  const requireAdmin = async (c: any, next: any) => {
    const secret = getEnvVar(c, 'ADMIN_SESSION_SECRET');
    if (!secret || secret.length < 32) return c.json({ error: 'Configuración administrativa incompleta' }, 503);
    const authHeader = c.req.header('Authorization');
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else {
      // Leer cookie si existe
      const cookieHeader = c.req.header('Cookie') || '';
      const match = cookieHeader.match(/admin_session=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }

    const valid = await verifySessionToken(token, secret);
    if (!valid) {
      return c.json({ error: 'No autorizado. Inicie sesión en el panel de administración.' }, 401);
    }

    return next();
  };

  // ==========================================
  // RUTAS PÚBLICAS DE BÚSQUEDA (MÁXIMA PRIVACIDAD)
  // No-store, sin registro de términos en DB ni logs
  // ==========================================

  // Búsqueda Individual
  app.post('/api/search', async (c) => {
    c.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    c.header('Pragma', 'no-cache');
    c.header('Expires', '0');

    try {
      const body = await c.req.json();
      const client = getDbClient(c.env || bindings);
      const result = await searchIndividual(client, {
        query: body.query,
        rfc: body.rfc,
        code: body.code,
        filters: body.filters,
        page: body.page || 1,
        pageSize: body.pageSize || 25,
      });

      return c.json(result);
    } catch (error: any) {
      return c.json({ error: 'Error al consultar contratos' }, 500);
    }
  });

  // Búsqueda Masiva
  app.post('/api/search/bulk', async (c) => {
    c.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    c.header('Pragma', 'no-cache');
    c.header('Expires', '0');

    try {
      const body = await c.req.json();
      const items = Array.isArray(body.items) ? body.items.slice(0, 100) : [];
      const limitPerTerm = Math.min(50, Math.max(5, body.limitPerTerm || 20));

      const client = getDbClient(c.env || bindings);
      const result = await searchBulk(client, items, limitPerTerm);

      return c.json(result);
    } catch (error: any) {
      return c.json({ error: 'Error en búsqueda masiva' }, 500);
    }
  });

  // Detalle completo del contrato (73 columnas)
  app.post('/api/contract/detail', async (c) => {
    c.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    try {
      const body = await c.req.json();
      if (!body.id) {
        return c.json({ error: 'Identificador de contrato requerido' }, 400);
      }

      const client = getDbClient(c.env || bindings);
      const contrato = await getContratoFull(client, body.id);

      if (!contrato) {
        return c.json({ error: 'Contrato no encontrado' }, 404);
      }

      return c.json(contrato);
    } catch (error: any) {
      return c.json({ error: 'Error al obtener ficha de contrato' }, 500);
    }
  });

  // Estadísticas globales públicas
  app.get('/api/stats', async (c) => {
    c.header('Cache-Control', 'public, max-age=60'); // 1 minuto de caché para estadísticas generales agregadas
    try {
      const client = getDbClient(c.env || bindings);
      const stats = await getGlobalStats(client);
      return c.json(stats);
    } catch (error: any) {
      return c.json({ error: 'Error al consultar estadísticas', details: error.message }, 500);
    }
  });

  // ==========================================
  // RUTAS ADMINISTRATIVAS
  // ==========================================

  // Inicio de sesión administrativo
  app.post('/api/admin/login', async (c) => {
    try {
      const body = await c.req.json();
      const enteredPass = String(body.password || '').trim();
      const adminPass = getEnvVar(c, 'ADMIN_PASSWORD');
      const secret = getEnvVar(c, 'ADMIN_SESSION_SECRET');
      if (!adminPass || !secret || secret.length < 32) return c.json({ error: 'Configure ADMIN_PASSWORD y ADMIN_SESSION_SECRET antes de iniciar sesión' }, 503);

      if (!enteredPass || enteredPass !== adminPass) {
        return c.json({ error: 'Contraseña de administrador incorrecta.' }, 401);
      }

      const token = await createSessionToken(secret, 'admin');

      // Establecer cookie HttpOnly
      c.header('Cache-Control', 'no-store');
      c.header('Set-Cookie', `admin_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`);
      return c.json({ success: true, token, message: 'Sesión administrativa iniciada correctamente.' });
    } catch (error: any) {
      return c.json({ error: 'Error al iniciar sesión' }, 500);
    }
  });

  // Cierre de sesión administrativo
  app.post('/api/admin/logout', async (c) => {
    c.header('Set-Cookie', `admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
    return c.json({ success: true });
  });

  // Estado del sistema y consumo
  app.get('/api/admin/status', requireAdmin, async (c) => {
    try {
      const client = getDbClient(c.env || bindings);
      const isRemote = isUsingTursoRemote(c.env || bindings);
      const status = await getAdminStatus(client);

      return c.json({
        ...status,
        isRemoteTurso: isRemote,
        connectionType: isRemote ? 'Turso Cloud (Remoto)' : 'SQLite Local (Desarrollo)',
      });
    } catch (error: any) {
      return c.json({ error: 'Error al consultar estado', details: error.message }, 500);
    }
  });

  // Inicialización de tablas
  app.post('/api/admin/init-tables', requireAdmin, async (c) => {
    try {
      const client = getDbClient(c.env || bindings);
      const res = await initDatabaseTables(client);
      return c.json(res);
    } catch (error: any) {
      return c.json({ error: 'Error al inicializar tablas', details: error.message }, 500);
    }
  });

  // Ingesta por fragmentos (chunked upload)
  app.post('/api/admin/import/chunk', requireAdmin, async (c) => {
    try {
      const body = await c.req.json();
      const {
        fileSha256,
        fileName,
        year,
        totalFileRows,
        fileSizeBytes,
        chunkIndex,
        isLastChunk,
        rows,
      } = body;

      if (!fileSha256 || !fileName || !year || !Array.isArray(rows)) {
        return c.json({ error: 'Parámetros de fragmento incompletos' }, 400);
      }

      const client = getDbClient(c.env || bindings);
      const result = await insertContratosBatch(
        client,
        fileSha256,
        fileName,
        Number(year),
        Number(totalFileRows || 0),
        Number(fileSizeBytes || 0),
        Number(chunkIndex || 0),
        Boolean(isLastChunk),
        rows
      );

      return c.json({
        success: result.errors === 0 && (!isLastChunk || result.completed),
        completed: result.completed,
        chunkIndex,
        inserted: result.inserted,
        errors: result.errors,
      });
    } catch (error: any) {
      return c.json({ error: 'Error al procesar fragmento' }, 500);
    }
  });

  // Eliminar archivo importado para reemplazo de versión
  app.post('/api/admin/delete-file', requireAdmin, async (c) => {
    try {
      const body = await c.req.json();
      if (!body.sha256) {
        return c.json({ error: 'SHA256 del archivo requerido' }, 400);
      }

      const client = getDbClient(c.env || bindings);
      await deleteImportedFile(client, body.sha256);

      return c.json({ success: true, message: 'Archivo y contratos asociados eliminados.' });
    } catch (error: any) {
      return c.json({ error: 'Error al eliminar archivo', details: error.message }, 500);
    }
  });

  return app;
}

export const app = createApiApp();
export default app;
