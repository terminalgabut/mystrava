import { Logger } from '../js/services/debug.js';
import { ReadinessEngine } from './engines/readinessEngine.js';

export const IntelligenceCore = {
    /**
     * TUGAS UTAMA: Mengatur alur data Readiness
     */
    calculate(rawActivities, recoveryData, workloadStats, weeklyRecovery = []) {
        try {
            // 1. Ambil Ratio dari Database (RPC)
            const acwr = workloadStats?.ratio || 1.0;

            // 2. Oper tugas hitung ke ReadinessEngine
            const baseScore = ReadinessEngine.calculateBaseScore(acwr);
            const resilience = ReadinessEngine.calculateResilience(rawActivities);

            // 3. Gabungkan hasil untuk dikirim ke Coach.js
            return {
                readiness: { 
                    score: baseScore, // Murni dari ReadinessEngine
                    acwr: acwr.toFixed(2) 
                },
                resilience: {
                    score: resilience.score
                },
                // Persiapkan data untuk grafik Correlation & RHR
                chartData: this._generateChartSeries(rawActivities, weeklyRecovery)
            };
        } catch (err) {
            Logger.error("IntelligenceCore_Readiness_Only_Error", err);
            return this.getDefaults();
        }
    },

    /**
     * TUGAS KEDUA: Mapping data untuk Chart (Tanpa Logika Rumit)
     */
    _generateChartSeries(activities, recoveryHistory = []) {
        const days = [];
        const labels = [];
        
        // Buat sumbu X untuk 7 hari terakhir
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
            days.push(dateStr);
            labels.push(d.toLocaleDateString('id-ID', { weekday: 'short' }));
        }

        // Mapping Workload (Kilojoules)
        const workloadSeries = days.map(day => 
            activities.filter(a => a.start_date.startsWith(day))
                      .reduce((sum, a) => sum + (a.kilojoules || 0), 0)
        );

        // Mapping RHR Asli dari Database (History Recovery)
        const rhrSeries = days.map(day => {
            const record = recoveryHistory.find(r => r.check_in_date === day);
            return record ? record.morning_rhr : null; 
        });

        // Mapping Readiness Line (Garis Hitam)
        // Kita gunakan ReadinessEngine untuk menjaga konsistensi skor di grafik
        const readinessSeries = workloadSeries.map((load, idx) => {
            const last7Days = workloadSeries.slice(Math.max(0, idx - 6), idx + 1);
            const chronicLoad = (last7Days.reduce((a, b) => a + b, 0) / last7Days.length) || 1;
            const dailyRatio = load / chronicLoad;
            return ReadinessEngine.calculateBaseScore(dailyRatio);
        });

        return { labels, workloadSeries, rhrSeries, readinessSeries, baselineRhr: 62 };
    },

    getDefaults: () => ({
        readiness: { score: 0, acwr: "0.00" },
        resilience: { score: 0 },
        chartData: null
    })
};
