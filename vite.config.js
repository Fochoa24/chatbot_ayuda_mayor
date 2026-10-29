import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { Readable } from 'node:stream';
import { defineConfig, loadEnv } from 'vite';

// En desarrollo, sirve /api/chat con el mismo código que la función de Vercel.
function localApi() {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res) => {
        const { handleChat } = await server.ssrLoadModule('/server/chatHandler.js');
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const request = new Request(`http://${req.headers.host}${req.originalUrl}`, {
          method: req.method,
          headers: req.headers,
          body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
        });
        const response = await handleChat(request);
        res.writeHead(response.status, Object.fromEntries(response.headers));
        if (response.body) Readable.fromWeb(response.body).pipe(res);
        else res.end();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // ANTHROPIC_API_KEY queda solo del lado del servidor (no lleva prefijo VITE_).
  const env = loadEnv(mode, process.cwd(), '');
  if (env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;

  return {
    plugins: [react(), tailwindcss(), localApi()],
  };
});
