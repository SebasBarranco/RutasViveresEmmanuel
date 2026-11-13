// Prueba de carga y estrés de la plataforma (frontend estático servido localmente).
// Uso: node pruebas/carga.mjs carga <usuarios> <segundos>
//      node pruebas/carga.mjs estres <u1,u2,u3,...> <segundos_por_escalon>
// Cada usuario virtual abre la aplicación como lo hace un navegador (index.html y sus 18 módulos JS)
// y espera un tiempo de lectura antes de repetir. Se mide tiempo de respuesta, errores y rendimiento.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };

function listar(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return ['test', 'pruebas', 'node_modules'].includes(e.name) ? [] : listar(p);
    return /\.(html|js)$/.test(e.name) ? [p] : [];
  });
}
const RECURSOS = listar(RAIZ).map(p => '/' + path.relative(RAIZ, p).split(path.sep).join('/'));
const CACHE = new Map(RECURSOS.map(r => [r, fs.readFileSync(path.join(RAIZ, r))]));

const servidor = http.createServer((req, res) => {
  const url = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const cuerpo = CACHE.get(url);
  if (!cuerpo) { res.writeHead(404); return res.end('no existe'); }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(url)] || 'text/plain', 'Content-Length': cuerpo.length });
  res.end(cuerpo);
});
await new Promise(r => servidor.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${servidor.address().port}`;

const pct = (a, p) => a.length ? a[Math.min(a.length - 1, Math.floor(a.length * p))] : 0;
const dormir = ms => new Promise(r => setTimeout(r, ms));

async function fase(usuarios, segundos, lecturaMs) {
  const fin = Date.now() + segundos * 1000;
  const lat = [], porSeg = new Map();
  let errores = 0, peticiones = 0, bytes = 0;
  const tipos = {};
  async function visita() {
    for (const r of RECURSOS) {
      const t0 = performance.now();
      try {
        const resp = await fetch(BASE + r, { signal: AbortSignal.timeout(10000) });
        const buf = await resp.arrayBuffer();
        const ms = performance.now() - t0;
        peticiones++; bytes += buf.byteLength;
        if (!resp.ok) { errores++; tipos['HTTP ' + resp.status] = (tipos['HTTP ' + resp.status] || 0) + 1; }
        else { lat.push(ms); }
        const s = Math.floor((Date.now() - (fin - segundos * 1000)) / 1000);
        porSeg.set(s, (porSeg.get(s) || 0) + 1);
      } catch (e) {
        peticiones++; errores++;
        const k = e.name === 'TimeoutError' ? 'tiempo agotado (10 s)' : (e.cause?.code || e.name);
        tipos[k] = (tipos[k] || 0) + 1;
      }
    }
  }
  const usuariosVirtuales = Array.from({ length: usuarios }, async (_, i) => {
    await dormir((i / usuarios) * Math.min(5000, segundos * 100)); // arranque escalonado
    while (Date.now() < fin) { await visita(); await dormir(lecturaMs); }
  });
  await Promise.all(usuariosVirtuales);
  lat.sort((a, b) => a - b);
  const prom = lat.reduce((s, x) => s + x, 0) / (lat.length || 1);
  return {
    usuarios, segundos, peticiones, errores, tasaError: +(100 * errores / (peticiones || 1)).toFixed(3),
    promedioMs: +prom.toFixed(2), p50: +pct(lat, 0.5).toFixed(2), p95: +pct(lat, 0.95).toFixed(2),
    p99: +pct(lat, 0.99).toFixed(2), maxMs: +(lat[lat.length - 1] || 0).toFixed(2),
    reqPorSeg: +(peticiones / segundos).toFixed(1), mbTransferidos: +(bytes / 1048576).toFixed(1),
    tiposError: tipos, serie: [...porSeg.entries()].sort((a, b) => a[0] - b[0]).map(e => e[1]),
  };
}

const [modo, a, b] = process.argv.slice(2);
const salida = { modo, recursosPorVisita: RECURSOS.length, bytesPorVisita: RECURSOS.reduce((s, r) => s + CACHE.get(r).length, 0), inicio: new Date().toISOString(), fases: [] };
if (modo === 'carga') {
  salida.fases.push(await fase(+a, +b, 1000));
} else {
  for (const u of a.split(',').map(Number)) {
    const f = await fase(u, +b, 200);
    salida.fases.push(f);
    console.error(`escalón ${u} usuarios: prom ${f.promedioMs} ms · p95 ${f.p95} ms · errores ${f.tasaError}%`);
    await dormir(3000); // recuperación entre escalones
  }
  // recuperación: con carga normal después del pico
  salida.recuperacion = await fase(20, 10, 1000);
}
salida.fin = new Date().toISOString();
fs.writeFileSync(process.argv[5] || 'resultado_' + modo + '.json', JSON.stringify(salida, null, 1));
console.error('listo');
servidor.close(); process.exit(0);
