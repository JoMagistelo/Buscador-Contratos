import { createApiApp, EnvBindings } from '../server/apiRouter.js';

export default {
  async fetch(request: Request, env: EnvBindings, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // Si es una ruta de API, manejar con Hono
    if (url.pathname.startsWith('/api')) {
      const app = createApiApp(env);
      return app.fetch(request, env, ctx);
    }

    // Para Cloudflare Workers con Static Assets:
    // Las rutas estáticas las resuelve el runtime de Cloudflare Assets automáticamente.
    // En caso de que se invoque el worker para el fallback SPA:
    const app = createApiApp(env);
    return app.fetch(request, env, ctx);
  },
};
