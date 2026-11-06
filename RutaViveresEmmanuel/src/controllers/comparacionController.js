import { supabase } from '../config/supabase.js';

const tablaComparacion = document.getElementById('tabla-comparacion');

window.cargarComparacion = async () => {
    try {
        const { data: rutas, error } = await supabase.from('historial_rutas').select('*').order('created_at', { ascending: false });
        if (error) throw error;

        if (rutas.length === 0) {
            tablaComparacion.innerHTML = `<tr><td colspan="4" class="text-center py-6 text-gray-500">No hay rutas guardadas aún. Ve a "Ruta generada" y guarda una.</td></tr>`;
            document.getElementById('reduccion-media').textContent = '0%';
            return;
        }

        tablaComparacion.innerHTML = '';
        let sumaReduccion = 0;
        let rutasConManual = 0;

        rutas.forEach((ruta, index) => {
            const fecha = new Date(ruta.created_at).toLocaleDateString();
            const kmPlataforma = ruta.distancia_plataforma;
            const kmManual = ruta.distancia_manual;
            
            let reduccionHTML = '<span class="text-gray-400">-</span>';
            if (kmManual > 0) {
                const reduccion = ((kmManual - kmPlataforma) / kmManual) * 100;
                reduccionHTML = `<span class="text-emerald-600 font-bold">${reduccion.toFixed(1)}%</span>`;
                sumaReduccion += reduccion;
                rutasConManual++;
            }

            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-100 hover:bg-gray-50';
            tr.innerHTML = `
                <td class="py-4 text-gray-700">Jornada ${rutas.length - index} <br><span class="text-xs text-gray-400">${fecha}</span></td>
                <td class="py-4 text-emerald-700 font-bold text-lg">${kmPlataforma} km</td>
                <td class="py-4">
                    <input type="number" step="any" class="input-manual border border-gray-300 rounded-md px-3 py-1.5 w-28 focus:outline-none focus:border-emerald-600" data-id="${ruta.id}" value="${kmManual > 0 ? kmManual : ''}" placeholder="Ej: 25.5">
                </td>
                <td class="py-4 text-lg">${reduccionHTML}</td>
            `;
            tablaComparacion.appendChild(tr);
        });

        // Actualizar tarjeta de reducción media
        if (rutasConManual > 0) {
            document.getElementById('reduccion-media').textContent = `${(sumaReduccion / rutasConManual).toFixed(1)}%`;
        } else {
            document.getElementById('reduccion-media').textContent = '0%';
        }

        // Escuchar cuando el usuario escribe la distancia manual (evento 'blur' para cuando quita el foco)
        document.querySelectorAll('.input-manual').forEach(input => {
            input.addEventListener('change', async (e) => {
                const id = e.target.getAttribute('data-id');
                const nuevoValor = parseFloat(e.target.value);
                
                if (!isNaN(nuevoValor) && nuevoValor > 0) {
                    await supabase.from('historial_rutas').update({ distancia_manual: nuevoValor }).eq('id', id);
                    cargarComparacion(); // Recargar la tabla para recalcular el %
                }
            });
        });

    } catch (error) {
        console.error("Error al cargar comparación:", error);
    }
};