import fs from 'node:fs/promises';
import path from 'node:path';

const DATA_KEY = 'smart-sales:data';

const getRedisConfig = () => ({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
});

const readBundledData = async () => {
  const filePath = path.join(process.cwd(), 'shared-data.json');
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
};

const redisCommand = async (command) => {
  const { url, token } = getRedisConfig();
  if (!url || !token) return null;

  const response = await fetch(`${url}/${command.map(encodeURIComponent).join('/')}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error(`Storage request failed with ${response.status}`);

  const result = await response.json();
  return result.result ?? null;
};

export default async function handler(request, response) {
  try {
    if (request.method === 'GET') {
      const stored = await redisCommand(['get', DATA_KEY]);
      return response.status(200).json(stored ? JSON.parse(stored) : await readBundledData());
    }

    if (request.method === 'POST') {
      const { url, token } = getRedisConfig();
      if (!url || !token) {
        return response.status(503).json({
          error: 'Persistent storage is not configured. Add KV_REST_API_URL and KV_REST_API_TOKEN in Vercel.'
        });
      }

      const payload = { ...request.body, updatedAt: new Date().toISOString() };
      await redisCommand(['set', DATA_KEY, JSON.stringify(payload)]);
      return response.status(200).json(payload);
    }

    response.setHeader('Allow', 'GET, POST');
    return response.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Failed to access shared data', error);
    return response.status(500).json({ error: 'Failed to access shared data' });
  }
}
