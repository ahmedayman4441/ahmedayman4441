import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3002;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'shared-data.json');
const REMOTE_DATA_API_URL = process.env.REMOTE_DATA_API_URL;

app.use(express.json({ limit: '10mb' }));

const ensureDataFile = () => {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({
      products: [],
      sales: [],
      customers: [],
      refunds: [],
      companySettings: null,
      backups: [],
      updatedAt: new Date().toISOString()
    }, null, 2));
  }
};

const readData = () => {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
};

const writeData = (payload) => {
  ensureDataFile();
  const normalizedPayload = {
    ...payload,
    updatedAt: payload.updatedAt || new Date().toISOString()
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(normalizedPayload, null, 2));
  return normalizedPayload;
};

const readRemoteData = async () => {
  if (!REMOTE_DATA_API_URL) return null;
  const response = await fetch(REMOTE_DATA_API_URL);
  if (!response.ok) throw new Error(`Remote data GET failed with ${response.status}`);
  return response.json();
};

const writeRemoteData = async (payload) => {
  if (!REMOTE_DATA_API_URL) return null;
  const response = await fetch(REMOTE_DATA_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`Remote data POST failed with ${response.status}`);
  return response.json();
};

app.get('/api/data', (req, res) => {
  const sendData = async () => {
    try {
      res.json((await readRemoteData()) || readData());
    } catch (error) {
      console.error('Failed to read remote shared data, using local fallback', error);
      res.json(readData());
    }
  };
  void sendData().catch(error => {
    console.error('Failed to read shared data', error);
    res.status(500).json({ error: 'Failed to read shared data' });
  });
});

app.post('/api/data', (req, res) => {
  const saveData = async () => {
    try {
      const payload = req.body || {};
      const storedPayload = (await writeRemoteData(payload)) || writeData(payload);
      res.json(storedPayload);
    } catch (error) {
      console.error('Failed to write remote shared data', error);
      res.status(502).json({ error: 'Failed to write shared data to Vercel' });
    }
  };
  void saveData().catch(error => {
    console.error('Failed to write shared data', error);
    res.status(500).json({ error: 'Failed to write shared data' });
  });
});

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Shared server listening on port ${PORT}`);
});
