/** Filtra tiendas por nombre, dirección, barrio, propietario o teléfono (sin distinguir mayúsculas). */
export function filtrarTiendas(tiendas, termino) {
    const t = (termino || '').trim().toLowerCase();
    if (!t) return tiendas;
    return tiendas.filter(x =>
        [x.nombre_comercial, x.direccion, x.barrio, x.propietario, x.telefono]
            .some(campo => (campo || '').toLowerCase().includes(t)));
}
