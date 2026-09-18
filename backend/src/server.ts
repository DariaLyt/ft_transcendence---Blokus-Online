import 'dotenv/config';
import app from './app.js';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { initWebSocketServer, wss } from './sockets/socketServer.js';
import { fileURLToPath } from 'url';
import { runMigrations } from './db/migrate.js';
import { pool } from './db/conn.js';

const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, '../certs/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../certs/cert.pem')),
};

async function startServer() {
	try {
		await runMigrations();

		const server = https.createServer(sslOptions, app);
		initWebSocketServer(server);

		server.listen(PORT, () => {
			console.log(`Server running on https://localhost:${PORT}`);
		});

		const handleShutdown = (signal: string) => {
            console.log(`\n[${signal}] Received. Starting graceful shutdown...`);

            if (wss) {
                wss.clients.forEach((client) => {
                    client.close(1001, 'Server shutting down');
                });
                console.log('[Shutdown] Closed active WebSocket connections.');
            }

            server.close(() => {
                console.log('[Shutdown] HTTPS server stopped.');

                pool.end().then(() => {
                    console.log('[Shutdown] Database pool closed. Process exiting.');
                    process.exit(0);
                }).catch((err) => {
                    console.error('[Shutdown] Error closing DB pool:', err);
                    process.exit(1);
                });
            });
        };

        process.on('SIGTERM', () => handleShutdown('SIGTERM'));
        process.on('SIGINT', () => handleShutdown('SIGINT'));
	} catch (error) {
		console.error('Failed to start server:', error);
		process.exit(1);
	}
}

startServer();
