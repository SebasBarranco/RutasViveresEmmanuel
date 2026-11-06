// Validaciones puras reutilizadas por los controladores y cubiertas por pruebas unitarias.

export function validarEmail(email) {
    return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function validarPassword(pass) {
    return typeof pass === 'string' && pass.length >= 6;
}

/** Teléfono: de 7 a 15 caracteres, solo dígitos, espacios o "+". */
export function validarTelefono(tel) {
    if (typeof tel !== 'string') return false;
    const t = tel.trim();
    return /^[0-9+ ]{7,15}$/.test(t) && t.replace(/\D/g, '').length >= 7;
}

export function validarCoordenadas(lat, lng) {
    return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/** Placa colombiana de carro: tres letras y tres números, con o sin guion (ABC-123). */
export function validarPlaca(placa) {
    return typeof placa === 'string' && /^[A-Z]{3}-?\d{3}$/i.test(placa.trim());
}

/** Una ruta necesita al menos 2 tiendas seleccionadas (RF09/RF10). */
export function validarSeleccionTiendas(ids) {
    return Array.isArray(ids) && ids.length >= 2;
}
