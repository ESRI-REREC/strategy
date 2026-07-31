// One-off admin script (DESTRUCTIVE, irreversible):
//   1. Deletes ALL records from the Projects and Facilities hosted layers.
//   2. Drops every "*_id" GUID column from both (the lookup foreign keys), now that
//      readable label columns hold the same information.
//
// Explicitly requested by the layer owner. Neither layer has views, so
// deleteFromDefinition works directly.
//
// Run from the `strategy` directory:  node scripts/drop-id-fields-and-purge.mjs

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
const { USERNAME, PASSWORD, PORTAL } = creds;

let token;

async function postForm(url, params) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: REFERER },
    body: new URLSearchParams(params).toString(),
  });
  const data = await res.json();
  if (data.error) {
    const details = data.error.details?.length ? ' — ' + data.error.details.join('; ') : '';
    throw new Error(`${data.error.message || 'Request failed'}${details}`);
  }
  return data;
}

async function getJson(url) {
  const sep = url.includes('?') ? '&' : '?';
  const res = await fetch(`${url}${sep}f=json&token=${encodeURIComponent(token)}`, { headers: { Referer: REFERER } });
  return res.json();
}

// Only fields ending in _id, and never the OID / GlobalID system fields.
const isIdField = (f) =>
  /_id$/i.test(f.name) && f.type !== 'esriFieldTypeOID' && f.type !== 'esriFieldTypeGlobalID';

async function main() {
  console.log('Generating admin token...');
  token = (await postForm(`${PORTAL}/sharing/rest/generateToken`, {
    username: USERNAME, password: PASSWORD, client: 'referer', referer: REFERER, expiration: '60', f: 'json',
  })).token;
  if (!token) throw new Error('No token returned');

  for (const [label, url] of [['Projects', env.PROJECTS_URL], ['Facilities', env.FACILITIES_URL]]) {
    console.log(`\n=== ${label} ===`);

    // 1. Delete all records.
    const del = await postForm(`${url}/deleteFeatures`, { where: '1=1', f: 'json', token });
    console.log(`Deleted ${del.deleteResults?.length ?? 0} record(s).`);

    // 2. Drop the *_id columns.
    const meta = await getJson(url);
    const idFields = (meta.fields || []).filter(isIdField).map((f) => ({ name: f.name }));
    if (idFields.length === 0) {
      console.log('No _id columns to drop.');
      continue;
    }
    console.log('Dropping columns:', idFields.map((f) => f.name).join(', '));
    const adminBase = url.replace('/rest/services/', '/rest/admin/services/');
    const res = await postForm(`${adminBase}/deleteFromDefinition`, {
      deleteFromDefinition: JSON.stringify({ fields: idFields }), f: 'json', token,
    });
    if (res.success === false) throw new Error('deleteFromDefinition reported failure');
    console.log('Requested column drop. (service will restart to apply)');
  }
  console.log('\nDone.');
}

main().catch((err) => { console.error('ERROR:', err.message); process.exit(1); });
