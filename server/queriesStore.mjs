import fs from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data');
const QUERIES_FILE = path.join(DATA_DIR, 'queries.json');

const DEFAULT_QUERIES = [
  {
    id: '00000000-0000-4000-8000-000000000001',
    name: 'Get Emails From Salesforce ID',
    target: 'sqllab',
    hasValuesPlaceholder: true,
    notes: '',
    sql: `WITH account_list AS (
    SELECT id_account, row_num
    FROM (
        VALUES 
            {{VALUES_PLACEHOLDER}}
    ) AS t(id_account, row_num)
)
SELECT 
    al.id_account AS salesforce_account_id,
    a.id_airbnb_user AS user_id,
    p.dim_email AS email,
    p.dim_account_name AS salesforce_account_name,
    p.dim_parent_account_name AS parent_account_name
FROM account_list al
LEFT JOIN itx."dim_salesforce_nimbus_accounts_pii$latest" p 
    ON al.id_account = p.id_account
LEFT JOIN itx."dim_salesforce_nimbus_accounts$latest" a
    ON al.id_account = a.id_account
ORDER BY al.row_num`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readQueries() {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(QUERIES_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return DEFAULT_QUERIES;
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') {
      await writeQueries(DEFAULT_QUERIES);
      return DEFAULT_QUERIES;
    }
    throw err;
  }
}

export async function writeQueries(queries) {
  await ensureDataDir();
  const tmp = `${QUERIES_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(queries, null, 2), 'utf8');
  await fs.rename(tmp, QUERIES_FILE);
}

export function queriesApiMiddleware() {
  return async (req, res, next) => {
    if (!req.url?.startsWith('/api/queries')) {
      next();
      return;
    }

    try {
      if (req.method === 'GET') {
        const queries = await readQueries();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(queries));
        return;
      }

      if (req.method === 'PUT') {
        const body = await readRequestBody(req);
        const queries = JSON.parse(body);
        if (!Array.isArray(queries)) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Expected an array of queries' }));
          return;
        }
        await writeQueries(queries);
        res.statusCode = 204;
        res.end();
        return;
      }

      res.statusCode = 405;
      res.end(JSON.stringify({ error: 'Method not allowed' }));
    } catch (err) {
      console.error('[queries-api]', err);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Failed to read or write queries file' }));
    }
  };
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
