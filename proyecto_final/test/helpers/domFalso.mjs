// DOM mínimo para probar las vistas en Node: registra el HTML que cada vista inserta.
export function crearNodo() {
  const n = {
    innerHTML: '', className: '', textContent: '', value: '', dataset: {}, style: {}, hijos: [],
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    appendChild(h) { n.hijos.push(h); return h; },
    addEventListener() {}, removeEventListener() {}, setAttribute() {}, focus() {}, reset() {},
    querySelector() { return crearNodo(); }, querySelectorAll() { return []; },
    // todo el HTML que el nodo y sus hijos terminan inyectando en la página
    htmlTotal() { return n.innerHTML + n.hijos.map(h => h.htmlTotal()).join(''); },
  };
  return n;
}
export function instalarDOM() {
  const porId = new Map();
  globalThis.document = {
    getElementById(id) { if (!porId.has(id)) porId.set(id, crearNodo()); return porId.get(id); },
    createElement() { return crearNodo(); },
    querySelector() { return crearNodo(); }, querySelectorAll() { return []; },
    addEventListener() {}, body: crearNodo(),
  };
  return porId;
}
