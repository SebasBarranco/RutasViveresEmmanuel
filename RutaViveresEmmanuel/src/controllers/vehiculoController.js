import { VehiculoModel } from '../models/vehiculoModel.js';
import { VehiculosView } from '../views/vehiculosView.js';

let vehiculosGlobal = []; 

document.addEventListener('DOMContentLoaded', cargarVehiculos);

async function cargarVehiculos() {
    try {
        vehiculosGlobal = await VehiculoModel.obtenerTodos();
        VehiculosView.renderizarTabla(vehiculosGlobal);
        asignarEventos();
    } catch (error) {
        console.error("Error cargando vehículos:", error);
    }
}

VehiculosView.formVehiculo.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = VehiculosView.inputId.value;
    const datos = VehiculosView.obtenerDatosFormulario();

    try {
        if (id) {
            await VehiculoModel.actualizar(id, datos);
            alert('✅ Transporte actualizado');
        } else {
            await VehiculoModel.crear(datos);
            alert('✅ Transporte registrado');
        }
        VehiculosView.resetFormulario();
        cargarVehiculos();
    } catch (error) {
        alert('❌ Error (¿Placa duplicada?): ' + error.message);
    }
});

VehiculosView.btnCancelar.addEventListener('click', () => VehiculosView.resetFormulario());
VehiculosView.btnCerrarX.addEventListener('click', () => VehiculosView.resetFormulario());

document.getElementById('btn-nuevo-vehiculo').addEventListener('click', () => {
    VehiculosView.prepararNuevo();
    document.getElementById('placa').focus();
});

VehiculosView.buscador.addEventListener('input', (e) => {
    const termino = e.target.value.toLowerCase();
    const filtrados = vehiculosGlobal.filter(v => 
        v.placa.toLowerCase().includes(termino) || 
        v.modelo.toLowerCase().includes(termino)
    );
    VehiculosView.renderizarTabla(filtrados);
    asignarEventos();
});

function asignarEventos() {
    // Botones Editar
    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const vehiculo = vehiculosGlobal.find(v => v.id === id);
            if (vehiculo) VehiculosView.llenarFormulario(vehiculo);
        });
    });

    // Botones Eliminar
    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            if(confirm('¿Estás seguro de que deseas eliminar este transporte permanentemente?')) {
                try {
                    await VehiculoModel.eliminar(id);
                    cargarVehiculos();
                } catch (error) {
                    alert('Error al eliminar el transporte');
                }
            }
        });
    });

    // SWITCH (Activar/Inactivar)
    document.querySelectorAll('.btn-estado').forEach(switchInput => {
        switchInput.addEventListener('change', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const estaActivo = e.currentTarget.checked;
            // Si se enciende es Activo, si se apaga es Inactivo
            const nuevoEstado = estaActivo ? 'Activo' : 'Inactivo';
            
            try {
                await VehiculoModel.cambiarEstado(id, nuevoEstado);
                cargarVehiculos(); 
            } catch (error) {
                alert('Error al cambiar estado');
                e.currentTarget.checked = !estaActivo; 
            }
        });
    });
}