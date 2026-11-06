import { supabase } from '../config/supabase.js';
import { validarEmail, validarPassword } from '../utils/validaciones.js';

const $ = (id) => document.getElementById(id);
let modoRegistro = false;
let perfil = null;

function mostrarError(msg) {
    const e = $('login-error');
    e.textContent = msg || '';
    e.classList.toggle('hidden', !msg);
}

$('btn-alternar-registro').addEventListener('click', () => {
    modoRegistro = !modoRegistro;
    $('campo-nombre').classList.toggle('hidden', !modoRegistro);
    $('login-nombre').required = modoRegistro;
    $('login-subtitulo').textContent = modoRegistro ? 'Crea tu cuenta' : 'Inicia sesión para continuar';
    $('btn-login').textContent = modoRegistro ? 'Registrarme' : 'Iniciar sesión';
    $('btn-alternar-registro').textContent = modoRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate';
    mostrarError('');
});

$('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    mostrarError('');
    const email = $('login-email').value.trim();
    const password = $('login-password').value;
    if (!validarEmail(email)) return mostrarError('Escribe un correo válido.');
    if (!validarPassword(password)) return mostrarError('La contraseña debe tener al menos 6 caracteres.');
    $('btn-login').disabled = true;
    try {
        if (modoRegistro) {
            const { data, error } = await supabase.auth.signUp({
                email, password, options: { data: { nombre: $('login-nombre').value.trim() } }
            });
            if (error) throw error;
            if (!data.session) {
                mostrarError('Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.');
                $('btn-alternar-registro').click();
            }
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
        }
    } catch (err) {
        mostrarError(err.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : err.message);
    } finally {
        $('btn-login').disabled = false;
    }
});

$('btn-cerrar-sesion').addEventListener('click', () => supabase.auth.signOut());

async function aplicarSesion(session) {
    if (!session) {
        perfil = null;
        document.body.dataset.rol = '';
        $('pantalla-login').classList.remove('hidden');
        return;
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (error || !data) {
        mostrarError('No se encontró tu perfil. Contacta al administrador.');
        await supabase.auth.signOut();
        return;
    }
    perfil = data;
    document.body.dataset.rol = data.rol;
    $('sesion-nombre').textContent = data.nombre || session.user.email;
    $('sesion-rol').textContent = data.rol;
    $('pantalla-login').classList.add('hidden');
    $('form-login').reset();
    document.dispatchEvent(new Event('sesion-iniciada'));
    // Primera pantalla según el rol
    if (window.cambiarSeccion) window.cambiarSeccion(data.rol === 'trabajador' ? 'miruta' : 'planificar');
}

supabase.auth.onAuthStateChange((evento, session) => {
    if (evento === 'INITIAL_SESSION' || evento === 'SIGNED_IN' || evento === 'SIGNED_OUT') {
        // setTimeout evita llamar a Supabase dentro del callback de auth
        setTimeout(() => aplicarSesion(session), 0);
    }
});

// ---------- Gestión de usuarios (admin) ----------
window.cargarUsuarios = async () => {
    const tbody = $('tabla-usuarios');
    const { data, error } = await supabase.from('profiles').select('*').order('created_at');
    if (error) { tbody.innerHTML = `<tr><td colspan="3" class="py-4 text-red-600">No tienes permiso para ver usuarios.</td></tr>`; return; }
    tbody.innerHTML = '';
    data.forEach(u => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-gray-100';
        const propio = perfil && u.id === perfil.id;
        tr.innerHTML = `
            <td class="py-3">${u.nombre || '—'}</td>
            <td class="py-3 text-gray-500">${u.email || ''}</td>
            <td class="py-3"><select class="border border-gray-300 rounded-md px-2 py-1" ${propio ? 'disabled title="No puedes cambiar tu propio rol"' : ''}>
                ${['admin', 'trabajador'].map(r => `<option value="${r}" ${u.rol === r ? 'selected' : ''}>${r}</option>`).join('')}
            </select></td>`;
        tr.querySelector('select').addEventListener('change', async (ev) => {
            const { error } = await supabase.from('profiles').update({ rol: ev.target.value }).eq('id', u.id);
            if (error) { alert('No se pudo cambiar el rol.'); window.cargarUsuarios(); }
        });
        tbody.appendChild(tr);
    });
};
