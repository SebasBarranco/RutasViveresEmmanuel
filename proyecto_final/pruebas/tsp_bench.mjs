// Prueba de esfuerzo del motor TSP: tiempo de cálculo según el número de paradas.
// Este es el único punto de la plataforma que consume CPU del navegador del usuario.
import { matrizRecta, longitudCircuito, resolverTSP } from '../utils/tsp.js';
import fs from 'node:fs';

function puntos(n, semilla) {
  let s = semilla;
  const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  // bodega + n tiendas dentro de una caja ~ 12 km x 12 km sobre Cúcuta
  return Array.from({ length: n + 1 }, () => ({ lat: 7.85 + rnd() * 0.11, lng: -72.56 + rnd() * 0.11 }));
}
const mediana = a => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const filas = [];
for (const n of [5, 8, 10, 12, 13, 20, 45, 100, 200, 500, 1000]) {
  const tiempos = [];
  let km = 0;
  const reps = n <= 12 ? 5 : 3;
  for (let r = 0; r < reps; r++) {
    const d = matrizRecta(puntos(n, 7 + r));
    const t0 = performance.now();
    const orden = resolverTSP(d);
    tiempos.push(performance.now() - t0);
    km = longitudCircuito(d, orden);
  }
  const memMB = process.memoryUsage().heapUsed / 1048576;
  filas.push({ paradas: n, metodo: n <= 12 ? 'Exacto (Held-Karp)' : 'Heurístico (vecino más cercano + 2-opt)', medianaMs: +mediana(tiempos).toFixed(1), kmRuta: +km.toFixed(2), heapMB: +memMB.toFixed(0) });
  console.error(`${n} paradas: ${mediana(tiempos).toFixed(1)} ms`);
}
fs.writeFileSync(new URL('./resultado_tsp.json', import.meta.url), JSON.stringify(filas, null, 1));
