import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import healthHandler from './api/health.js';
import hdbTransactionsHandler from './api/hdb-transactions.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Mount root-level /api/ serverless handlers
  app.all('/api/health', (req, res) => {
    return healthHandler(req, res);
  });

  app.all('/api/hdb-transactions', (req, res) => {
    return hdbTransactionsHandler(req, res);
  });

  // Alias for convenience
  app.all('/api/transactions', (req, res) => {
    return hdbTransactionsHandler(req, res);
  });

  if (!isProduction) {
    // Mount Vite middleware in development mode
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SquareVal HDB Server running at http://0.0.0.0:${PORT}`);
    console.log(`- Health Check: http://0.0.0.0:${PORT}/api/health`);
    console.log(`- Live Transactions: http://0.0.0.0:${PORT}/api/hdb-transactions`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
