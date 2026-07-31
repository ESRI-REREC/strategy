// One-off admin script: adds human-readable label (String) fields alongside the
// existing GUID (*_id) fields on the Projects and Facilities hosted layers, so the
// create-project form can persist both the id and the label. Idempotent — existing
// fields are skipped. Neither layer currently has views, so addToDefinition works
// directly.
//
// Run from the `strategy` directory:  node scripts/add-label-fields.mjs

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

const strField = (name, alias) => ({
  name,
  alias,
  type: 'esriFieldTypeString',
  length: 255,
  nullable: true,
  editable: true,
});

const TARGETS = [
  {
    label: 'Projects',
    url: env.PROJECTS_URL,
    fields: [
      strField('funding_agency', 'Funding Agency'),
      strField('funding_category', 'Funding Category'),
      strField('project_type', 'Project Type'),
      strField('project_cycle_status', 'Project Cycle Status'),
      strField('project_implementation_status', 'Project Implementation Status'),
      strField('project_initiator_category', 'Project Initiator Category'),
      strField('substation_name', 'Substation'),
      strField('vendor_name', 'Vendor'),
    ],
  },
  {
    label: 'Facilities',
    url: env.FACILITIES_URL,
    fields: [
      strField('facility_category', 'Facility Category'),
      strField('facility_type', 'Facility Type'),
      strField('program_type', 'Program Type'),
    ],
  },
];

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

async function getExistingFieldNames(url) {
  const res = await fetch(`${url}?f=json&token=${encodeURIComponent(token)}`, { headers: { Referer: REFERER } });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return new Set((data.fields || []).map((f) => f.name.toLowerCase()));
}

async function main() {
  console.log('Generating admin token...');
  token = (await postForm(`${PORTAL}/sharing/rest/generateToken`, {
    username: USERNAME, password: PASSWORD, client: 'referer', referer: REFERER, expiration: '60', f: 'json',
  })).token;
  if (!token) throw new Error('No token returned');

  for (const target of TARGETS) {
    if (!target.url) { console.log(`\n${target.label}: URL not configured — skipping.`); continue; }
    console.log(`\n=== ${target.label} ===`);
    const existing = await getExistingFieldNames(target.url);
    const toAdd = target.fields.filter((f) => !existing.has(f.name.toLowerCase()));
    if (toAdd.length === 0) { console.log('All label fields already present — nothing to do.'); continue; }
    console.log('Adding:', toAdd.map((f) => f.name).join(', '));
    const adminBase = target.url.replace('/rest/services/', '/rest/admin/services/');
    const result = await postForm(`${adminBase}/addToDefinition`, {
      addToDefinition: JSON.stringify({ fields: toAdd }), f: 'json', token,
    });
    if (result.success === false) throw new Error('addToDefinition reported failure');
    console.log('Requested. (service will restart to apply)');
  }
  console.log('\nDone requesting schema changes.');
}

main().catch((err) => { console.error('ERROR:', err.message); process.exit(1); });
