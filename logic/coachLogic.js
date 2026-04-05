// root/logic/coachLogic.js
import { supabase } from '../js/services/supabase.js';
import { BioEngine } from './bioEngine.js'; // Import Brain Baru
import { Logger } from '../js/services/debug.js';

export const CoachLogic = {
    // Tetap ambil data murni
    async getRawActivityData() {
    try {
        const { data, error } = await supabase
            .from('coach_raw_data') // Memanggil view supplier data mentah
            .select('*');
        
        if (error) throw error;
        return data; // Mengembalikan Array of Activities
    } catch (err) {
        Logger.error("Coach_RawData_Error", err);
        return [];
    }
},

    // root/logic/coachLogic.js

async getPendingRPE() {
    try {
        const now = new Date();
        const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000)).toISOString();

        // Cari aktivitas terbaru DALAM 24 JAM terakhir yang RPE-nya masih kosong
        const { data, error } = await supabase
            .from('activities')
            .select('id, name, type, start_date, user_rpe')
            .gt('start_date', yesterday) // Batasi waktu: hanya 24 jam terakhir
            .is('user_rpe', null)        // Harus kosong
            .order('start_date', { ascending: false })
            .limit(1);

        if (error) throw error;
        
        // Jika tidak ada aktivitas tanpa RPE dalam 24 jam terakhir, return null
        return data?.[0] || null;
    } catch (err) {
        Logger.error("Coach_PendingRPE_Error", err);
        return null;
    }
},

    // Delegasikan perhitungan Readiness ke BioEngine di masa depan
    // Untuk sekarang, kita panggil fungsi Engine di dalam sini
    async getFullIntelligence() {
        const workload = await BioEngine.calculateWorkloadBalance();
        const readiness = await this.calculateReadiness(); // Fungsi lama yang sudah ada
        const recovery = BioEngine.predictRecovery(readiness.score);

        return {
            workload,
            readiness,
            recovery
        };
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
