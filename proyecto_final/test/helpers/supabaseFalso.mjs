// Base de datos en memoria que reproduce las reglas de auth_roles.sql:
//  - placa única en vehiculos
//  - solo el admin escribe en tiendas, vehiculos e historial_rutas (RLS)
//  - el trabajador solo lee, y de historial_rutas únicamente la ruta publicada
export const estado = { rol: 'admin', tablas: { tiendas: [], vehiculos: [], historial_rutas: [] }, contador: 0 };

export function reiniciar(rol = 'admin') {
    estado.rol = rol;
    estado.contador = 0;
    estado.tablas = { tiendas: [], vehiculos: [], historial_rutas: [] };
}

const errRLS = { message: 'new row violates row-level security policy' };

function constructor(tabla) {
    const q = { op: 'select', filtros: [], datos: null, orden: null };
    const api = {
        select() { return api; },
        order(campo, { ascending = true } = {}) { q.orden = { campo, ascending }; return api; },
        insert(d) { q.op = 'insert'; q.datos = d; return api; },
        update(d) { q.op = 'update'; q.datos = d; return api; },
        delete() { q.op = 'delete'; return api; },
        eq(c, v) { q.filtros.push(x => x[c] === v); return api; },
        in(c, vs) { q.filtros.push(x => vs.includes(x[c])); return api; },
        limit() { return api; },
        then(resolver, rechazar) { return Promise.resolve(ejecutar(tabla, q)).then(resolver, rechazar); }
    };
    return api;
}

function ejecutar(tabla, q) {
    const filas = estado.tablas[tabla];
    const escribe = q.op !== 'select';
    if (escribe && estado.rol !== 'admin') return { data: null, error: errRLS };

    if (q.op === 'select') {
        let r = filas.filter(f => q.filtros.every(fn => fn(f)));
        if (estado.rol !== 'admin' && tabla === 'historial_rutas') r = r.filter(f => f.publicada === true);
        if (q.orden) r = [...r].sort((a, b) => (a[q.orden.campo] > b[q.orden.campo] ? 1 : -1) * (q.orden.ascending ? 1 : -1));
        return { data: r, error: null };
    }
    if (q.op === 'insert') {
        const nuevas = [];
        for (const d of q.datos) {
            if (tabla === 'vehiculos' && filas.some(f => f.placa === d.placa)) {
                return { data: null, error: { message: 'duplicate key value violates unique constraint "vehiculos_placa_key"' } };
            }
            const fila = { id: `id-${++estado.contador}`, created_at: new Date(2026, 10, 6, 12, 0, estado.contador).toISOString(), ...d };
            if (tabla === 'tiendas' && !fila.estado) fila.estado = 'activo';
            if (tabla === 'vehiculos' && !fila.estado) fila.estado = 'Activo';
            filas.push(fila); nuevas.push(fila);
        }
        return { data: nuevas, error: null };
    }
    const objetivo = filas.filter(f => q.filtros.every(fn => fn(f)));
    if (q.op === 'update') { objetivo.forEach(f => Object.assign(f, q.datos)); return { data: objetivo, error: null }; }
    if (q.op === 'delete') { estado.tablas[tabla] = filas.filter(f => !objetivo.includes(f)); return { data: null, error: null }; }
}

export function createClient() { return { from: constructor }; }
