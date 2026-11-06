// Sustituye la librería de Supabase (que se carga por CDN en el navegador) por una base de datos simulada.
export async function resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('https://cdn.jsdelivr.net/npm/@supabase/supabase-js')) {
        return { url: new URL('./supabaseFalso.mjs', import.meta.url).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
}
