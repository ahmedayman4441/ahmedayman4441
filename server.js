import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3002;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'shared-data.json');

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

app.get('/api/data', (req, res) => {
  try {
    res.json(readData());
  } catch (error) {
    console.error('Failed to read shared data', error);
    res.status(500).json({ error: 'Failed to read shared data' });
  }
});

app.post('/api/data', (req, res) => {
  try {
    const payload = req.body || {};
    const storedPayload = writeData(payload);
    res.json(storedPayload);
  } catch (error) {
    console.error('Failed to write shared data', error);
    res.status(500).json({ error: 'Failed to write shared data' });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Shared server listening on port ${PORT}`);
});
