// js/services/advancedAnalyticsService.js
import { supabase } from './supabase.js';
import { Logger } from './debug.js';

export const advancedAnalyticsService = {
    async getSportScienceStats() {
        try {
            // Eksekusi penarikan data dari 3 VIEW sekaligus secara paralel (Efisiensi Query)
            const [efficiencyRes, splitsRes, weeklyRes] = await Promise.all([
                // View 1: Efisiensi & Kesiapan Fisik (Murni Run & Hike 30 Hari Terakhir)
                supabase
                    .from('view_advanced_running_efficiency')
                    .select('*')
                    .in('type', ['Run', 'Hike'])
                    .order('start_date_local', { ascending: false }),

                // View 2: Granular Splits untuk Sesi Lari Terakhir (Slicing per KM)
                supabase
                    .from('view_granular_splits_breakdown')
                    .select('*')
                    .order('split_number', { ascending: true }),

                // View 3: Tren Beban Mingguan (Agar Grafik Tidak Berdempetan)
                supabase
                    .from('view_weekly_performance_trend')
                    .select('*')
                    .order('year_week', { ascending: false })
                    .limit(8) // Kita ambil 8 minggu terakhir saja untuk grafik yang lega
            ]);

            if (efficiencyRes.error) throw efficiencyRes.error;
            
            const efficiencyData = efficiencyRes.data || [];
            if (efficiencyData.length === 0) return this.getEmptyState();

            // 1. Snapshot Sesi Terakhir (Terbaru)
            const latestRun = efficiencyData[0];

            // 2. Filter data splits murni milik sesi terakhir saja
            const latestSplits = splitsRes.data 
                ? splitsRes.data.filter(s => s.activity_id === latestRun.id)
                : [];

            // 3. Kalkulasi ACR (Acute-to-Chronic Workload Ratio) dari Data Kesiapan
            const now = new Date();
            const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            const fourWeeksAgo = new Date(now.getTime() - (28 * 24 * 60 * 60 * 1000));

            const acuteLoads = efficiencyData.filter(r => new Date(r.start_date_local) >= oneWeekAgo);
            const chronicLoads = efficiencyData.filter(r => new Date(r.start_date_local) >= fourWeeksAgo);

            const acuteTotal = acuteLoads.reduce((acc, r) => acc + (r.session_workload || 0), 0);
            const chronicTotal = chronicLoads.reduce((acc, r) => acc + (r.session_workload || 0), 0);

            const acuteAverage = acuteTotal / 7;
            const chronicAverage = chronicTotal / 28;

            let acrRatio = 0.00;
            if (chronicAverage > 0) {
                acrRatio = parseFloat((acuteAverage / chronicAverage).toFixed(2));
            }

            // Klasifikasi Zona Olahraga Berdasarkan ACR
            let acrZone = 'Under-training';
            let acrClass = 'text-slate-500 bg-slate-50 border-slate-100';
            if (acrRatio >= 0.8 && acrRatio <= 1.3) {
                acrZone = 'Optimal Sweet Spot';
                acrClass = 'text-emerald-600 bg-emerald-50 border-emerald-100';
            } else if (acrRatio > 1.3 && acrRatio <= 1.5) {
                acrZone = 'Overreaching (Caution)';
                acrClass = 'text-amber-600 bg-amber-50 border-amber-100';
            } else if (acrRatio > 1.5) {
                acrZone = 'Danger Zone (Injury Risk)';
                acrClass = 'text-red-600 bg-red-50 border-red-100';
            }

            // 4. Hitung Rata-rata VO2 Max Kontinu (3 Sesi Terakhir)
            const recentRunsForVo2 = efficiencyData.slice(0, 3);
            const avgVo2Max = recentRunsForVo2.reduce((acc, r) => acc + parseFloat(r.vo2max_estimate || 0), 0) / recentRunsForVo2.length;

            return {
                acrRatio,
                acrZone,
                acrClass,
                currentVo2Max: avgVo2Max.toFixed(1),
                latestPropulsion: latestRun.propulsion_score || 0,
                latestCadence: latestRun.cadence || 0,
                latestStride: latestRun.stride_length || 0,
                latestStepsPerMeter: latestRun.steps_per_meter || 0,
                
                // DATA REFACTOR UNTUK GRAFIK:
                // Kita batasi grafik harian biomekanika maksimal 10 sesi terakhir agar tidak dempet
                allRuns: efficiencyData.slice(0, 10), 
                
                // Data pecahan split kilometer untuk sesi lari terbaru
                splitsBreakdown: latestSplits,
                
                // Data akumulasi mingguan untuk grafik makro harian/mingguan
                weeklyTrends: weeklyRes.data || []
            };
        } catch (err) {
            Logger.error("SportScienceService_MultiView_Error", err);
            return this.getEmptyState();
        }
    },

    getEmptyState() {
        return {
            acrRatio: 1.0, acrZone: 'Optimal', acrClass: 'text-emerald-500 bg-emerald-50',
            currentVo2Max: '0.0', latestPropulsion: 0, latestCadence: 0, latestStride: 0, latestStepsPerMeter: 0,
            allRuns: [], splitsBreakdown: [], weeklyTrends: []
        };
    }
};
