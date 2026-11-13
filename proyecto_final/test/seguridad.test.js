// Pruebas de seguridad automatizadas (Taller de pruebas de aceptación, rendimiento y seguridad)
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { instalarDOM } from './helpers/domFalso.mjs';
import { validarEmail, validarPassword, validarTelefono, validarPlaca, validarCoordenadas } from '../utils/validaciones.js';
import { filtrarTiendas } from '../utils/busqueda.js';

const dom = instalarDOM();
const { TiendasView } = await import('../views/tiendasView.js');
const { VehiculosView } = await import('../views/vehiculosView.js');
const { PlanificarView } = await import('../views/planificarView.js');

const XSS = '<img src=x onerror=alert(document.cookie)>';
const SCRIPT = '<script>alert(1)</script>';
const peligroso = html => /<img\s|<script/i.test(html);

describe('PS-01 Inyección SQL en formularios (validaciones del cliente)', () => {
  const payloads = ["' OR '1'='1", "admin'--", "'; DROP TABLE tiendas;--", '" OR ""="', '1; SELECT * FROM profiles'];
  for (const p of payloads) {
    test(`correo con "${p}" es rechazado`, () => assert.equal(validarEmail(p), false));
    test(`teléfono con "${p}" es rechazado`, () => assert.equal(validarTelefono(p), false));
    test(`placa con "${p}" es rechazada`, () => assert.equal(validarPlaca(p), false));
  }
  test('las coordenadas no aceptan texto de inyección', () => assert.equal(validarCoordenadas("7.9' OR '1'='1", '-72.5'), false));
  test('el filtro de búsqueda trata el texto como dato, no como código', () => {
    const t = [{ nombre_comercial: 'La Esperanza', direccion: 'x', barrio: 'y' }];
    assert.equal(filtrarTiendas(t, "' OR '1'='1").length, 0);
    assert.equal(filtrarTiendas(t, '.*').length, 0);
  });
});

describe('PS-02 Autenticación: contraseñas débiles', () => {
  for (const p of ['', '1', '123', '12345', 'abc']) test(`"${p}" no cumple la longitud mínima`, () => assert.equal(validarPassword(p), false));
  test('"123456" sí es aceptada por el cliente (debilidad: solo exige 6 caracteres)', () => assert.equal(validarPassword('123456'), true));
  test('"password" sí es aceptada por el cliente (debilidad)', () => assert.equal(validarPassword('password'), true));
});

describe('PS-03 XSS: lo que escribe un usuario no debe convertirse en HTML', () => {
  test('tabla de tiendas escapa el nombre y la dirección', () => {
    TiendasView.renderizarTabla([{ id: 1, nombre_comercial: XSS, direccion: SCRIPT, barrio: 'b', propietario: XSS, telefono: '3001234567', estado: 'activo' }]);
    assert.equal(peligroso(dom.get('tabla-tiendas').htmlTotal()), false);
  });
  test('tabla de transportes escapa placa y modelo', () => {
    VehiculosView.renderizarTabla([{ id: 1, placa: XSS, modelo: SCRIPT, tipo: 'Liviano', estado: 'Activo' }]);
    assert.equal(peligroso(dom.get('tabla-vehiculos').htmlTotal()), false);
  });
  test('lista de planificación escapa nombre, barrio y dirección', () => {
    PlanificarView.renderizarTiendas([{ id: 1, nombre_comercial: XSS, barrio: SCRIPT, direccion: XSS }]);
    assert.equal(peligroso(dom.get('lista-tiendas-checkbox').htmlTotal()), false);
  });
  test('tarjeta del vehículo activo escapa el tipo y el modelo', () => {
    PlanificarView.renderizarVehiculo({ placa: XSS, modelo: SCRIPT, tipo: XSS });
    assert.equal(peligroso(dom.get('info-vehiculo').htmlTotal()), false);
  });
});
