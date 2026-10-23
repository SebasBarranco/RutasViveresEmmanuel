export const TiendasView = {
    tablaTiendas: document.getElementById('tabla-tiendas'),
    formTienda: document.getElementById('form-tienda'),
    buscador: document.getElementById('buscador-tiendas'),
    inputId: document.getElementById('tienda-id'),
    
    modal: document.getElementById('modal-tienda'),
    formTitulo: document.getElementById('form-titulo'),
    btnSubmit: document.getElementById('btn-submit-form'),
    btnCancelar: document.getElementById('btn-cancelar'),
    btnCerrarX: document.getElementById('btn-cerrar-x'),

    renderizarTabla(tiendas) {
        this.tablaTiendas.innerHTML = '';
        
        if (tiendas.length === 0) {
            this.tablaTiendas.innerHTML = `<tr><td colspan="3" class="text-center py-6 text-gray-400">No se encontraron tiendas</td></tr>`;
        }

        tiendas.forEach(tienda => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-100 hover:bg-gray-50 transition';
            
            const opacidad = tienda.estado === 'inactivo' ? 'opacity-40' : '';
            const colorEstado = tienda.estado === 'activo' ? 'text-emerald-600 font-bold' : 'text-gray-400 font-medium';
            
            const switchHTML = `
                <div class="flex items-center justify-end space-x-3 ml-4">
                    <span class="text-xs uppercase tracking-wider ${colorEstado} w-16 text-right">${tienda.estado}</span>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" class="sr-only peer btn-estado" data-id="${tienda.id}" ${tienda.estado === 'activo' ? 'checked' : ''}>
                        <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                </div>
            `;

            tr.innerHTML = `
                <td class="py-3 ${opacidad}">${tienda.nombre_comercial}</td>
                <td class="py-3 ${opacidad}">${tienda.direccion}</td>
                <td class="py-3 flex items-center justify-between">
                    <div class="flex items-center space-x-1">
                        <!-- Botón Editar -->
                        <button class="text-emerald-600 hover:text-emerald-800 transition-colors p-1.5 rounded-md hover:bg-emerald-50 btn-editar" data-id="${tienda.id}" title="Editar tienda">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                              <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                            </svg>
                        </button>
                        <!-- Botón Eliminar -->
                        <button class="text-red-500 hover:text-red-700 transition-colors p-1.5 rounded-md hover:bg-red-50 btn-eliminar" data-id="${tienda.id}" title="Eliminar tienda">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                              <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                        </button>
                    </div>
                    ${switchHTML}
                </td>
            `;
            this.tablaTiendas.appendChild(tr);
        });
    },

    obtenerDatosFormulario() {
        return {
            nombre_comercial: document.getElementById('nombre').value,
            direccion: document.getElementById('direccion').value,
            latitud: parseFloat(document.getElementById('latitud').value),
            longitud: parseFloat(document.getElementById('longitud').value),
            barrio: document.getElementById('barrio').value
        };
    },

    llenarFormulario(tienda) {
        this.inputId.value = tienda.id;
        document.getElementById('nombre').value = tienda.nombre_comercial;
        document.getElementById('direccion').value = tienda.direccion;
        document.getElementById('latitud').value = tienda.latitud;
        document.getElementById('longitud').value = tienda.longitud;
        document.getElementById('barrio').value = tienda.barrio;
        
        this.mostrarFormulario('Editar tienda', 'Guardar Cambios');
    },

    prepararNuevaTienda() {
        this.formTienda.reset();
        this.inputId.value = '';
        this.mostrarFormulario('Nueva tienda', 'Crear Tienda');
    },

    resetFormulario() {
        this.formTienda.reset();
        this.inputId.value = '';
        this.ocultarFormulario();
    },

    mostrarFormulario(titulo, textoBoton) {
        this.formTitulo.textContent = titulo;
        this.btnSubmit.textContent = textoBoton;
        this.modal.classList.remove('hidden');
    },

    ocultarFormulario() {
        this.modal.classList.add('hidden');
    }
};