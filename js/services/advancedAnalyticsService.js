// js/services/advancedAnalyticsService.js
import { supabase } from './supabase.js';
import { Logger } from './debug.js';

export const advancedAnalyticsService = {
    async getSportScienceStats() {
        try {
            // Ambil data lari 30 hari terakhir untuk mendapatkan context Acute & Chronic
            const { data, error } = await supabase
                .from('view_advanced_running_efficiency')
                .select('*')
                .order('start_date_local', { ascending: false });

            if (error) throw error;
            if (!data || data.length === 0) return this.getEmptyState();

            // 1. Ambil Sesi Lari Terakhir untuk Snapshot Metric
            const latestRun = data[0];

            // 2. Kalkulasi ACR (Acute-to-Chronic Workload Ratio)
            const now = new Date();
            const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            const fourWeeksAgo = new Date(now.getTime() - (28 * 24 * 60 * 60 * 1000));

            const acuteLoads = data.filter(r => new Date(r.start_date_local) >= oneWeekAgo);
            const chronicLoads = data.filter(r => new Date(r.start_date_local) >= fourWeeksAgo);

            const acuteTotal = acuteLoads.reduce((acc, r) => acc + (r.session_workload || 0), 0);
            const chronicTotal = chronicLoads.reduce((acc, r) => acc + (r.session_workload || 0), 0);

            // Rata-rata beban mingguan (7 hari) vs Bulanan (4 minggu)
            const acuteAverage = acuteTotal / 7;
            const chronicAverage = chronicTotal / 28;

            let acrRatio = 0.00;
            if (chronicAverage > 0) {
                acrRatio = parseFloat((acuteAverage / chronicAverage).toFixed(2));
            }

            // Tentukan status zona ACR berdasarkan Sport Science
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

            // 3. Ambil Rata-rata VO2 Max dari 3 lari terakhir untuk stabilitas tren
            const recentRunsForVo2 = data.slice(0, 3);
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
                allRuns: data // untuk dikirim ke grafik garis kemajuan
            };
        } catch (err) {
            Logger.error("SportScienceService_Error", err);
            return this.getEmptyState();
        }
    },

    getEmptyState() {
        return {
            acrRatio: 1.0, acrZone: 'Optimal', acrClass: 'text-emerald-500',
            currentVo2Max: '0.0', latestPropulsion: 0, latestCadence: 0, latestStride: 0, latestStepsPerMeter: 0, allRuns: []
        };
    }
};
