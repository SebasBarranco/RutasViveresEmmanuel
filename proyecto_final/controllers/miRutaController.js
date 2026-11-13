import { escaparHtml } from '../utils/seguridad.js';
import { supabase } from '../config/supabase.js';

const $ = (id) => document.getElementById(id);
let rutaPublicada = null;

window.cargarMiRuta = async () => {
    const { data, error } = await supabase.from('historial_rutas').select('*')
        .eq('publicada', true).order('created_at', { ascending: false }).limit(1);
    if (error) { console.error(error); }
    const hay = !error && data && data.length > 0;
    $('miruta-vacio').classList.toggle('hidden', hay);
    $('miruta-contenido').classList.toggle('hidden', !hay);
    if (!hay) { rutaPublicada = null; return; }

    const r = data[0];
    rutaPublicada = r;
    const puntos = r.secuencia; // [bodega, p1..pn, bodega]
    $('miruta-fecha').textContent = `Fecha: ${r.fecha || new Date(r.created_at).toLocaleDateString()}`;
    $('miruta-km').textContent = `${Number(r.distancia_plataforma).toFixed(2)} km`;

    // Vehículo activo
    let vehiculo = '—';
    const { data: v } = await supabase.from('vehiculos').select('*').eq('estado', 'Activo').limit(1);
    if (v && v.length) vehiculo = `${v[0].placa} · ${v[0].modelo}`;
    $('miruta-vehiculo').textContent = `Vehículo: ${vehiculo}`;

    // Lista
    const ul = $('miruta-lista');
    ul.innerHTML = '';
    puntos.forEach((p, i) => {
        const esB = i === 0 || i === puntos.length - 1;
        const li = document.createElement('li');
        li.className = 'flex items-start py-2 border-b border-gray-100';
        li.innerHTML = `<span class="font-bold text-emerald-600 mr-3 w-6">${esB ? 'B' : i}.</span>
            <div><p class="font-medium text-gray-800">${escaparHtml(p.nombre)}</p><p class="text-xs text-gray-500">${esB ? (i === 0 ? 'Salida' : 'Regreso') : escaparHtml(p.direccion)}${p.barrio ? ' · ' + escaparHtml(p.barrio) : ''}</p></div>`;
        ul.appendChild(li);
    });

    // Mapa
    const cont = $('mapa-miruta');
    cont.innerHTML = '';
    const map = new google.maps.Map(cont, { center: { lat: puntos[0].lat, lng: puntos[0].lng }, zoom: 13 });
    const bounds = new google.maps.LatLngBounds();
    puntos.forEach((p, i) => {
        const esB = i === 0 || i === puntos.length - 1;
        bounds.extend({ lat: p.lat, lng: p.lng });
        new google.maps.Marker({
            position: { lat: p.lat, lng: p.lng }, map, title: p.nombre,
            label: { text: esB ? 'B' : String(i), color: 'white', fontWeight: 'bold' },
            icon: { path: google.maps.SymbolPath.CIRCLE, scale: 12, fillColor: esB ? 'black' : '#047857', fillOpacity: 1, strokeWeight: 2, strokeColor: 'white' }
        });
    });
    map.fitBounds(bounds);
    try {
        const { Route } = await google.maps.importLibrary("routes");
        const { routes } = await Route.computeRoutes({
            origin: { lat: puntos[0].lat, lng: puntos[0].lng },
            destination: { lat: puntos[0].lat, lng: puntos[0].lng },
            intermediates: puntos.slice(1, -1).map(p => ({ location: { lat: p.lat, lng: p.lng } })),
            travelMode: 'DRIVING', fields: ['path']
        });
        if (routes && routes.length) routes[0].createPolylines().forEach(pl => pl.setMap(map));
    } catch (e) {
        new google.maps.Polyline({ path: puntos.map(p => ({ lat: p.lat, lng: p.lng })), strokeColor: '#047857', strokeWeight: 4, map });
    }

    // Hoja de ruta para imprimir
    const filas = puntos.slice(1, -1).map((p, i) =>
        `<tr><td>${i + 1}</td><td>${escaparHtml(p.nombre)}</td><td>${escaparHtml(p.direccion)}</td><td>${escaparHtml(p.barrio)}</td></tr>`).join('');
    $('hoja-ruta').innerHTML = `
        <h1 style="font-size:22px;font-weight:bold">Hoja de ruta de despacho — Víveres Emmanuel</h1>
        <p style="margin-top:8px"><b>Fecha:</b> ${escaparHtml(r.fecha)} &nbsp; <b>Vehículo:</b> ${escaparHtml(vehiculo)}</p>
        <p><b>Salida y regreso:</b> ${puntos[0].nombre} &nbsp; <b>Paradas:</b> ${puntos.length - 2} &nbsp; <b>Distancia total:</b> ${Number(r.distancia_plataforma).toFixed(2)} km</p>
        <table><thead><tr><th>#</th><th>Tienda</th><th>Dirección</th><th>Barrio</th></tr></thead><tbody>${filas}</tbody></table>`;
};

$('btn-imprimir-miruta').addEventListener('click', () => { if (rutaPublicada) window.print(); });
