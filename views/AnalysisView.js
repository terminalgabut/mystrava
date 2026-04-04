// views/AnalysisView.js
import { supabase } from '../js/services/supabase.js';

export default {
    name: 'AnalysisView',
    template: `
    <div class="dashboard-wrapper animate-in p-6 md:p-12 lg:p-16">
        <header class="dashboard-header mb-12">
            <div>
                <h1 class="text-display">Performance Analysis</h1>
                <p class="text-caption mt-1">Data-driven race predictions & trends</p>
            </div>
            <div class="icon-box bg-blue-50 text-blue-600">
                <i data-lucide="trending-up" class="w-5 h-5"></i>
            </div>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-1 space-y-6">
                <div class="bento-card p-8 bg-slate-900 text-white border-0 shadow-2xl">
                    <h3 class="text-xs font-black uppercase tracking-[0.2em] text-blue-400 mb-6">Race Vision</h3>
                    <div class="space-y-6">
                        <div v-for="race in predictions" :key="race.name" class="flex justify-between items-center border-b border-slate-800 pb-4 last:border-0">
                            <div>
                                <p class="text-[10px] font-bold text-slate-500 uppercase">{{ race.name }}</p>
                                <p class="text-xs font-medium text-slate-400">Target Pace: {{ race.pace }}</p>
                            </div>
                            <div class="text-right">
                                <p class="stat-value text-xl font-black italic">{{ race.time }}</p>
                            </div>
                        </div>
                    </div>
                    <p class="text-[8px] text-slate-500 mt-6 leading-relaxed">
                        *Estimasi berdasarkan performa 5K terbaik dalam 30 hari terakhir.
                    </p>
                </div>
            </div>

            <div class="lg:col-span-2 space-y-8">
                <div class="bento-card p-8 bg-white border border-slate-100">
                    <div class="flex justify-between items-center mb-8">
                        <h3 class="text-card-title">Pace Consistency</h3>
                        <span class="label-muted text-[10px]">Last 3 Months</span>
                    </div>
                    <div class="h-64 flex items-end justify-between gap-2 px-4">
                        <div v-for="i in 12" :key="i" 
                             class="w-full bg-blue-50 rounded-t-lg transition-all hover:bg-blue-600 cursor-help"
                             :style="{ height: Math.random() * 100 + '%' }"
                             :title="'Week ' + i">
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bento-card p-6 bg-white border border-slate-100">
                        <p class="label-muted text-[10px] mb-2 uppercase font-black">Best 5K This Month</p>
                        <h2 class="stat-value text-2xl text-slate-900 italic">24:12</h2>
                    </div>
                    <div class="bento-card p-6 bg-white border border-slate-100">
                        <p class="label-muted text-[10px] mb-2 uppercase font-black">Projected VO2 Max</p>
                        <h2 class="stat-value text-2xl text-blue-600 italic">44.2</h2>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            predictions: [
                { name: '5K Prediction', time: '23:15', pace: '4:39 min/km' },
                { name: '10K Prediction', time: '48:30', pace: '4:51 min/km' },
                { name: 'Half Marathon', time: '01:48:10', pace: '5:08 min/km' },
                { name: 'Marathon', time: '03:55:00', pace: '5:34 min/km' }
            ]
        };
    },
    mounted() {
        // Ini otomatis jalan saat kamu klik menu "Analytics" di sidebar
        this.calculateAnalysis();
        
        if (window.lucide) window.lucide.createIcons();
    },
    methods: {
    async calculateAnalysis() {
        this.loading = true;
        try {
            // 1. Ambil semua data lari (Run)
            const { data: runs, error } = await supabase
                .from('activities')
                .select('*')
                .eq('type', 'Run')
                .order('start_date', { ascending: false });

            if (error) throw error;
            if (!runs || runs.length === 0) return;

            // 2. Cari Best 5K (Mencari lari terdekat dengan 5000m yang paling cepat)
            // Filter lari yang minimal 4.9km dan maksimal 5.5km
            const fiveKRuns = runs.filter(r => r.distance >= 4900 && r.distance <= 5500);
            
            if (fiveKRuns.length > 0) {
                // Urutkan berdasarkan pace tercepat (moving_time / distance)
                const best5k = fiveKRuns.sort((a, b) => (a.moving_time / a.distance) - (b.moving_time / b.distance))[0];
                
                this.updatePredictions(best5k);
            }

        } catch (err) {
            console.error("Analysis Error:", err.message);
        } finally {
            this.loading = false;
        }
    },

    updatePredictions(referenceRun) {
        // T1 = Waktu referensi (detik), D1 = Jarak referensi (meter)
        const T1 = referenceRun.moving_time;
        const D1 = referenceRun.distance;

        const distances = [
            { key: '5K', dist: 5000 },
            { key: '10K', dist: 10000 },
            { key: 'Half', dist: 21097 },
            { key: 'Full', dist: 42195 }
        ];

        // Rumus Riegel: T2 = T1 * (D2/D1)^1.06
        this.predictions = distances.map(target => {
            const T2 = T1 * Math.pow((target.dist / D1), 1.06);
            const paceSeconds = T2 / (target.dist / 1000);
            
            return {
                name: target.key + ' Prediction',
                time: this.formatDuration(T2),
                pace: this.formatPace(paceSeconds) + ' min/km'
            };
        });
    },

    formatDuration(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return h > 0 
            ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
            : `${m}:${s.toString().padStart(2, '0')}`;
    },

    formatPace(paceSeconds) {
        const m = Math.floor(paceSeconds / 60);
        const s = Math.floor(paceSeconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }
}
};
