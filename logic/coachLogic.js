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
    },

    // Tambahkan fungsi-fungsi ini di dalam objek CoachLogic

    /**
     * 6. Ambil data recovery hari ini (WIB)
     */
    async getTodayRecovery() {
        try {
            // Ambil tanggal hari ini dalam format YYYY-MM-DD (WIB)
            const todayWib = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

            const { data, error } = await supabase
                .from('daily_recovery')
                .select('*')
                .eq('check_in_date', todayWib)
                .single(); // Kita hanya butuh satu record per hari

            if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows found" error
            return data || null;
        } catch (err) {
            Logger.error("Coach_GetRecovery_Error", err);
            return null;
        }
    },

    /**
 * 7. Simpan data recovery harian (WIB) - FIX UNDEFINED TIMESTAMP
 */

    async saveDailyRecovery(payload) {
    try {
        const todayWib = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
        
        // 1. Ambil data yang sudah ada di DB untuk hari ini
        const { data: existing } = await supabase
            .from('daily_recovery')
            .select('*')
            .eq('check_in_date', todayWib)
            .single();

        const formatTime = (timeStr) => {
            if (!timeStr || timeStr === 'undefined') return undefined;
            return `${todayWib}T${timeStr}:00+07:00`;
        };

        // 2. Gabungkan data: Gunakan data baru jika ada, jika tidak pakai data lama (existing)
        const entry = {
            check_in_date: todayWib,
            // Jika payload.start ada, pakai itu. Jika tidak, pakai dari DB.
            sleep_start: formatTime(payload.start) || existing?.sleep_start,
            sleep_end: formatTime(payload.end) || existing?.sleep_end,
            
            // Lakukan hal yang sama untuk kolom numerik
            sleep_quality: payload.quality !== undefined ? parseInt(payload.quality) : existing?.sleep_quality,
            morning_rhr: payload.rhr !== undefined ? parseInt(payload.rhr) : existing?.morning_rhr,
            soreness: payload.soreness !== undefined ? parseInt(payload.soreness) : existing?.soreness,
            
            sleep_latency_mins: payload.latency !== undefined ? parseInt(payload.latency) : existing?.sleep_latency_mins,
            nap_duration_mins: payload.nap !== undefined ? parseInt(payload.nap) : existing?.nap_duration_mins,
            sleep_consistency_score: payload.consistency !== undefined ? parseFloat(payload.consistency) : existing?.sleep_consistency_score,
            is_overnight_complete: payload.isComplete !== undefined ? payload.isComplete : (existing?.is_overnight_complete ?? true),
            
            notes: payload.notes || existing?.notes || ''
        };

        // 3. Simpan data yang sudah lengkap (merged)
        const { error } = await supabase
            .from('daily_recovery')
            .upsert(entry, { onConflict: 'check_in_date' });

        if (error) throw error;
        return true;
    } catch (err) {
        Logger.error("CoachLogic_SaveRecovery_Error", err);
        return false;
    }
},
 

    // Tambahkan fungsi ini di dalam objek CoachLogic

    /**
     * 8. Ambil Data Tren Mingguan untuk Grafik (7 Hari Terakhir)
     * Menggabungkan Volume (Kj), Readiness, dan RHR per hari
     */
    async getWeeklyTrend() {
        try {
            const days = [];
            const labels = [];
            const now = new Date();

            // Generate list 7 hari terakhir (WIB)
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
                days.push(dateStr);
                labels.push(d.toLocaleDateString('id-ID', { weekday: 'short' })); // Sen, Sel, dst.
            }

            // 1. Tarik Data Aktivitas (Workload)
            const { data: activities, error: actErr } = await supabase
                .from('activities')
                .select('start_date, kilojoules')
                .gte('start_date', days[0]);

            if (actErr) throw actErr;

            // 2. Tarik Data Recovery (RHR & Sleep)
            const { data: recoveries, error: recErr } = await supabase
                .from('daily_recovery')
                .select('check_in_date, morning_rhr, sleep_quality, soreness')
                .gte('check_in_date', days[0]);

            if (recErr) throw recErr;

            // 3. Mapping Data ke Array untuk Chart
            const workloadSeries = days.map(day => {
                return activities
                    .filter(a => a.start_date.startsWith(day))
                    .reduce((sum, a) => sum + (a.kilojoules || 0), 0);
            });

            const rhrSeries = days.map(day => {
                const rec = recoveries.find(r => r.check_in_date === day);
                return rec ? rec.morning_rhr : null; // null agar grafik tidak drop ke 0 jika data kosong
            });

            // 4. Kalkulasi Readiness Harian (Simulasi sederhana untuk tren)
            // Di sini kita hitung readiness kumulatif tiap harinya
            const readinessSeries = days.map((day, idx) => {
                const totalKjSoFar = workloadSeries.slice(0, idx + 1).reduce((a, b) => a + b, 0);
                const limitKj = 3000;
                let score = 100 - ((totalKjSoFar / limitKj) * 100);
                
                // Modifier RHR jika ada data recovery pada hari itu
                const dailyRhr = rhrSeries[idx];
                if (dailyRhr && dailyRhr > 67) score -= 15;
                
                return Math.max(5, Math.min(100, Math.round(score)));
            });

            return {
                labels,          // ['Sen', 'Sel', ...]
                workloadSeries,  // [1200, 0, 800, ...]
                rhrSeries,       // [62, 63, 68, ...]
                readinessSeries, // [80, 75, 40, ...]
                baselineRhr: 62  // Angka garis putus-putus
            };

        } catch (err) {
            Logger.error("Coach_WeeklyTrend_Error", err);
            return null;
        }
    }
};
