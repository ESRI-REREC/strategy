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
const base = env.PROJECTS_URL.split('/rest/services/')[0]; // https://.../arcgis

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

for (const name of ['Proposed_11KV_With_Project_Details', 'Land_Parcels_With_Project_Details']) {
  const svc = await getJson(`${base}/rest/services/${name}/FeatureServer`);
  console.log(`\n=== ${name} ===`);
  console.log('isView:', svc.isView);
  console.log('capabilities:', svc.capabilities);
  const lyr = await getJson(`${base}/rest/admin/services/${name}/FeatureServer/0`);
  console.log('viewLayerDefinition present:', !!lyr.adminLayerInfo?.viewLayerDefinition);
  console.log('field count:', (lyr.fields || []).length);
}
