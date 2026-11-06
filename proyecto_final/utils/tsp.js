// Lógica pura de optimización de rutas (sin DOM ni Google Maps) para poder probarla de forma unitaria.
export const MAX_EXACTO = 12; // hasta 12 paradas se resuelve de forma exacta (Held-Karp)

/** Distancia en línea recta (km) entre dos puntos {lat, lng}. */
export function haversine(a, b) {
    const R = 6371, rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLon = (b.lng - a.lng) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Matriz de distancias en línea recta (km) para una lista de puntos. */
export function matrizRecta(puntos) {
    return puntos.map(a => puntos.map(b => haversine(a, b)));
}

/** Longitud (km) del circuito 0 -> orden -> 0 sobre una matriz de distancias. */
export function longitudCircuito(d, orden) {
    const r = [0, ...orden, 0];
    let total = 0;
    for (let i = 0; i < r.length - 1; i++) total += d[r[i]][r[i + 1]];
    return total;
}

// ---------- Algoritmo TSP ----------
// Devuelve el orden de índices (sin incluir la bodega = 0) que minimiza la distancia del circuito.
export function resolverTSP(d) {
    const n = d.length - 1; // paradas
    if (n <= 1) return n === 1 ? [1] : [];
    return n <= MAX_EXACTO ? heldKarp(d, n) : heuristica(d, n);
}

function heldKarp(d, n) {
    const FULL = 1 << n;
    const dp = Array.from({ length: FULL }, () => new Float64Array(n).fill(Infinity));
    const padre = Array.from({ length: FULL }, () => new Int8Array(n).fill(-1));
    for (let j = 0; j < n; j++) dp[1 << j][j] = d[0][j + 1];
    for (let mask = 1; mask < FULL; mask++) {
        for (let j = 0; j < n; j++) {
            if (!(mask & (1 << j)) || dp[mask][j] === Infinity) continue;
            for (let k = 0; k < n; k++) {
                if (mask & (1 << k)) continue;
                const nm = mask | (1 << k), c = dp[mask][j] + d[j + 1][k + 1];
                if (c < dp[nm][k]) { dp[nm][k] = c; padre[nm][k] = j; }
            }
        }
    }
    let mejor = Infinity, fin = 0;
    for (let j = 0; j < n; j++) {
        const c = dp[FULL - 1][j] + d[j + 1][0];
        if (c < mejor) { mejor = c; fin = j; }
    }
    const orden = []; let mask = FULL - 1, j = fin;
    while (j !== -1) { orden.push(j + 1); const pj = padre[mask][j]; mask ^= (1 << j); j = pj; }
    return orden.reverse();
}

function heuristica(d, n) {
    // Vecino más cercano + mejora 2-opt
    const libres = new Set(Array.from({ length: n }, (_, i) => i + 1));
    let ruta = [], actual = 0;
    while (libres.size) {
        let mejor = null, md = Infinity;
        libres.forEach(i => { if (d[actual][i] < md) { md = d[actual][i]; mejor = i; } });
        ruta.push(mejor); libres.delete(mejor); actual = mejor;
    }
    const full = () => [0, ...ruta, 0];
    let mejoro = true;
    while (mejoro) {
        mejoro = false;
        const r = full();
        for (let i = 1; i < r.length - 2 && !mejoro; i++) {
            for (let k = i + 1; k < r.length - 1; k++) {
                const delta = d[r[i - 1]][r[k]] + d[r[i]][r[k + 1]] - d[r[i - 1]][r[i]] - d[r[k]][r[k + 1]];
                if (delta < -1e-9) {
                    ruta = [...r.slice(1, i), ...r.slice(i, k + 1).reverse(), ...r.slice(k + 1, -1)];
                    mejoro = true; break;
                }
            }
        }
    }
    return ruta;
}

