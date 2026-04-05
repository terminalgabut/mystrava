// root/logic/coachLogic.js
import { supabase } from '../js/services/supabase.js'; // Pastikan path ini benar sesuai projectmu
import { Logger } from '../js/services/debug.js';

export const CoachLogic = {
    /**
     * 1. Mengambil Rekomendasi dari SQL View
     */
    async getDailyBrief() {
        try {
            const { data, error } = await supabase
                .from('coach_daily_brief')
                .select('*')
                .single();
            
            if (error) throw error;
            return data;
        } catch (err) {
            Logger.error("Coach_Brief_Logic_Error", err);
            return {
                recommendation: 'Syncing Data...',
                breathing_tip: 'Napas adalah kunci. Tunggu sebentar selagi kami menghitung...'
            };
        }
    },

    /**
     * 2. Mencari Aktivitas Terbaru yang RPE-nya masih KOSONG
     */
    async getPendingRPE() {
        try {
            const { data, error } = await supabase
                .from('activities')
                .select('id, name, type, average_watts, kilojoules, start_date')
                .is('user_rpe', null)
                .order('start_date', { ascending: false })
                .limit(1);

            if (error) throw error;
            return data && data.length > 0 ? data[0] : null;
        } catch (err) {
            Logger.error("Coach_PendingRPE_Error", err);
            return null;
        }
    },

    /**
     * 3. Menyimpan Nilai RPE (1-10) ke Database
     */
    async saveRPE(activityId, value) {
        try {
            const { error } = await supabase
                .from('activities')
                .update({ user_rpe: parseInt(value) })
                .eq('id', activityId);

            if (error) throw error;
            return true;
        } catch (err) {
            Logger.error("Coach_SaveRPE_Error", err);
            return false;
        }
    },

    /**
     * 4. Menghitung Skor Kesiapan (Readiness)
     * Rumus: 100 - (Total kJ 7 hari terakhir / Batas Kelelahan)
     */
    async calculateReadiness() {
        try {
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            
            const { data, error } = await supabase
                .from('activities')
                .select('kilojoules')
                .gt('start_date', sevenDaysAgo);

            if (error) throw error;

            const totalKj = data?.reduce((acc, curr) => acc + (curr.kilojoules || 0), 0) || 0;
            const limitKj = 3000; // Kamu bisa ubah angka ini sesuai kapasitasmu (misal 3000kJ seminggu)
            
            let score = 100 - ((totalKj / limitKj) * 100);
            score = Math.max(0, Math.min(100, Math.round(score)));

            let status = 'STABLE';
            if (score > 80) status = 'PRIMED';
            else if (score < 40) status = 'FATIGUED';

            return { score, status };
        } catch (err) {
            Logger.error("Coach_Readiness_Error", err);
            return { score: 50, status: 'NEUTRAL' };
        }
    },

    /**
     * 5. metadata untuk Label UI (Sesuai Screenshot Strava & Napas)
     */
    getRpeMetadata(value) {
        const val = parseInt(value);
        const meta = {
            1: { label: 'Rest', desc: 'Sangat santai, napas normal', color: '#10b981' },
            2: { label: 'Easy', desc: 'Bisa ngobrol sangat lancar', color: '#10b981' },
            3: { label: 'Easy', desc: 'Napas tenang & teratur', color: '#10b981' },
            4: { label: 'Moderate', desc: 'Napas mulai terasa dalam', color: '#3b82f6' },
            5: { label: 'Moderate', desc: 'Mulai berkeringat sedikit', color: '#3b82f6' },
            6: { label: 'Steady', desc: 'Napas berat tapi terkontrol', color: '#3b82f6' },
            7: { label: 'Hard', desc: 'Butuh fokus jaga napas', color: '#f59e0b' },
            8: { label: 'Hard', desc: 'Napas tersengal-sengal', color: '#f59e0b' },
            9: { label: 'Extreme', desc: 'Hampir kehabisan napas', color: '#ef4444' },
            10: { label: 'Max Effort', desc: 'Usaha habis-habisan!', color: '#ef4444' }
        };
        return meta[val] || meta[5];
    }
};
