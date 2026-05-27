// js/services/advancedAnalyticsService.js
import { supabase } from './supabase.js'; // Sesuaikan dengan config db kamu
import { Logger } from './debug.js';

export const advancedAnalyticsService = {
    /**
     * Mengambil daftar opsi minggu yang tersedia dari View Tren Mingguan
     */
    async getWeeklyOptions() {
        try {
            const { data, error } = await supabase
                .from('view_weekly_performance_trend')
                .select('year_week, week_start_date')
                .order('week_start_date', { ascending: false });

            if (error) throw error;
            
            return (data || []).map(row => ({
                value: row.year_week,
                label: `Wk ${row.year_week.split('-W')[1]} (${row.week_start_date})`
            }));
        } catch (err) {
            Logger.error("AdvService_GetWeeklyOptions_Error", err);
            return [];
        }
    },

    /**
     * Mengambil metrik ringkasan tingkat lanjut (Efisiensi & Mekanika murni)
     */
    async getAdvancedStats(weekPeriod = 'all') {
        try {
            let query = supabase.from('view_advanced_running_efficiency').select('*');
            
            // Jika filter tidak 'all', pecah string '2026-W22' untuk parsing filter jika diperlukan
            // Atau jika data view_advanced_running_efficiency direlasikan via weekly_period
            if (weekPeriod !== 'all') {
                // Contoh pengondisian jika ada kolom pembantu pencocokan minggu
                // query = query.eq('weekly_group', weekPeriod);
            }

            const { data, error } = await query.order('start_date_local', { ascending: false });
            if (error) throw error;

            if (!data || data.length === 0) return this.getEmptyState();

            // Kalkulasi Agregasi Serverless/Client-side untuk Bento Cards
            const totalRuns = data.length;
            const sumRpeEff = data.reduce((acc, row) => acc + parseFloat(row.rpe_efficiency_index || 0), 0);
            const sumPropulsion = data.reduce((acc, row) => acc + parseFloat(row.propulsion_score || 0), 0);
            const sumDensity = data.reduce((acc, row) => acc + parseFloat(row.steps_per_meter || 0), 0);
            const sumFatigue = data.reduce((acc, row) => acc + parseFloat(row.fatigue_score || 0), 0);

            return {
                avgRpeEfficiency: (sumRpeEff / totalRuns).toFixed(2),
                avgPropulsion: Math.round(sumPropulsion / totalRuns),
                stepsPerMeter: (sumDensity / totalRuns).toFixed(2),
                fatigueScore: (sumFatigue / totalRuns).toFixed(3),
                recentAdvancedLogs: data // Mengirim raw data view untuk log list
            };
        } catch (err) {
            Logger.error("AdvService_GetAdvancedStats_Error", err);
            return this.getEmptyState();
        }
    },

    /**
     * Mengambil data split kilometer granular untuk satu aktivitas tertentu
     */
    async getSplitsBreakdown(activityId) {
        try {
            const { data, error } = await supabase
                .from('view_granular_splits_breakdown')
                .select('*')
                .eq('activity_id', activityId)
                .order('split_number', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (err) {
            Logger.error("AdvService_GetSplitsBreakdown_Error", err);
            return [];
        }
    },

    getEmptyState() {
        return {
            avgRpeEfficiency: "0.00",
            avgPropulsion: 0,
            stepsPerMeter: "0.00",
            fatigueScore: "0.000",
            recentAdvancedLogs: []
        };
    }
};
