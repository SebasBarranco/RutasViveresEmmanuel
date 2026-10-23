import { TiendaModel } from '../models/tiendaModel.js';
import { VehiculoModel } from '../models/vehiculoModel.js';
import { PlanificarView } from '../views/planificarView.js';

// Exponemos esta función globalmente para que el index.html pueda llamarla al cambiar de pestaña
window.cargarDatosPlanificar = async function() {
    try {
        // 1. Cargar solo tiendas activas
        const todasTiendas = await TiendaModel.obtenerTodas();
        const tiendasActivas = todasTiendas.filter(t => t.estado === 'activo');
        
        // 2. Cargar vehículo activo
        const todosVehiculos = await VehiculoModel.obtenerTodos();
        const vehiculoActivo = todosVehiculos.find(v => v.estado === 'Activo');

        // 3. Pintar en la vista
        PlanificarView.renderizarTiendas(tiendasActivas);
        PlanificarView.renderizarVehiculo(vehiculoActivo);
        
        // Poner la fecha de hoy por defecto
        const hoy = new Date().toISOString().split('T')[0];
        if(!PlanificarView.fechaInput.value) {
            PlanificarView.fechaInput.value = hoy;
        }

        // 4. Asignar evento a los checkboxes para actualizar el contador
        const checkboxes = document.querySelectorAll('.checkbox-tienda');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                const seleccionadas = document.querySelectorAll('.checkbox-tienda:checked').length;
                PlanificarView.actualizarContador(seleccionadas, tiendasActivas.length);
            });
        });

    } catch (error) {
        console.error("Error al cargar planificación:", error);
    }
};

// Evento del botón "Generar ruta"
PlanificarView.btnGenerar.addEventListener('click', () => {
    const tiendasSeleccionadas = PlanificarView.obtenerTiendasSeleccionadas();
    
    if (tiendasSeleccionadas.length < 2) {
        alert("⚠️ Debes seleccionar al menos 2 tiendas para generar una ruta.");
        return;
    }

    // Guardamos la selección en localStorage para que el módulo de "Ruta generada" la lea
    localStorage.setItem('ruta_tiendas_seleccionadas', JSON.stringify(tiendasSeleccionadas));
    
    alert(`✅ Ruta en proceso. Se seleccionaron ${tiendasSeleccionadas.length} tiendas.`);
    
    // Simulamos el cambio de pestaña a "Ruta generada" usando el botón del menú
    document.getElementById('nav-ruta').click();
});