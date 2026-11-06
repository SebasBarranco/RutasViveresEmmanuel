/** Porcentaje de reducción de la ruta de la plataforma respecto a la manual; null si no hay dato manual válido. */
export function calcularReduccion(kmManual, kmPlataforma) {
    const m = Number(kmManual), p = Number(kmPlataforma);
    if (!Number.isFinite(m) || !Number.isFinite(p) || m <= 0 || p < 0) return null;
    return ((m - p) / m) * 100;
}

/** Reducción media de las jornadas que tienen km manual; 0 si ninguna lo tiene. */
export function reduccionMedia(rutas) {
    const valores = rutas
        .map(r => calcularReduccion(r.distancia_manual, r.distancia_plataforma))
        .filter(v => v !== null);
    return valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;
}
