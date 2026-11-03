import { createApiApp, EnvBindings } from '../server/apiRouter.js';

export default {
  async fetch(request: Request, env: EnvBindings, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // Si es una ruta de API, manejar con Hono
    if (url.pathname.startsWith('/api')) {
      const app = createApiApp(env);
      return app.fetch(request, env, ctx);
    }

    // El Worker atiende la API; los assets del sitio se sirven mediante ASSETS.
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response('Not Found', { status: 404 });
  },
};
