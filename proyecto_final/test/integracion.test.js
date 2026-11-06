// PRUEBAS DE INTEGRACIÓN — módulos reales (modelos, utilidades de ruta y comparación) sobre una BD simulada
// que reproduce las reglas de auth_roles.sql (placa única y RLS por rol).
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { reiniciar, estado } from './helpers/supabaseFalso.mjs';
import { TiendaModel } from '../models/tiendaModel.js';
import { VehiculoModel } from '../models/vehiculoModel.js';
import { validarSeleccionTiendas, validarCoordenadas } from '../utils/validaciones.js';
import { matrizRecta, resolverTSP, longitudCircuito } from '../utils/tsp.js';
import { filtrarTiendas } from '../utils/busqueda.js';
import { reduccionMedia } from '../utils/comparacion.js';

const BODEGA = { lat: 7.929125, lng: -72.494002 };
const tienda = (n, lat, lng, extra = {}) => ({ nombre_comercial: n, direccion: `Calle ${n}`, barrio: 'Centro', propietario: 'Dueño', telefono: '3001234567', latitud: lat, longitud: lng, ...extra });

beforeEach(() => reiniciar('admin'));

// Los modelos lanzan directamente el objeto de error de Supabase ({ message }), por eso se compara su mensaje.
const rechaza = (fn, patron) => assert.rejects(fn, e => patron.test(e.message));

describe('CI-01 Modelo de tiendas ↔ BD', () => {
    it('flujo correcto: crear, editar, inactivar y eliminar una tienda', async () => {
        const t = await TiendaModel.crear(tienda('La Esperanza', 7.9, -72.5));
        assert.equal(t.estado, 'activo');
        assert.equal((await TiendaModel.actualizar(t.id, { telefono: '3109998877' })).telefono, '3109998877');
        assert.equal((await TiendaModel.cambiarEstado(t.id, 'inactivo')).estado, 'inactivo');
        await TiendaModel.eliminar(t.id);
        assert.equal((await TiendaModel.obtenerTodas()).length, 0);
    });
    it('error controlado: el trabajador no puede crear tiendas (RLS)', async () => {
        reiniciar('trabajador');
        await rechaza(() => TiendaModel.crear(tienda('X', 7.9, -72.5)), /row-level security/);
    });
});

describe('CI-02 Modelo de vehículos ↔ BD', () => {
    it('flujo correcto: registrar y cambiar estado a En Mantenimiento', async () => {
        const v = await VehiculoModel.crear({ placa: 'ABC-123', modelo: 'Kangoo', tipo: 'Vehículo de carga liviana' });
        assert.equal(v.estado, 'Activo');
        assert.equal((await VehiculoModel.cambiarEstado(v.id, 'En Mantenimiento')).estado, 'En Mantenimiento');
    });
    it('datos inválidos: placa duplicada es rechazada por la BD', async () => {
        await VehiculoModel.crear({ placa: 'ABC-123', modelo: 'Kangoo', tipo: 'Liviano' });
        await rechaza(() => VehiculoModel.crear({ placa: 'ABC-123', modelo: 'Otro', tipo: 'Liviano' }), /duplicate key/);
    });
    it('error controlado: el trabajador no puede eliminar vehículos (RLS)', async () => {
        const v = await VehiculoModel.crear({ placa: 'XYZ-987', modelo: 'Hilux', tipo: 'Liviano' });
        reiniciar('trabajador');
        await rechaza(() => VehiculoModel.eliminar(v.id), /row-level security/);
    });
});

describe('CI-03 Planificar → motor TSP', () => {
    async function sembrar() {
        const datos = [[7.95, -72.45], [7.90, -72.52], [7.96, -72.44], [7.91, -72.51], [7.93, -72.49]];
        for (const [i, [la, lo]] of datos.entries()) await TiendaModel.crear(tienda(`T${i + 1}`, la, lo));
        await TiendaModel.crear(tienda('Cerrada', 7.92, -72.5, { estado: 'inactivo' }));
    }
    it('flujo correcto: solo tiendas activas, ruta visita todas y es más corta que el orden de selección', async () => {
        await sembrar();
        const activas = (await TiendaModel.obtenerTodas()).filter(t => t.estado === 'activo');
        assert.equal(activas.length, 5);
        const ids = activas.map(t => t.id);
        assert.ok(validarSeleccionTiendas(ids));
        const puntos = [BODEGA, ...activas.map(t => ({ lat: t.latitud, lng: t.longitud }))];
        const d = matrizRecta(puntos);
        const orden = resolverTSP(d);
        assert.deepEqual([...orden].sort((a, b) => a - b), [1, 2, 3, 4, 5]);
        assert.ok(longitudCircuito(d, orden) <= longitudCircuito(d, [1, 2, 3, 4, 5]));
    });
    it('error controlado: con una sola tienda seleccionada no se genera ruta', async () => {
        await sembrar();
        const una = [(await TiendaModel.obtenerTodas())[0].id];
        assert.equal(validarSeleccionTiendas(una), false);
    });
    it('datos inválidos: una tienda sin coordenadas se detecta antes de calcular', async () => {
        await TiendaModel.crear(tienda('Sin ubicación', NaN, NaN));
        const [t] = await TiendaModel.obtenerTodas();
        assert.equal(validarCoordenadas(t.latitud, t.longitud), false);
    });
});

describe('CI-04 Buscador ↔ listado de tiendas', () => {
    it('flujo correcto: filtra lo que devuelve la BD', async () => {
        await TiendaModel.crear(tienda('La Esperanza', 7.9, -72.5, { barrio: 'Atalaya' }));
        await TiendaModel.crear(tienda('El Sol', 7.91, -72.51, { barrio: 'Libertad' }));
        const lista = await TiendaModel.obtenerTodas();
        assert.deepEqual(filtrarTiendas(lista, 'atalaya').map(t => t.nombre_comercial), ['La Esperanza']);
    });
});

describe('CI-05 Historial de rutas ↔ comparación', () => {
    async function guardar(rol, fila) {
        reiniciar(rol);
        const { createClient } = await import('./helpers/supabaseFalso.mjs');
        return createClient().from('historial_rutas').insert([fila]).select();
    }
    it('flujo correcto: el admin guarda una ruta y la reducción media se calcula', async () => {
        const { error } = await guardar('admin', { distancia_plataforma: 20, distancia_manual: 25, publicada: true });
        assert.equal(error, null);
        assert.equal(reduccionMedia(estado.tablas.historial_rutas), 20);
    });
    it('error controlado: el trabajador no puede guardar rutas (RLS)', async () => {
        const { error } = await guardar('trabajador', { distancia_plataforma: 20, publicada: true });
        assert.match(error.message, /row-level security/);
    });
    it('flujo correcto: el trabajador solo ve la ruta publicada', async () => {
        estado.tablas.historial_rutas.push({ id: 'r1', publicada: false, distancia_plataforma: 10 }, { id: 'r2', publicada: true, distancia_plataforma: 12 });
        estado.rol = 'trabajador';
        const { createClient } = await import('./helpers/supabaseFalso.mjs');
        const { data } = await createClient().from('historial_rutas').select('*');
        assert.deepEqual(data.map(r => r.id), ['r2']);
    });
});
