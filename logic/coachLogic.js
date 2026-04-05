// root/logic/coachLogic.js
import { supabase } from '../js/services/supabase.js';
import { Logger } from '../js/services/debug.js';

export const CoachLogic = {
    /**
     * 1. Ambil data mentah (28 hari terakhir)
     * Digunakan oleh BioEngine untuk kalkulasi ACWR & Resilience
     */
    async getRawActivityData() {
        try {
            const { data, error } = await supabase
                .from('coach_raw_data') 
                .select('*');
            
            if (error) throw error;
            return data || []; 
        } catch (err) {
            Logger.error("Coach_RawData_Error", err);
            return [];
        }
    },

    /**
     * 2. Cari aktivitas yang butuh feedback RPE
     * Ketat: Hanya 24 jam terakhir agar tidak "menghantui" user
     */
    async getPendingRPE() {
        try {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

            const { data, error } = await supabase
                .from('activities')
                .select('id, name, type, start_date, user_rpe')
                .gt('start_date', yesterday) 
                .is('user_rpe', null)        
                .order('start_date', { ascending: false })
                .limit(1);

            if (error) throw error;
            return data?.[0] || null;
        } catch (err) {
            Logger.error("Coach_PendingRPE_Error", err);
            return null;
        }
    },

    /**
     * 3. Simpan Nilai RPE ke Database
     * Inilah kunci agar modal bisa tertutup dengan sukses
     */
    async saveRPE(activityId, rpeValue) {
        try {
            if (!activityId) return false;

            const { error } = await supabase
                .from('activities')
                .update({ user_rpe: parseInt(rpeValue) })
                .eq('id', activityId);

            if (error) throw error;
            return true; 
        } catch (err) {
            Logger.error("Coach_SaveRPE_Error", err);
            return false;
        }
    },

    /**
     * 4. Skor Kesiapan (Readiness)
     * Tetap di sini karena query-nya sederhana (7 hari)
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
            const limitKj = 3000; 
            
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
     * 5. Metadata Label UI (Feeling Check)
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
