import { supabase } from './supabase.js';

export const stravaService = {
    // Ambil semua aktivitas lari
    async getActivities() {
        const { data, error } = await supabase
            .from('activities')
            .select('*')
            .order('start_date', { ascending: false });
        
        if (error) throw error;
        return data;
    },

    // Ambil ringkasan statistik untuk Dashboard
    async getStats() {
        const { data, error } = await supabase
            .from('stats_summary') // Asumsi kamu punya view/table summary
            .select('*')
            .single();
            
        if (error) throw error;
        return data;
    }
};
