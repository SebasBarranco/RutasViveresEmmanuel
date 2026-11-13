import { escaparHtml } from '../utils/seguridad.js';
import { supabase } from '../config/supabase.js';
import { haversine, resolverTSP } from '../utils/tsp.js';

const BODEGA = { lat: 7.929125, lng: -72.494002, nombre: "Bodega Principal", direccion: "Origen / destino" };

let map;
let overlays = [];           // marcadores y polilíneas actuales
let rutaActual = null;       // [bodega, parada1, ..., paradaN, bodega]
let distanciaActualKm = 0;
let guardada = false;

// ---------- Utilidades de distancia ----------
// Matriz de distancias en km. Intenta usar distancias reales por calle (Routes API);
// si falla, usa línea recta.
async function matrizDistancias(puntos) {
    const n = puntos.length;
    try {
        const { RouteMatrix } = await google.maps.importLibrary("routes");
        const locs = puntos.map(p => ({ lat: p.lat, lng: p.lng }));
        const res = await RouteMatrix.computeRouteMatrix({
            origins: locs, destinations: locs, travelMode: 'DRIVING',
            fields: ['originIndex', 'destinationIndex', 'distanceMeters']
        });
        const m = Array.from({ length: n }, () => new Array(n).fill(0));
        res.matrix.rows.forEach((row, i) => row.items.forEach((it, j) => {
            m[i][j] = i === j ? 0 : (it.distanceMeters != null ? it.distanceMeters / 1000 : haversine(puntos[i], puntos[j]));
        }));
        return m;
    } catch (e) {
        console.warn("Matriz por calles no disponible, se usa línea recta:", e);
        return puntos.map(a => puntos.map(b => haversine(a, b)));
    }
}

// ---------- Flujo principal ----------
window.inicializarMapaRuta = async () => {
    const ids = JSON.parse(localStorage.getItem('ruta_tiendas_seleccionadas') || 'null');
    if (!ids || ids.length < 2) return;

    // Evita recalcular si ya está calculada para la misma selección
    const firma = ids.slice().sort().join(',') + '|' + (localStorage.getItem('ruta_fecha') || '');
    if (rutaActual && localStorage.getItem('ruta_firma') === firma) return;

    const { data: tiendas, error } = await supabase.from('tiendas').select('*').in('id', ids);
    if (error) { console.error(error); alert('No se pudieron cargar las tiendas.'); return; }

    const paradas = tiendas.map(t => ({
        lat: parseFloat(t.latitud), lng: parseFloat(t.longitud),
        nombre: t.nombre_comercial, direccion: t.direccion, barrio: t.barrio
    }));
    const puntos = [BODEGA, ...paradas];
    const d = await matrizDistancias(puntos);
    const orden = resolverTSP(d);

    rutaActual = [BODEGA, ...orden.map(i => puntos[i]), BODEGA];
    localStorage.setItem('ruta_firma', firma);
    guardada = false;
    restablecerBotonGuardar();
    await dibujarRuta();
};

// Dibuja mapa, calcula distancia por calles del orden actual, lista y hoja de ruta
async function dibujarRuta() {
    const cont = document.getElementById('mapa-ruta');
    cont.innerHTML = '';
    overlays = [];
    map = new google.maps.Map(cont, { center: BODEGA, zoom: 13 });

    let km = null, polylines = [];
    try {
        const { Route } = await google.maps.importLibrary("routes");
        const { routes } = await Route.computeRoutes({
            origin: { lat: rutaActual[0].lat, lng: rutaActual[0].lng },
            destination: { lat: BODEGA.lat, lng: BODEGA.lng },
            intermediates: rutaActual.slice(1, -1).map(p => ({ location: { lat: p.lat, lng: p.lng } })),
            travelMode: 'DRIVING',
            fields: ['distanceMeters', 'path']
        });
        if (routes && routes.length) {
            km = routes[0].distanceMeters / 1000;
            polylines = routes[0].createPolylines();
            polylines.forEach(pl => pl.setMap(map));
        }
    } catch (e) { console.error("Error con la Routes API:", e); }

    let etiqueta = '';
    if (km === null) { // respaldo: línea recta
        km = 0;
        for (let i = 0; i < rutaActual.length - 1; i++) km += haversine(rutaActual[i], rutaActual[i + 1]);
        new google.maps.Polyline({ path: rutaActual.map(p => ({ lat: p.lat, lng: p.lng })), strokeColor: '#047857', strokeWeight: 4, map });
        etiqueta = ' (línea recta)';
    }
    distanciaActualKm = km;
    document.getElementById('distancia-total').textContent = `${km.toFixed(2)} km${etiqueta}`;

    const bounds = new google.maps.LatLngBounds();
    rutaActual.forEach((p, i) => {
        const esBodega = i === 0 || i === rutaActual.length - 1;
        bounds.extend({ lat: p.lat, lng: p.lng });
        new google.maps.Marker({
            position: { lat: p.lat, lng: p.lng }, map, title: p.nombre,
            label: { text: esBodega ? 'B' : String(i), color: 'white', fontWeight: 'bold' },
            icon: { path: google.maps.SymbolPath.CIRCLE, scale: 12, fillColor: esBodega ? 'black' : '#047857', fillOpacity: 1, strokeWeight: 2, strokeColor: 'white' }
        });
    });
    map.fitBounds(bounds);

    dibujarLista();
    dibujarHoja();
}

// ---------- RF12: ajuste manual de la secuencia ----------
let ordenManual = null; // copia editable de las paradas

function dibujarLista() {
    ordenManual = rutaActual.slice(1, -1);
    document.getElementById('btn-recalcular').classList.add('hidden');
    renderLista();
}

function renderLista() {
    const lista = document.getElementById('lista-secuencia');
    lista.innerHTML = '';
    const fila = (txt, nombre, dir, botones = '') => {
        const li = document.createElement('li');
        li.className = 'flex items-start py-2 border-b border-gray-100';
        li.innerHTML = `<span class="font-bold text-emerald-600 mr-3 w-6">${txt}</span>
            <div class="flex-1"><p class="font-medium text-gray-800">${escaparHtml(nombre)}</p><p class="text-xs text-gray-500">${escaparHtml(dir)}</p></div>${botones}`;
        return li;
    };
    lista.appendChild(fila('B.', BODEGA.nombre, 'Salida'));
    ordenManual.forEach((p, i) => {
        const li = fila(`${i + 1}.`, p.nombre, p.direccion,
            `<div class="flex flex-col ml-2">
                <button class="subir text-gray-400 hover:text-emerald-700 leading-none" ${i === 0 ? 'disabled' : ''} title="Subir">▲</button>
                <button class="bajar text-gray-400 hover:text-emerald-700 leading-none" ${i === ordenManual.length - 1 ? 'disabled' : ''} title="Bajar">▼</button>
            </div>`);
        li.querySelector('.subir').addEventListener('click', () => mover(i, -1));
        li.querySelector('.bajar').addEventListener('click', () => mover(i, 1));
        lista.appendChild(li);
    });
    lista.appendChild(fila('B.', BODEGA.nombre, 'Regreso'));
}

function mover(i, delta) {
    const j = i + delta;
    [ordenManual[i], ordenManual[j]] = [ordenManual[j], ordenManual[i]];
    renderLista();
    document.getElementById('btn-recalcular').classList.remove('hidden');
}

document.getElementById('btn-recalcular').addEventListener('click', async () => {
    rutaActual = [BODEGA, ...ordenManual, BODEGA];
    guardada = false;
    restablecerBotonGuardar();
    await dibujarRuta();
});

// ---------- RF13: hoja de ruta de despacho ----------
async function dibujarHoja() {
    const hoja = document.getElementById('hoja-ruta');
    const fecha = localStorage.getItem('ruta_fecha') || new Date().toISOString().split('T')[0];
    let vehiculo = '—';
    try {
        const { data } = await supabase.from('vehiculos').select('*').eq('estado', 'Activo').limit(1);
        if (data && data.length) vehiculo = `${data[0].placa} · ${data[0].modelo} (${data[0].tipo})`;
    } catch (e) { /* sin vehículo */ }

    const filas = rutaActual.slice(1, -1).map((p, i) =>
        `<tr><td>${i + 1}</td><td>${escaparHtml(p.nombre)}</td><td>${escaparHtml(p.direccion)}</td><td>${escaparHtml(p.barrio)}</td></tr>`).join('');
    hoja.innerHTML = `
        <h1 style="font-size:22px;font-weight:bold">Hoja de ruta de despacho — Víveres Emmanuel</h1>
        <p style="margin-top:8px"><b>Fecha:</b> ${fecha} &nbsp; <b>Vehículo:</b> ${escaparHtml(vehiculo)}</p>
        <p><b>Salida y regreso:</b> ${BODEGA.nombre} &nbsp; <b>Paradas:</b> ${rutaActual.length - 2} &nbsp; <b>Distancia total:</b> ${distanciaActualKm.toFixed(2)} km</p>
        <table><thead><tr><th>#</th><th>Tienda</th><th>Dirección</th><th>Barrio</th></tr></thead><tbody>${filas}</tbody></table>`;
}

document.getElementById('btn-imprimir-ruta').addEventListener('click', () => {
    if (!rutaActual) return alert('Primero genera una ruta.');
    window.print();
});

// ---------- Guardar en historial ----------
function restablecerBotonGuardar() {
    const b = document.getElementById('btn-guardar-ruta');
    b.disabled = false;
    b.textContent = 'Guardar y enviar al trabajador';
    b.className = 'mb-2 w-full bg-emerald-700 text-white py-2 rounded-md hover:bg-emerald-800 font-medium transition-colors';
}

document.getElementById('btn-guardar-ruta').addEventListener('click', async (e) => {
    if (!rutaActual) return alert('Primero genera una ruta.');
    // Solo una ruta publicada a la vez: la última que envía el administrador
    await supabase.from('historial_rutas').update({ publicada: false }).eq('publicada', true);
    const { error } = await supabase.from('historial_rutas').insert([{
        distancia_plataforma: parseFloat(distanciaActualKm.toFixed(2)),
        secuencia: rutaActual,
        fecha: localStorage.getItem('ruta_fecha') || new Date().toISOString().split('T')[0],
        publicada: true
    }]);
    if (error) { console.error(error); return alert('❌ Error al guardar la ruta.'); }
    guardada = true;
    alert('✅ Ruta guardada y enviada al trabajador.');
    e.target.disabled = true;
    e.target.textContent = 'Ruta Guardada';
    e.target.className = 'mb-2 w-full bg-gray-400 text-white py-2 rounded-md font-medium';
});
