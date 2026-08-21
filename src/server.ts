import 'dotenv/config';
import app from './app';
import https from 'https';
import fs from 'fs';
import path from 'path';

const PORT = process.env.PORT || 3000;

const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, '../certs/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../certs/cert.pem')),
};

const server = https.createServer(sslOptions, app);

server.listen(PORT, () => {
  console.log(`Server running on https://localhost:${PORT}`);
});
