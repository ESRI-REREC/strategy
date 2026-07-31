import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REFERER = 'http://localhost:3000';

function parseKeyValues(path) {
  const out = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    out[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return out;
}

const creds = parseKeyValues(resolve(__dirname, '../../credentials.txt'));
const env = parseKeyValues(resolve(__dirname, '../.env.local'));
const PROJECTS_URL = env.PROJECTS_URL;
const adminLayer = PROJECTS_URL.replace('/rest/services/', '/rest/admin/services/');
const adminService = adminLayer.replace(/\/\d+$/, '');

async function postForm(url, params) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: REFERER },
    body: new URLSearchParams(params).toString(),
  });
  return res.json();
}

const tok = await postForm(`${creds.PORTAL}/sharing/rest/generateToken`, {
  username: creds.USERNAME, password: creds.PASSWORD, client: 'referer', referer: REFERER, expiration: '60', f: 'json',
});
const token = tok.token;

async function getJson(url) {
  const res = await fetch(`${url}?f=json&token=${encodeURIComponent(token)}`, { headers: { Referer: REFERER } });
  return res.json();
}

const svc = await getJson(adminService);
console.log('--- SERVICE LEVEL ---');
console.log('hasStaticData:', svc.hasStaticData);
console.log('sourceSchemaChangesAllowed:', svc.sourceSchemaChangesAllowed);
console.log('capabilities:', svc.capabilities);
console.log('supportsAppend:', svc.supportsAppend);

const lyr = await getJson(adminLayer);
console.log('\n--- LAYER LEVEL ---');
console.log('adminLayerInfo:', JSON.stringify(lyr.adminLayerInfo, null, 2));
