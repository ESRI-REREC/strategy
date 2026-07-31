// One-off admin script: adds `county` and `constituency` (String) fields to the
// Projects hosted feature layer.
//
// The Projects layer participates in two join views, which makes ArcGIS mark the
// source schema as locked (sourceSchemaChangesAllowed=false, read-only). Per the
// layer owner's instruction ("views are not used anywhere"), this script DELETES
// those views, then adds the fields. View definitions are backed up in
// scripts/views-backup.json beforehand in case they ever need rebuilding.
//
// Run from the `strategy` directory:  node scripts/add-project-fields.mjs

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
const PROJECTS_URL = env.PROJECTS_URL;
if (!USERNAME || !PASSWORD || !PORTAL) throw new Error('credentials.txt needs USERNAME, PASSWORD, PORTAL');
if (!PROJECTS_URL) throw new Error('.env.local needs PROJECTS_URL');

const adminBase = PROJECTS_URL.replace('/rest/services/', '/rest/admin/services/');

const FIELDS_TO_ADD = [
  { name: 'county', alias: 'County', type: 'esriFieldTypeString', length: 255, nullable: true, editable: true },
  { name: 'constituency', alias: 'Constituency', type: 'esriFieldTypeString', length: 255, nullable: true, editable: true },
];

// Views to delete (confirmed by owner as unused). Verified against item.url before deletion.
const VIEWS_TO_DELETE = [
  { id: '0e5ede1fb5594aa09ddab293272b8ecc', urlMarker: 'Proposed_11KV_With_Project_Details' },
  { id: '26f0215334b44d7cb45ce33740dd505e', urlMarker: 'Land_Parcels_With_Project_Details' },
];

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

let token;

async function main() {
  console.log('Generating admin token...');
  token = (await postForm(`${PORTAL}/sharing/rest/generateToken`, {
    username: USERNAME, password: PASSWORD, client: 'referer', referer: REFERER, expiration: '60', f: 'json',
  })).token;
  if (!token) throw new Error('No token returned');

  // Already done?
  const before = new Set(((await getJson(PROJECTS_URL)).fields || []).map((f) => f.name.toLowerCase()));
  if (FIELDS_TO_ADD.every((f) => before.has(f.name.toLowerCase()))) {
    console.log('Both fields already exist — nothing to do.');
    return;
  }

  // Delete the dependent views (verify each item URL first).
  for (const v of VIEWS_TO_DELETE) {
    const item = await getJson(`${PORTAL}/sharing/rest/content/items/${v.id}`);
    if (item.error) { console.log(`  View item ${v.id} not found (already deleted?) — skipping.`); continue; }
    if (!item.url || !item.url.includes(v.urlMarker)) {
      throw new Error(`Safety check failed: item ${v.id} url "${item.url}" does not match "${v.urlMarker}". Aborting.`);
    }
    console.log(`Deleting view "${item.title}" (${v.id}, owner ${item.owner})...`);
    await postForm(`${PORTAL}/sharing/rest/content/users/${item.owner}/items/${v.id}/delete`, { f: 'json', token });
  }

  // Confirm the source schema is now unlocked.
  const svc = await getJson(adminBase.replace(/\/\d+$/, ''));
  console.log('sourceSchemaChangesAllowed is now:', svc.sourceSchemaChangesAllowed);

  const toAdd = FIELDS_TO_ADD.filter((f) => !before.has(f.name.toLowerCase()));
  console.log(`Adding fields: ${toAdd.map((f) => f.name).join(', ')}`);
  const result = await postForm(`${adminBase}/addToDefinition`, {
    addToDefinition: JSON.stringify({ fields: toAdd }), f: 'json', token,
  });
  if (result.success === false) throw new Error('addToDefinition reported failure');

  const after = ((await getJson(PROJECTS_URL)).fields || []).map((f) => f.name);
  const added = after.filter((n) => ['county', 'constituency'].includes(n.toLowerCase()));
  console.log('Done. Projects layer now has:', added.join(', ') || '(none — check!)');
}

main().catch((err) => { console.error('ERROR:', err.message); process.exit(1); });
