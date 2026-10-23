import { TiendaModel } from '../models/tiendaModel.js';
import { TiendasView } from '../views/tiendasView.js';

let tiendasGlobal = []; 

document.addEventListener('DOMContentLoaded', cargarTiendas);

async function cargarTiendas() {
    try {
        tiendasGlobal = await TiendaModel.obtenerTodas();
        TiendasView.renderizarTabla(tiendasGlobal);
        asignarEventosBotones();
    } catch (error) {
        console.error("Error cargando tiendas:", error);
    }
}

TiendasView.formTienda.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = TiendasView.inputId.value;
    const datosTienda = TiendasView.obtenerDatosFormulario();

    try {
        if (id) {
            await TiendaModel.actualizar(id, datosTienda);
            alert('✅ Tienda actualizada correctamente');
        } else {
            await TiendaModel.crear(datosTienda);
            alert('✅ Tienda registrada correctamente');
        }
        TiendasView.resetFormulario();
        cargarTiendas();
    } catch (error) {
        alert('❌ Error al guardar: ' + error.message);
    }
});

TiendasView.btnCancelar.addEventListener('click', () => TiendasView.resetFormulario());
TiendasView.btnCerrarX.addEventListener('click', () => TiendasView.resetFormulario());

document.getElementById('btn-nueva-tienda').addEventListener('click', () => {
    TiendasView.prepararNuevaTienda();
    document.getElementById('nombre').focus();
});

TiendasView.buscador.addEventListener('input', (e) => {
    const termino = e.target.value.toLowerCase();
    const filtradas = tiendasGlobal.filter(t => 
        t.nombre_comercial.toLowerCase().includes(termino) || 
        t.direccion.toLowerCase().includes(termino) ||
        t.barrio.toLowerCase().includes(termino)
    );
    TiendasView.renderizarTabla(filtradas);
    asignarEventosBotones();
});

function asignarEventosBotones() {
    // Botones Editar
    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const tienda = tiendasGlobal.find(t => t.id === id);
            if (tienda) TiendasView.llenarFormulario(tienda);
        });
    });

    // Botones Eliminar
    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            if(confirm('¿Estás seguro de que deseas eliminar esta tienda permanentemente?')) {
                try {
                    await TiendaModel.eliminar(id);
                    cargarTiendas();
                } catch (error) {
                    alert('Error al eliminar la tienda');
                }
            }
        });
    });

    // SWITCH
    document.querySelectorAll('.btn-estado').forEach(switchInput => {
        switchInput.addEventListener('change', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const estaActivo = e.currentTarget.checked;
            const nuevoEstado = estaActivo ? 'activo' : 'inactivo';
            
            try {
                await TiendaModel.cambiarEstado(id, nuevoEstado);
                cargarTiendas(); 
            } catch (error) {
                alert('Error al cambiar estado');
                e.currentTarget.checked = !estaActivo; 
            }
        });
    });
}