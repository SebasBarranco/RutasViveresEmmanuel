export const VehiculosView = {
    tablaVehiculos: document.getElementById('tabla-vehiculos'),
    formVehiculo: document.getElementById('form-vehiculo'),
    buscador: document.getElementById('buscador-vehiculos'),
    inputId: document.getElementById('vehiculo-id'),
    
    modal: document.getElementById('modal-vehiculo'),
    formTitulo: document.getElementById('form-titulo-vehiculo'),
    btnSubmit: document.getElementById('btn-submit-vehiculo'),
    btnCancelar: document.getElementById('btn-cancelar-vehiculo'),
    btnCerrarX: document.getElementById('btn-cerrar-x-vehiculo'),

    renderizarTabla(vehiculos) {
        this.tablaVehiculos.innerHTML = '';
        
        if (vehiculos.length === 0) {
            this.tablaVehiculos.innerHTML = `<tr><td colspan="3" class="text-center py-6 text-gray-400">No hay transportes registrados</td></tr>`;
        }

        vehiculos.forEach(v => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-gray-100 hover:bg-gray-50 transition';
            
            // Lógica para el switch y el texto del estado
            let colorEstado = 'text-gray-400';
            if(v.estado === 'Activo') colorEstado = 'text-emerald-600 font-bold';
            if(v.estado === 'En Mantenimiento') colorEstado = 'text-yellow-600 font-bold';
            if(v.estado === 'Inactivo') colorEstado = 'text-red-500 font-bold';

            // Si está "En Mantenimiento", el switch se apaga (false), igual que si está Inactivo
            const switchChecked = v.estado === 'Activo' ? 'checked' : '';

            const switchHTML = `
                <div class="flex items-center justify-end space-x-3 ml-4">
                    <span class="text-xs uppercase tracking-wider ${colorEstado} w-28 text-right">${v.estado}</span>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" class="sr-only peer btn-estado" data-id="${v.id}" ${switchChecked}>
                        <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                </div>
            `;

            tr.innerHTML = `
                <td class="py-3 font-medium">${v.placa}</td>
                <td class="py-3">${v.modelo}</td>
                <td class="py-3 flex items-center justify-between">
                    <div class="flex items-center space-x-1">
                        <!-- Botón Editar -->
                        <button class="text-emerald-600 hover:text-emerald-800 transition-colors p-1.5 rounded-md hover:bg-emerald-50 btn-editar" data-id="${v.id}" title="Editar transporte">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                              <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                            </svg>
                        </button>
                        <!-- Botón Eliminar -->
                        <button class="text-red-500 hover:text-red-700 transition-colors p-1.5 rounded-md hover:bg-red-50 btn-eliminar" data-id="${v.id}" title="Eliminar transporte">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                              <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                        </button>
                    </div>
                    ${switchHTML}
                </td>
            `;
            this.tablaVehiculos.appendChild(tr);
        });
    },

    obtenerDatosFormulario() {
        return {
            placa: document.getElementById('placa').value.toUpperCase(),
            modelo: document.getElementById('modelo').value,
            tipo: document.getElementById('tipo').value,
            estado: document.getElementById('estado-vehiculo').value
        };
    },

    llenarFormulario(v) {
        this.inputId.value = v.id;
        document.getElementById('placa').value = v.placa;
        document.getElementById('modelo').value = v.modelo;
        document.getElementById('tipo').value = v.tipo;
        document.getElementById('estado-vehiculo').value = v.estado;
        this.mostrarFormulario('Editar Transporte', 'Guardar Cambios');
    },

    prepararNuevo() {
        this.formVehiculo.reset();
        this.inputId.value = '';
        this.mostrarFormulario('Nuevo Transporte', 'Crear Transporte');
    },

    resetFormulario() {
        this.formVehiculo.reset();
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