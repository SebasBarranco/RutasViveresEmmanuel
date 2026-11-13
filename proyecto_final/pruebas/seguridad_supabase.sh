#!/usr/bin/env bash
# Pruebas de acceso sin autorización contra TU proyecto de Supabase (ejecútalas tú, con internet).
# Comprueban que, SIN iniciar sesión, las tablas no entregan datos ni permiten escribir (RLS activo).
# Uso:  SUPABASE_URL=https://xxxx.supabase.co SUPABASE_KEY=sb_publishable_... bash pruebas/seguridad_supabase.sh
set -u
: "${SUPABASE_URL:?define SUPABASE_URL}"; : "${SUPABASE_KEY:?define SUPABASE_KEY}"
H=(-H "apikey: $SUPABASE_KEY" -H "Authorization: Bearer $SUPABASE_KEY" -H "Content-Type: application/json" -H "Prefer: return=representation")

lectura() { # tabla  -> debe devolver [] (RLS filtra todo) o un error de permisos
  printf '%-34s' "LEER  $1 sin sesión:"; curl -s "${H[@]}" "$SUPABASE_URL/rest/v1/$1?select=*&limit=3" | head -c 200; echo
}
escritura() { # tabla cuerpo -> debe fallar con "row-level security"
  printf '%-34s' "ESCRIBIR $1 sin sesión:"; curl -s -X POST "${H[@]}" -d "$2" "$SUPABASE_URL/rest/v1/$1" | head -c 200; echo
}

echo "== Lectura anónima (esperado: [] o error de permisos) =="
for t in tiendas vehiculos historial_rutas profiles; do lectura $t; done

echo; echo "== Escritura anónima (esperado: new row violates row-level security policy) =="
escritura tiendas '{"nombre_comercial":"PRUEBA-ANONIMO","direccion":"x","barrio":"x"}'
escritura vehiculos '{"placa":"ZZZ-999","modelo":"x","tipo":"x"}'
escritura historial_rutas '{"distancia_plataforma":1}'

echo; echo "== Inyección en parámetros de consulta (esperado: error de sintaxis o []; nunca datos) =="
curl -s "${H[@]}" "$SUPABASE_URL/rest/v1/tiendas?select=*&estado=eq.activo'%20OR%20'1'='1" | head -c 200; echo
curl -s "${H[@]}" "$SUPABASE_URL/rest/v1/tiendas?select=*&id=eq.1;DROP%20TABLE%20tiendas" | head -c 200; echo
