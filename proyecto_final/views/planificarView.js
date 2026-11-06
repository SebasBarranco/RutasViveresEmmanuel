export const PlanificarView = {
    listaTiendas: document.getElementById('lista-tiendas-checkbox'),
    contadorSeleccionadas: document.getElementById('contador-seleccionadas'),
    infoVehiculo: document.getElementById('info-vehiculo'),
    fechaInput: document.getElementById('fecha-jornada'),
    btnGenerar: document.getElementById('btn-generar-ruta'),

    renderizarTiendas(tiendas) {
        this.listaTiendas.innerHTML = '';
        
        if (tiendas.length === 0) {
            this.listaTiendas.innerHTML = `<p class="text-gray-500 text-sm">No hay tiendas activas registradas.</p>`;
            this.actualizarContador(0, 0);
            return;
        }

        tiendas.forEach(tienda => {
            const div = document.createElement('div');
            div.className = 'flex items-center justify-between p-3 border border-gray-100 rounded-md hover:bg-gray-50 transition';
            
            div.innerHTML = `
                <label class="flex items-center space-x-3 cursor-pointer w-full">
                    <input type="checkbox" class="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 checkbox-tienda" value="${tienda.id}">
                    <div>
                        <p class="font-medium text-gray-800">${tienda.nombre_comercial}</p>
                        <p class="text-xs text-gray-500">${tienda.barrio}</p>
                    </div>
                </label>
                <span class="text-xs text-gray-400">${tienda.direccion}</span>
            `;
            this.listaTiendas.appendChild(div);
        });

        this.actualizarContador(0, tiendas.length);
    },

    renderizarVehiculo(vehiculo) {
        if (vehiculo) {
            this.infoVehiculo.innerHTML = `
                <p class="font-medium text-gray-800">${vehiculo.tipo}</p>
                <p class="text-xs text-gray-500">Placa: ${vehiculo.placa} - <span class="text-emerald-600 font-bold">${vehiculo.estado}</span></p>
            `;
        } else {
            this.infoVehiculo.innerHTML = `<p class="text-red-500 font-medium">No hay vehículo activo</p><p class="text-xs text-gray-500">Registra uno en el módulo Transportes.</p>`;
        }
    },

    actualizarContador(seleccionadas, total) {
        this.contadorSeleccionadas.textContent = `${seleccionadas} de ${total} seleccionadas`;
    },

    obtenerTiendasSeleccionadas() {
        const checkboxes = document.querySelectorAll('.checkbox-tienda:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }
};