import { supabase } from '../config/supabase.js';

const BODEGA = { lat: 7.929125, lng: -72.494002, nombre: "Bodega Principal" };
let map;
let rutaActualCalculada = null;

window.inicializarMapaRuta = async () => {
    const idsSeleccionados = JSON.parse(localStorage.getItem('ruta_tiendas_seleccionadas'));
    
    if (!idsSeleccionados || idsSeleccionados.length < 2) {
        console.log("No hay tiendas seleccionadas.");
        return;
    }

    const { data: tiendas, error } = await supabase.from('tiendas').select('*').in('id', idsSeleccionados);
    if (error) return console.error(error);

    // 1. El algoritmo TSP ordena las paradas (usa línea recta para calcular rápido)
    const rutaOrdenada = calcularRutaTSP(BODEGA, tiendas);
    
    // 2. Dibujar la ruta real por calles usando la nueva Routes API
    dibujarRutaPorCalles(rutaOrdenada);
};

// Función para calcular distancia recta (solo para el orden del TSP)
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Algoritmo TSP (Nearest Neighbor)
function calcularRutaTSP(inicio, paradas) {
    let noVisitadas = [...paradas];
    let ruta = [inicio];
    let actual = inicio;

    while (noVisitadas.length > 0) {
        let masCercanaIdx = 0;
        let distanciaMinima = Infinity;

        for (let i = 0; i < noVisitadas.length; i++) {
            const dist = calcularDistancia(actual.lat, actual.lng, noVisitadas[i].latitud, noVisitadas[i].longitud);
            if (dist < distanciaMinima) {
                distanciaMinima = dist;
                masCercanaIdx = i;
            }
        }

        const siguienteParada = noVisitadas.splice(masCercanaIdx, 1)[0];
        ruta.push({ 
            lat: parseFloat(siguienteParada.latitud), 
            lng: parseFloat(siguienteParada.longitud), 
            nombre: siguienteParada.nombre_comercial,
            direccion: siguienteParada.direccion
        });
        actual = { lat: parseFloat(siguienteParada.latitud), lng: parseFloat(siguienteParada.longitud) };
    }

    ruta.push(inicio); // Regreso a la bodega
    return ruta; 
}

async function dibujarRutaPorCalles(ruta) {
    // 1. Inicializar Mapa
    if (map) {
        map = null; 
        document.getElementById('mapa-ruta').innerHTML = '';
    }

    map = new google.maps.Map(document.getElementById('mapa-ruta'), {
        center: BODEGA,
        zoom: 13,
    });

    try {
        // 2. Importar la librería de rutas (Routes API)
        const { Route } = await google.maps.importLibrary("routes");

        // 3. Preparar los puntos (origen, destino, paradas intermedias)
        const origen = new google.maps.LatLng(ruta[0].lat, ruta[0].lng);
        const destino = new google.maps.LatLng(ruta[ruta.length - 1].lat, ruta[ruta.length - 1].lng);
        
        const waypoints = ruta.slice(1, -1).map(punto => ({
            location: new google.maps.LatLng(punto.lat, punto.lng)
        }));

        // 4. Crear la solicitud para la Routes API
        const request = {
            origin: origen,
            destination: destino,
            intermediates: waypoints,
            travelMode: 'DRIVING',
            fields: ['distanceMeters', 'path'], // Campos que necesitamos de la respuesta
        };

        // 5. Ejecutar el cálculo
        const { routes } = await Route.computeRoutes(request);

        if (routes && routes.length > 0) {
            const rutaCalculada = routes[0];
            
            // 6. Obtener la distancia real en km
            const distanciaKm = rutaCalculada.distanceMeters / 1000;
            document.getElementById('distancia-total').textContent = `${distanciaKm.toFixed(2)} km`;
            
            // Guardamos el resultado para el botón de guardar
            rutaActualCalculada = { ruta: ruta, distanciaTotal: distanciaKm };

            // 7. Dibujar la ruta en el mapa usando las polilíneas que devuelve la API
            const mapPolylines = rutaCalculada.createPolylines();
            mapPolylines.forEach((polyline) => polyline.setMap(map));

            // 8. Dibujar nuestros propios marcadores numerados
            dibujarMarcadores(ruta);
            dibujarLista(ruta);

        } else {
            alert('No se pudo calcular una ruta válida con la Routes API.');
            dibujarLineasRectas(ruta);
        }

    } catch (error) {
        console.error("Error con la Routes API:", error);
        alert('Error al calcular la ruta. Revisa la consola (F12).');
        // Respaldo por si falla
        dibujarLineasRectas(ruta);
    }
}

// Función de respaldo por si falla Google Maps (dibuja líneas rectas)
function dibujarLineasRectas(ruta) {
    let distanciaTotal = 0;
    for(let i=0; i<ruta.length-1; i++) {
        distanciaTotal += calcularDistancia(ruta[i].lat, ruta[i].lng, ruta[i+1].lat, ruta[i+1].lng);
    }
    document.getElementById('distancia-total').textContent = `${distanciaTotal.toFixed(2)} km (Línea recta)`;
    rutaActualCalculada = { ruta: ruta, distanciaTotal: distanciaTotal };
    
    dibujarMarcadores(ruta);
    dibujarLista(ruta);
    
    const path = ruta.map(p => ({ lat: p.lat, lng: p.lng }));
    new google.maps.Polyline({
        path: path, geodesic: true, strokeColor: '#047857', strokeOpacity: 0.8, strokeWeight: 4, map: map
    });
}

function dibujarMarcadores(ruta) {
    ruta.forEach((punto, index) => {
        let label = (index === 0 || index === ruta.length - 1) ? 'B' : index.toString();
        let color = (index === 0 || index === ruta.length - 1) ? 'black' : '#047857'; 
        
        new google.maps.Marker({
            position: { lat: punto.lat, lng: punto.lng },
            map: map,
            label: { text: label, color: 'white', fontWeight: 'bold' },
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: color,
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: 'white'
            },
            title: punto.nombre
        });
    });
}

function dibujarLista(ruta) {
    const lista = document.getElementById('lista-secuencia');
    lista.innerHTML = '';
    
    ruta.forEach((punto, index) => {
        const li = document.createElement('li');
        li.className = 'flex items-start py-2 border-b border-gray-100';
        li.innerHTML = `
            <span class="font-bold text-emerald-600 mr-3 w-6">${index === 0 || index === ruta.length - 1 ? 'B' : index}.</span>
            <div>
                <p class="font-medium text-gray-800">${punto.nombre}</p>
                <p class="text-xs text-gray-500">${punto.direccion || 'Punto de origen/destino'}</p>
            </div>
        `;
        lista.appendChild(li);
    });
}

// Lógica para Guardar la Ruta en la Base de Datos
document.getElementById('btn-guardar-ruta').addEventListener('click', async (e) => {
    if (!rutaActualCalculada) {
        alert("Primero genera una ruta.");
        return;
    }

    try {
        const nuevaRuta = {
            distancia_plataforma: parseFloat(rutaActualCalculada.distanciaTotal.toFixed(2)),
            secuencia: rutaActualCalculada.ruta
        };

        const { error } = await supabase.from('historial_rutas').insert([nuevaRuta]);
        
        if (error) throw error;
        
        alert('✅ Ruta guardada en el historial correctamente. Ve a la pestaña "Comparación".');
        e.target.disabled = true;
        e.target.textContent = 'Ruta Guardada';
        e.target.classList.replace('bg-emerald-700', 'bg-gray-400');
        e.target.classList.replace('hover:bg-emerald-800', 'hover:bg-gray-400');
        
    } catch (error) {
        console.error(error);
        alert('❌ Error al guardar la ruta.');
    }
});