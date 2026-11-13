// Prueba de carga y estrés con k6 sobre la plataforma publicada.
// Instalar k6 (https://k6.io) y ejecutar:  k6 run pruebas/k6_carga.js
// Para cambiar la prueba:  k6 run -e MODO=estres pruebas/k6_carga.js
// IMPORTANTE: esta prueba mide GitHub Pages (archivos estáticos). No la apuntes a Supabase ni a Google Maps:
// consumiría la cuota de tu proyecto y podría bloquear tu cuenta.
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = 'https://sebasbarranco.github.io/RutasViveresEmmanuel/proyecto_final/';
const ARCHIVOS = [
  'index.html', 'config/supabase.js',
  'controllers/authController.js', 'controllers/tiendaController.js', 'controllers/vehiculoController.js',
  'controllers/planificarController.js', 'controllers/rutaController.js', 'controllers/comparacionController.js',
  'controllers/miRutaController.js', 'models/tiendaModel.js', 'models/vehiculoModel.js',
  'views/tiendasView.js', 'views/vehiculosView.js', 'views/planificarView.js',
  'utils/tsp.js', 'utils/validaciones.js', 'utils/comparacion.js', 'utils/busqueda.js', 'utils/seguridad.js',
];

const CARGA = { stages: [{ duration: '30s', target: 50 }, { duration: '5m', target: 50 }, { duration: '30s', target: 0 }] };
const ESTRES = { stages: [
  { duration: '1m', target: 50 }, { duration: '1m', target: 100 }, { duration: '1m', target: 200 },
  { duration: '1m', target: 0 },
] };

export const options = {
  ...(__ENV.MODO === 'estres' ? ESTRES : CARGA),
  thresholds: { http_req_failed: ['rate<0.01'], http_req_duration: ['p(95)<1500'] },
};

export default function () {
  for (const a of ARCHIVOS) {
    const r = http.get(BASE + a);
    check(r, { 'estado 200': x => x.status === 200 });
  }
  sleep(1);
}
