import { supabase } from '../config/supabase.js';

export const VehiculoModel = {
    async obtenerTodos() {
        const { data, error } = await supabase.from('vehiculos').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },
    async crear(vehiculo) {
        const { data, error } = await supabase.from('vehiculos').insert([vehiculo]).select();
        if (error) throw error;
        return data[0];
    },
    async actualizar(id, vehiculo) {
        const { data, error } = await supabase.from('vehiculos').update(vehiculo).eq('id', id).select();
        if (error) throw error;
        return data[0];
    },
    // NUEVO: Cambiar estado desde el switch
    async cambiarEstado(id, nuevoEstado) {
        const { data, error } = await supabase.from('vehiculos').update({ estado: nuevoEstado }).eq('id', id).select();
        if (error) throw error;
        return data[0];
    },
    // NUEVO: Eliminar
    async eliminar(id) {
        const { error } = await supabase.from('vehiculos').delete().eq('id', id);
        if (error) throw error;
        return true;
    }
};