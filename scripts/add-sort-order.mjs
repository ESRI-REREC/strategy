// One-off admin script: adds an integer `sort_order` field to the
// Project_Implementation_Statuses layer (for drag-to-reorder) and backfills it
// sequentially from the current object-id order. Idempotent for the field add;
// only backfills records whose sort_order is null.
//
// Run from the `strategy` directory:  node scripts/add-sort-order.mjs

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
const URL_ = env.PROJECT_IMPLEMENTATION_STATUSES_URL;
let token;

async function postForm(url, params) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: REFERER },
    body: new URLSearchParams(params).toString(),
  });
  const data = await res.json();
  if (data.error) {
    const d = data.error.details?.length ? ' — ' + data.error.details.join('; ') : '';
    throw new Error(`${data.error.message || 'Request failed'}${d}`);
  }
  return data;
}
async function getJson(url) {
  const sep = url.includes('?') ? '&' : '?';
  const res = await fetch(`${url}${sep}f=json&token=${encodeURIComponent(token)}`, { headers: { Referer: REFERER } });
  return res.json();
}

async function main() {
  console.log('Generating admin token...');
  token = (await postForm(`${creds.PORTAL}/sharing/rest/generateToken`, {
    username: creds.USERNAME, password: creds.PASSWORD, client: 'referer', referer: REFERER, expiration: '60', f: 'json',
  })).token;
  if (!token) throw new Error('No token');

  const meta = await getJson(URL_);
  const has = (meta.fields || []).some((f) => f.name.toLowerCase() === 'sort_order');
  if (!has) {
    console.log('Adding sort_order field...');
    const admin = URL_.replace('/rest/services/', '/rest/admin/services/');
    await postForm(`${admin}/addToDefinition`, {
      addToDefinition: JSON.stringify({
        fields: [{ name: 'sort_order', alias: 'Sort Order', type: 'esriFieldTypeInteger', nullable: true, editable: true }],
      }),
      f: 'json', token,
    });
    // wait for the service to come back after the schema restart
    for (let i = 0; i < 12; i++) {
      const m = await getJson(URL_);
      if ((m.fields || []).some((f) => f.name.toLowerCase() === 'sort_order')) break;
      await new Promise((r) => setTimeout(r, 10000));
    }
    console.log('Field added.');
  } else {
    console.log('sort_order already exists.');
  }

  // Backfill records missing a sort_order, sequentially by objectid.
  const q = await getJson(`${URL_}/query?where=1%3D1&outFields=objectid,sort_order&returnGeometry=false`);
  const rows = (q.features || []).map((f) => f.attributes).sort((a, b) => a.objectid - b.objectid);
  const updates = rows
    .map((r, i) => ({ attributes: { objectid: r.objectid, sort_order: i + 1 }, current: r.sort_order }))
    .filter((u) => u.current === null || u.current === undefined)
    .map((u) => ({ attributes: u.attributes }));

  if (updates.length === 0) {
    console.log('All records already have sort_order — nothing to backfill.');
  } else {
    console.log(`Backfilling sort_order for ${updates.length} record(s)...`);
    const result = await postForm(`${URL_}/updateFeatures`, {
      features: JSON.stringify(updates), f: 'json', token,
    });
    const failed = (result.updateResults || []).filter((r) => !r.success).length;
    console.log(`Updated ${(result.updateResults || []).length - failed} record(s)${failed ? `, ${failed} failed` : ''}.`);
  }
  console.log('Done.');
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
