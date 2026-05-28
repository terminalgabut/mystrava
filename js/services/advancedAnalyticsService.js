// js/services/advancedAnalyticsService.js
import { supabase } from './supabase.js';
import { Logger } from './debug.js';

export const advancedAnalyticsService = {
    async getSportScienceStats() {
        try {
            const [efficiencyRes, splitsRes, weeklyRes] = await Promise.all([
                supabase
                    .from('view_advanced_running_efficiency')
                    .select('*')
                    .order('start_date_local', { ascending: false }),

                supabase
                    .from('view_granular_splits_breakdown')
                    .select('*')
                    .order('split_number', { ascending: true }),

                supabase
                    .from('view_weekly_performance_trend')
                    .select('*')
                    .order('year_week', { ascending: false })
                    .limit(8)
            ]);

            if (efficiencyRes.error) throw efficiencyRes.error;
            if (splitsRes.error) throw splitsRes.error;
            if (weeklyRes.error) throw weeklyRes.error;
            
            const efficiencyData = efficiencyRes.data || [];
            if (efficiencyData.length === 0) return this.getEmptyState();

            const latestRun = efficiencyData[0];
            
            const latestSplits = splitsRes.data 
                ? splitsRes.data.filter(s => s.activity_id === latestRun.activity_id)
                : [];

            // Perhitungan ACWR (Acute-to-Chronic Workload Ratio)
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

            const chronologicalRuns = [...efficiencyData].reverse();
let overallVo2MaxEMA = 0;

// Smoothing factor (k = 2 / (N + 1)). Kita pasang rentang N = 10 sesi untuk kestabilan tren global
const smoothingFactor = 2 / (10 + 1); 

chronologicalRuns.forEach((run) => {
    const sessionVo2 = parseFloat(run.vo2max_estimate || 0);
    if (sessionVo2 > 0) {
        if (overallVo2MaxEMA === 0) {
            overallVo2MaxEMA = sessionVo2; // Inisialisasi basis awal dari sesi pertama
        } else {
            // Jalankan Formula EMA
            overallVo2MaxEMA = (sessionVo2 * smoothingFactor) + (overallVo2MaxEMA * (1 - smoothingFactor));
        }
    }
});

            return {
                acrRatio,
                acrZone,
                acrClass,
                currentVo2Max: overallVo2MaxEMA > 0 ? overallVo2MaxEMA.toFixed(1) : '0.0',
                latestPropulsion: latestRun.propulsion_score || 0,
                latestCadence: latestRun.cadence || 0,
                latestStride: latestRun.stride_length || 0,
                latestStepsPerMeter: latestRun.steps_per_meter || 0,
                allRuns: efficiencyData.slice(0, 10), 
                splitsBreakdown: latestSplits,
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
