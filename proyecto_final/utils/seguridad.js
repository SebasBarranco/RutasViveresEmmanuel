// Convierte texto escrito por un usuario en texto seguro para insertarlo con innerHTML.
const REEMPLAZOS = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escaparHtml(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, c => REEMPLAZOS[c]);
}
