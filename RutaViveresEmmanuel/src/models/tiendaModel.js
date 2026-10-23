import { supabase } from '../config/supabase.js';

export const TiendaModel = {
    async obtenerTodas() {
        const { data, error } = await supabase.from('tiendas').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },
    async crear(tienda) {
        const { data, error } = await supabase.from('tiendas').insert([tienda]).select();
        if (error) throw error;
        return data[0];
    },
    async actualizar(id, tienda) {
        const { data, error } = await supabase.from('tiendas').update(tienda).eq('id', id).select();
        if (error) throw error;
        return data[0];
    },
    async cambiarEstado(id, nuevoEstado) {
        const { data, error } = await supabase.from('tiendas').update({ estado: nuevoEstado }).eq('id', id).select();
        if (error) throw error;
        return data[0];
    },
    // NUEVO MÉTODO PARA ELIMINAR
    async eliminar(id) {
        const { error } = await supabase.from('tiendas').delete().eq('id', id);
        if (error) throw error;
        return true;
    }
};