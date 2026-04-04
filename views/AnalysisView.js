// views/AnalysisView.js
import { supabase } from '../js/services/supabase.js';

export default {
    name: 'AnalysisView',
    template: `
    <div class="dashboard-wrapper animate-in p-6 md:p-12 lg:p-16" :class="{ 'is-loading': loading }">
        <header class="dashboard-header mb-12">
            <div>
                <h1 class="text-display">Performance Analysis</h1>
                <p class="text-caption mt-1 text-[10px]">Data-driven race predictions & trends</p>
            </div>
            <div class="icon-box bg-blue-50 text-blue-600">
                <i data-lucide="trending-up" class="w-5 h-5"></i>
            </div>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-1 space-y-6">
                <div class="bento-card p-8 bg-slate-900 text-white border-0 shadow-2xl relative overflow-hidden">
                    <div class="absolute top-0 right-0 p-4 opacity-10">
                        <i data-lucide="zap" class="w-20 h-20"></i>
                    </div>
                    <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-8 relative z-10">Race Vision</h3>
                    <div class="space-y-6 relative z-10">
                        <div v-for="race in predictions" :key="race.name" class="flex justify-between items-center border-b border-slate-800 pb-4 last:border-0">
                            <div>
                                <p class="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{{ race.name }}</p>
                                <p class="text-[11px] font-medium text-slate-400">Target: {{ race.pace }}</p>
                            </div>
                            <div class="text-right">
                                <p class="stat-value text-xl font-black italic tracking-tighter">{{ race.time }}</p>
                            </div>
                        </div>
                    </div>
                    <p class="text-[8px] text-slate-500 mt-8 leading-relaxed italic">
                        *Estimasi berdasarkan lari 5K terbaik di database kamu.
                    </p>
                </div>
            </div>

            <div class="lg:col-span-2 space-y-8">
                <div class="bento-card p-8 bg-white border border-slate-100">
                    <div class="flex justify-between items-center mb-10">
                        <div>
                            <h3 class="text-card-title">Pace Distribution</h3>
                            <p class="text-[9px] text-slate-400 uppercase font-bold mt-1">Frekuensi lari per menit pace</p>
                        </div>
                        <span class="label-muted text-[10px]">All Time Data</span>
                    </div>
                    <div class="h-48 flex items-end justify-between gap-3 px-2">
                        <div v-for="bin in paceHistogram" :key="bin.label" 
                             class="flex-1 group relative flex flex-col items-center">
                            <div class="absolute -top-10 bg-slate-800 text-white text-[9px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                                {{ bin.count }} Activities
                            </div>
                            <div class="w-full bg-blue-500 rounded-t-lg transition-all group-hover:bg-blue-600 relative overflow-hidden"
                                 :style="{ height: (bin.count / maxPaceCount * 100) + '%' }">
                                 <div class="absolute inset-0 bg-gradient-to-t from-blue-100/50 to-transparent"></div>
                            </div>
                            <span class="text-[8px] font-black text-slate-400 mt-4 group-hover:text-blue-600 transition-colors uppercase">
                                P{{ bin.label }}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bento-card p-8 bg-white border border-slate-100 group hover:border-blue-100 transition-colors">
                        <div class="flex justify-between items-start mb-4">
                            <p class="label-muted text-[10px] uppercase font-black tracking-widest">Best 5K This Month</p>
                            <i data-lucide="award" class="w-4 h-4 text-slate-200 group-hover:text-blue-500 transition-colors"></i>
                        </div>
                        <h2 class="stat-value text-3xl text-slate-900 italic tracking-tighter">{{ best5kThisMonth }}</h2>
                    </div>

                    <div class="bento-card p-8 bg-white border border-slate-100 group hover:border-blue-100 transition-colors">
                        <div class="flex justify-between items-start mb-4">
                            <p class="label-muted text-[10px] uppercase font-black tracking-widest">Projected VO2 Max</p>
                            <i data-lucide="activity" class="w-4 h-4 text-slate-200 group-hover:text-blue-500 transition-colors"></i>
                        </div>
                        <h2 class="stat-value text-3xl text-blue-600 italic tracking-tighter">{{ projectedVO2Max }}</h2>
                        <p class="text-[8px] text-slate-400 mt-2 font-bold uppercase tracking-tighter italic">Berdasarkan ACSM Formula</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    data() {
        return {
            loading: false,
            predictions: [],
            paceHistogram: [],
            maxPaceCount: 1,
            best5kThisMonth: '--:--',
            projectedVO2Max: '--'
        };
    },
    mounted() {
        this.calculateAnalysis();
        if (window.lucide) window.lucide.createIcons();
    },
    methods: {
        async calculateAnalysis() {
            this.loading = true;
            try {
                const { data: runs, error } = await supabase
                    .from('activities')
                    .select('*')
                    .eq('type', 'Run')
                    .order('start_date', { ascending: false });

                if (error) throw error;
                if (!runs || runs.length === 0) return;

                // 1. Logic Histogram Pace
                this.generateHistogram(runs);

                // 2. Logic Best 5K All-Time (untuk Race Vision)
                const fiveKRuns = runs.filter(r => r.distance >= 4800 && r.distance <= 5500);
                if (fiveKRuns.length > 0) {
                    const bestAllTime = fiveKRuns.sort((a, b) => (a.moving_time / a.distance) - (b.moving_time / b.distance))[0];
                    this.updatePredictions(bestAllTime);
                    
                    // Hitung VO2 Max dari best effort ini
                    const velocity = (bestAllTime.distance / (bestAllTime.moving_time / 60)); 
                    this.projectedVO2Max = ((velocity * 0.2) + 3.5).toFixed(1);
                }

                // 3. Logic Best 5K Bulan Ini
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const monthly5K = fiveKRuns.filter(r => new Date(r.start_date) >= startOfMonth);
                
                if (monthly5K.length > 0) {
                    const bestMonth = monthly5K.sort((a, b) => a.moving_time - b.moving_time)[0];
                    this.best5kThisMonth = this.formatDuration(bestMonth.moving_time);
                }

            } catch (err) {
                console.error("Analysis Error:", err.message);
            } finally {
                this.loading = false;
                this.$nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
            }
        },

        generateHistogram(runs) {
            const bins = {};
            runs.forEach(run => {
                const paceInMinutes = (run.moving_time / 60) / (run.distance / 1000);
                const binLabel = Math.floor(paceInMinutes); // Grup per menit (Pace 4, Pace 5, Pace 6, dst)
                
                // Batasi range histogram agar rapi (misal pace 3 sampai 9)
                if (binLabel >= 3 && binLabel <= 9) {
                    bins[binLabel] = (bins[binLabel] || 0) + 1;
                }
            });

            const formattedBins = [];
            for (let i = 3; i <= 9; i++) {
                formattedBins.push({
                    label: i,
                    count: bins[i] || 0
                });
            }
            
            this.maxPaceCount = Math.max(...formattedBins.map(b => b.count), 1);
            this.paceHistogram = formattedBins;
        },

        updatePredictions(referenceRun) {
            const T1 = referenceRun.moving_time;
            const D1 = referenceRun.distance;
            const distances = [
                { key: '5K', dist: 5000 },
                { key: '10K', dist: 10000 },
                { key: '21K (Half)', dist: 21097 },
                { key: '42K (Full)', dist: 42195 }
            ];

            this.predictions = distances.map(target => {
                const T2 = T1 * Math.pow((target.dist / D1), 1.06);
                const paceSeconds = T2 / (target.dist / 1000);
                return {
                    name: target.key,
                    time: this.formatDuration(T2),
                    pace: this.formatPace(paceSeconds) + ' /km'
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
