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
                    <div class="h-48 flex items-end justify-between gap-1 md:gap-2 px-2 border-b border-slate-50 pb-2">
    <div v-for="bin in paceHistogram" :key="bin.label" 
         class="flex-1 h-full group relative flex flex-col items-center justify-end">
        
        <div class="absolute -top-10 bg-slate-800 text-white text-[9px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-xl">
            {{ bin.count }} Activities (P{{ bin.label }})
        </div>

        <div class="w-full h-full flex items-end px-[1px]"> 
            <div class="w-full bg-blue-500 rounded-t-sm transition-all duration-700 ease-out group-hover:bg-blue-600 relative overflow-hidden"
                 :style="{ 
                    height: (bin.count / maxPaceCount * 100) + '%',
                    minHeight: bin.count > 0 ? '4px' : '0px' 
                 }">
            </div>
        </div>

        <span class="text-[7px] md:text-[9px] font-black text-slate-400 mt-4 group-hover:text-blue-600 transition-colors">
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

                    <div class="bento-card p-8 bg-white border border-slate-100 mt-8 group">
    <div class="flex justify-between items-center mb-6">
        <div>
            <p class="label-muted text-[10px] uppercase font-black tracking-widest">Weekly Goal Progress</p>
            <div class="flex items-center gap-2 mt-1">
                <h3 class="text-xl font-black italic text-slate-900">{{ weeklyStats.thisWeek }}</h3>
                <span class="text-slate-400 text-xs font-normal">/</span>
                <input type="number" 
                       v-model.number="weeklyStats.goal" 
                       @input="recalculatePercent"
                       class="w-12 bg-transparent border-b border-slate-100 focus:border-blue-500 focus:outline-none text-sm font-bold text-slate-500 transition-colors">
                <span class="text-[10px] font-bold text-slate-400 uppercase">KM</span>
            </div>
        </div>
        <div class="text-right">
            <span :class="weeklyStats.trend >= 0 ? 'text-emerald-500' : 'text-rose-500'" 
      class="text-[10px] font-black italic">
    {{ weeklyStats.trend >= 0 ? '↑' : '↓' }} {{ Math.abs(weeklyStats.trend) }}%
</span>
            <p class="text-[8px] text-slate-400 uppercase font-bold">vs Last Week</p>
        </div>
    </div>

    <div class="w-full h-3 bg-slate-50 rounded-full overflow-hidden relative border border-slate-100">
        <div class="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out relative z-10"
             :style="{ width: weeklyStats.percent + '%' }">
             <div class="absolute inset-0 bg-white/20 animate-pulse"></div>
        </div>
        <div class="absolute inset-0 flex justify-between px-2 items-center pointer-events-none">
            <div v-for="i in 4" :key="i" class="w-[1px] h-1 bg-slate-200"></div>
        </div>
    </div>

    <div class="flex justify-between mt-4">
        <p class="text-[9px] text-slate-400 font-bold uppercase italic">
            {{ weeklyStats.percent }}% Achieved
        </p>
        <p class="text-[9px] text-slate-500 font-bold uppercase">
            {{ Math.max(0, (weeklyStats.goal - weeklyStats.thisWeek)).toFixed(1) }} KM Left
        </p>
    </div>
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
            projectedVO2Max: '--',
            weeklyStats: {
            thisWeek: 0,
            lastWeek: 0,
            goal: localStorage.getItem('running_goal') ? parseFloat(localStorage.getItem('running_goal')) : 25,
            percent: 0,
            trend: 0
            }
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

                // Tambahkan potongan kode ini di dalam try { ... } fungsi calculateAnalysis()
                const dayOfWeek = now.getDay() || 7; // 1 (Senin) - 7 (Minggu)
                // 1. Tentukan batas waktu
                const startOfThisWeek = new Date(now);
startOfThisWeek.setHours(0,0,0,0);
startOfThisWeek.setDate(now.getDate() - (dayOfWeek - 1));

const startOfLastWeek = new Date(startOfThisWeek);
startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

// 2. Filter lari per minggu
const runsThisWeek = runs.filter(r => new Date(r.start_date) >= startOfThisWeek);
const runsLastWeek = runs.filter(r => {
    const d = new Date(r.start_date);
    return d >= startOfLastWeek && d < startOfThisWeek;
});

// 3. Hitung total jarak (KM)
const distThisWeek = runsThisWeek.reduce((acc, r) => acc + r.distance, 0) / 1000;
const distLastWeek = runsLastWeek.reduce((acc, r) => acc + r.distance, 0) / 1000;

// 4. Update state (Gunakan .toFixed(1) agar akurat seperti bubble hijau)
this.weeklyStats.thisWeek = distThisWeek.toFixed(1);
this.weeklyStats.lastWeek = distLastWeek.toFixed(1);

// Ubah toFixed(0) menjadi toFixed(1) di sini
this.weeklyStats.trend = distLastWeek > 0 
    ? parseFloat((((distThisWeek - distLastWeek) / distLastWeek) * 100).toFixed(1)) 
    : 0;

// Hitung percent berdasarkan goal
this.recalculatePercent();

            } catch (err) {
                console.error("Analysis Error:", err.message);
            } finally {
                this.loading = false;
                this.$nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
            }
        },

        generateHistogram(runs) {
    const bins = {};
    let minPace = 99;
    let maxPace = 0;

    runs.forEach(run => {
        // Hitung pace per km (menit)
        const paceInMinutes = (run.moving_time / 60) / (run.distance / 1000);
        const binLabel = Math.floor(paceInMinutes);

        // Abaikan data anomali (misal pace di bawah 2 atau di atas 20)
        if (binLabel >= 2 && binLabel <= 20) {
            bins[binLabel] = (bins[binLabel] || 0) + 1;
            
            // Update range dinamis
            if (binLabel < minPace) minPace = binLabel;
            if (binLabel > maxPace) maxPace = binLabel;
        }
    });

    // Jika tidak ada data, gunakan default 4-9
    if (maxPace === 0) { minPace = 4; maxPace = 9; }

    const formattedBins = [];
    // Loop dari pace tercepat sampai terlambat yang ADA di data kamu
    for (let i = minPace; i <= maxPace; i++) {
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
        },
        
        recalculatePercent() {
    const target = this.weeklyStats.goal || 1;
    this.weeklyStats.percent = Math.min((this.weeklyStats.thisWeek / target) * 100, 100).toFixed(0);
    
    // SIMPAN KE LOCAL STORAGE
    localStorage.setItem('running_goal', target);
}
    }
};
