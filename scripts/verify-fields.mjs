import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REFERER = 'http://localhost:3000';
function p(path) {
  const o = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const t = line.trim(); if (!t || t.startsWith('#')) continue;
    const e = t.indexOf('='); if (e === -1) continue;
    o[t.slice(0, e).trim()] = t.slice(e + 1).trim();
  }
  return o;
}
const creds = p(resolve(__dirname, '../../credentials.txt'));
const env = p(resolve(__dirname, '../.env.local'));
const pub = env.PROJECTS_URL;
const admin = pub.replace('/rest/services/', '/rest/admin/services/');

const tokRes = await fetch(`${creds.PORTAL}/sharing/rest/generateToken`, {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Referer: REFERER },
  body: new URLSearchParams({ username: creds.USERNAME, password: creds.PASSWORD, client: 'referer', referer: REFERER, expiration: '60', f: 'json' }).toString(),
});
const token = (await tokRes.json()).token;

async function getJson(url) {
  const res = await fetch(`${url}?f=json&token=${encodeURIComponent(token)}`, { headers: { Referer: REFERER } });
  return res.json();
}

for (const [label, url] of [['ADMIN layer', admin], ['PUBLIC layer', pub]]) {
  const d = await getJson(url);
  const names = (d.fields || []).map((f) => f.name);
  console.log(`${label}: ${names.length} fields | county/constituency ->`, names.filter((n) => /county|constituency/i.test(n)).join(', ') || 'NONE');
}
const svc = await getJson(admin.replace(/\/\d+$/, ''));
const lyr = await getJson(admin);
console.log('service.sourceSchemaChangesAllowed:', svc.sourceSchemaChangesAllowed);
console.log('layer.adminLayerInfo.layerViews:', JSON.stringify(lyr.adminLayerInfo?.layerViews));
