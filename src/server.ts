import 'dotenv/config';
import app from './app.js';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { initWebSocketServer } from './sockets/socketServer.js';
import { fileURLToPath } from 'url';

const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, '../certs/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../certs/cert.pem')),
};

const server = https.createServer(sslOptions, app);

initWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`Server running on https://localhost:${PORT}`);
});
