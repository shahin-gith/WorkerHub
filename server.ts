import fs from 'node:fs';
import path from 'node:path';
import express from 'express';

const PORT = 3000;

async function startPreviewServer() {
  const app = express();
  const distDir = path.resolve(process.cwd(), 'dist');

  if (fs.existsSync(path.join(distDir, 'index.html'))) {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WorkerHub offline-ready server listening on http://0.0.0.0:${PORT}`);
  });
}

startPreviewServer().catch((err) => {
  console.error('Failed to start WorkerHub server:', err);
  process.exit(1);
});
