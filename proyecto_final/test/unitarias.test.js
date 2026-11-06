// PRUEBAS UNITARIAS — cada describe corresponde a un ID del Formato 1 del Taller #7.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validarEmail, validarPassword, validarTelefono, validarCoordenadas, validarPlaca, validarSeleccionTiendas } from '../utils/validaciones.js';
import { haversine, matrizRecta, longitudCircuito, resolverTSP } from '../utils/tsp.js';
import { calcularReduccion, reduccionMedia } from '../utils/comparacion.js';
import { filtrarTiendas } from '../utils/busqueda.js';

describe('PU-01 validarEmail()', () => {
    it('normal: correo válido', () => assert.equal(validarEmail('admin@viveresemmanuel.com'), true));
    it('normal: correo con espacios alrededor se acepta', () => assert.equal(validarEmail('  juan@mail.co  '), true));
    it('límite: dominio de 2 letras', () => assert.equal(validarEmail('a@b.co'), true));
    it('límite: sin extensión', () => assert.equal(validarEmail('a@b'), false));
    it('erróneo: sin arroba', () => assert.equal(validarEmail('correo.com'), false));
    it('erróneo: vacío y valor no texto', () => { assert.equal(validarEmail(''), false); assert.equal(validarEmail(null), false); });
});

describe('PU-02 validarPassword()', () => {
    it('normal: contraseña de 10 caracteres', () => assert.equal(validarPassword('Admin2026!'), true));
    it('límite: exactamente 6 caracteres', () => assert.equal(validarPassword('abc123'), true));
    it('límite: 5 caracteres', () => assert.equal(validarPassword('abc12'), false));
    it('erróneo: vacía o no texto', () => { assert.equal(validarPassword(''), false); assert.equal(validarPassword(undefined), false); });
});

describe('PU-03 validarTelefono()', () => {
    it('normal: celular de 10 dígitos', () => assert.equal(validarTelefono('3001234567'), true));
    it('normal: con prefijo + y espacios', () => assert.equal(validarTelefono('+57 300 1234567'), true));
    it('límite: 7 dígitos (mínimo)', () => assert.equal(validarTelefono('5712345'), true));
    it('límite: 6 dígitos', () => assert.equal(validarTelefono('571234'), false));
    it('límite: 16 caracteres', () => assert.equal(validarTelefono('1234567890123456'), false));
    it('erróneo: contiene letras', () => assert.equal(validarTelefono('300abc4567'), false));
});

describe('PU-04 validarCoordenadas()', () => {
    it('normal: punto en Cúcuta', () => assert.equal(validarCoordenadas(7.929125, -72.494002), true));
    it('límite: extremos permitidos', () => { assert.equal(validarCoordenadas(90, 180), true); assert.equal(validarCoordenadas(-90, -180), true); });
    it('límite: latitud fuera de rango', () => assert.equal(validarCoordenadas(90.1, 0), false));
    it('erróneo: NaN (campo vacío en el formulario)', () => assert.equal(validarCoordenadas(NaN, -72.5), false));
});

describe('PU-05 validarPlaca()', () => {
    it('normal: con guion', () => assert.equal(validarPlaca('ABC-123'), true));
    it('normal: sin guion y en minúscula', () => assert.equal(validarPlaca('abc123'), true));
    it('límite: letras de más', () => assert.equal(validarPlaca('ABCD-123'), false));
    it('erróneo: solo números', () => assert.equal(validarPlaca('123-456'), false));
});

describe('PU-06 validarSeleccionTiendas()', () => {
    it('normal: 5 tiendas', () => assert.equal(validarSeleccionTiendas(['a', 'b', 'c', 'd', 'e']), true));
    it('límite: exactamente 2', () => assert.equal(validarSeleccionTiendas(['a', 'b']), true));
    it('límite: solo 1', () => assert.equal(validarSeleccionTiendas(['a']), false));
    it('erróneo: lista vacía o no es lista', () => { assert.equal(validarSeleccionTiendas([]), false); assert.equal(validarSeleccionTiendas(null), false); });
});

describe('PU-07 haversine()', () => {
    it('normal: 0.01° de latitud ≈ 1.11 km', () => {
        const d = haversine({ lat: 7.9, lng: -72.5 }, { lat: 7.91, lng: -72.5 });
        assert.ok(Math.abs(d - 1.112) < 0.01, `distancia obtenida: ${d}`);
    });
    it('límite: mismo punto da 0', () => assert.equal(haversine({ lat: 7.9, lng: -72.5 }, { lat: 7.9, lng: -72.5 }), 0));
    it('normal: es simétrica', () => {
        const a = { lat: 7.9, lng: -72.5 }, b = { lat: 7.95, lng: -72.45 };
        assert.ok(Math.abs(haversine(a, b) - haversine(b, a)) < 1e-12);
    });
    it('erróneo: coordenada indefinida devuelve NaN', () => assert.ok(Number.isNaN(haversine({ lat: undefined, lng: 0 }, { lat: 1, lng: 1 }))));
});

describe('PU-08 resolverTSP() — algoritmo exacto (hasta 12 paradas)', () => {
    const puntos = n => Array.from({ length: n + 1 }, (_, i) => ({ lat: 7.9 + ((i * 37) % 11) * 0.004, lng: -72.5 + ((i * 53) % 13) * 0.004 }));
    const permutaciones = a => a.length < 2 ? [a] : a.flatMap((x, i) => permutaciones([...a.slice(0, i), ...a.slice(i + 1)]).map(p => [x, ...p]));

    it('normal: coincide con la mejor ruta por fuerza bruta (7 paradas)', () => {
        const d = matrizRecta(puntos(7));
        const mejor = Math.min(...permutaciones([1, 2, 3, 4, 5, 6, 7]).map(p => longitudCircuito(d, p)));
        assert.ok(Math.abs(longitudCircuito(d, resolverTSP(d)) - mejor) < 1e-9);
    });
    it('normal: visita cada tienda exactamente una vez', () => {
        const orden = resolverTSP(matrizRecta(puntos(8)));
        assert.deepEqual([...orden].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8]);
    });
    it('límite: una sola parada', () => assert.deepEqual(resolverTSP(matrizRecta(puntos(1))), [1]));
    it('límite: sin paradas', () => assert.deepEqual(resolverTSP(matrizRecta(puntos(0))), []));
    it('límite: 12 paradas (máximo exacto) devuelve 12 índices distintos', () => {
        const orden = resolverTSP(matrizRecta(puntos(12)));
        assert.equal(new Set(orden).size, 12);
    });
});

describe('PU-09 resolverTSP() — heurística 2-opt (más de 12 paradas)', () => {
    const puntos = n => Array.from({ length: n + 1 }, (_, i) => ({ lat: 7.9 + ((i * 37) % 17) * 0.003, lng: -72.5 + ((i * 53) % 19) * 0.003 }));
    it('normal: 30 paradas, sin repetir ni omitir', () => {
        const orden = resolverTSP(matrizRecta(puntos(30)));
        assert.deepEqual([...orden].sort((a, b) => a - b), Array.from({ length: 30 }, (_, i) => i + 1));
    });
    it('normal: no es peor que el orden original de la lista', () => {
        const d = matrizRecta(puntos(20));
        const original = Array.from({ length: 20 }, (_, i) => i + 1);
        assert.ok(longitudCircuito(d, resolverTSP(d)) <= longitudCircuito(d, original));
    });
    it('límite: 13 paradas (primer caso heurístico)', () => assert.equal(resolverTSP(matrizRecta(puntos(13))).length, 13));
});

describe('PU-10 calcularReduccion()', () => {
    it('normal: 25 km manual vs 20 km plataforma = 20 %', () => assert.equal(calcularReduccion(25, 20), 20));
    it('normal: la plataforma es peor da valor negativo', () => assert.ok(calcularReduccion(20, 25) < 0));
    it('límite: km manual igual a 0 devuelve null', () => assert.equal(calcularReduccion(0, 10), null));
    it('límite: iguales dan 0 %', () => assert.equal(calcularReduccion(10, 10), 0));
    it('erróneo: texto o negativo devuelve null', () => { assert.equal(calcularReduccion('abc', 10), null); assert.equal(calcularReduccion(-5, 10), null); });
});

describe('PU-11 reduccionMedia()', () => {
    it('normal: promedio de dos jornadas (20 % y 10 %)', () => {
        const r = reduccionMedia([{ distancia_manual: 25, distancia_plataforma: 20 }, { distancia_manual: 10, distancia_plataforma: 9 }]);
        assert.ok(Math.abs(r - 15) < 1e-9);
    });
    it('límite: ignora jornadas sin km manual', () => assert.equal(reduccionMedia([{ distancia_manual: null, distancia_plataforma: 12 }, { distancia_manual: 20, distancia_plataforma: 10 }]), 50));
    it('límite: lista vacía da 0', () => assert.equal(reduccionMedia([]), 0));
});

describe('PU-12 filtrarTiendas()', () => {
    const tiendas = [
        { nombre_comercial: 'Tienda La Esperanza', direccion: 'Av 5 #10-20', barrio: 'Atalaya', propietario: 'María Pérez', telefono: '3001112233' },
        { nombre_comercial: 'Mini Mercado El Sol', direccion: 'Cll 8 #3-15', barrio: 'La Libertad', propietario: 'Juan Ruiz', telefono: '3114445566' }
    ];
    it('normal: busca por nombre sin importar mayúsculas', () => assert.equal(filtrarTiendas(tiendas, 'esperanza').length, 1));
    it('normal: busca por barrio, propietario y teléfono', () => {
        assert.equal(filtrarTiendas(tiendas, 'libertad').length, 1);
        assert.equal(filtrarTiendas(tiendas, 'ruiz').length, 1);
        assert.equal(filtrarTiendas(tiendas, '3001112233').length, 1);
    });
    it('límite: texto vacío devuelve todas', () => assert.equal(filtrarTiendas(tiendas, '  ').length, 2));
    it('erróneo: sin coincidencias devuelve lista vacía', () => assert.equal(filtrarTiendas(tiendas, 'zzz').length, 0));
    it('límite: tiendas sin propietario ni teléfono no rompen la búsqueda', () => assert.equal(filtrarTiendas([{ nombre_comercial: 'Sin datos', direccion: 'x', barrio: 'y' }], 'sin').length, 1));
});
