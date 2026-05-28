// advancedAnalyticsView.js
export default `
<div class="dashboard-wrapper animate-in" :class="{ 'is-loading': isLoading }">
    <header class="dashboard-header">
        <div>
            <h1 class="text-display">Biomechanical & Sport Science Lab</h1>
            <p class="text-caption mt-1">Advanced metrics engineered exclusively for running performance</p>
        </div>
        <div class="filter-group">
            <span class="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-full font-black text-[10px] tracking-wider uppercase">
                <i data-lucide="shield-check" class="w-3 h-3 inline mr-1"></i> Run & Hike Mode Only
            </span>
        </div>
    </header>

    <div class="bento-grid-summary grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bento-card p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div class="card-header flex justify-between items-center mb-2">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Aerobic Capacity</span>
                <div class="icon-box p-1.5 bg-blue-50 rounded-lg">
                    <i data-lucide="wind" class="w-4 h-4 text-blue-500"></i>
                </div>
            </div>
            <h2 class="stat-value text-3xl font-black text-blue-600">
                {{ sciStats.currentVo2Max }} <span class="text-xs font-bold text-slate-400">mL/kg/min</span>
            </h2>
            <p class="text-xs text-slate-500 mt-1">Rata-rata kestabilan dari 3 sesi lari terakhir.</p>
        </div>

        <div class="bento-card p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div class="card-header flex justify-between items-center mb-2">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Acute:Chronic Ratio</span>
                <div class="icon-box p-1.5 bg-emerald-50 rounded-lg">
                    <i data-lucide="activity" class="w-4 h-4 text-emerald-500"></i>
                </div>
            </div>
            <h2 class="stat-value text-3xl font-black text-slate-700">
                {{ sciStats.acrRatio }} 
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border border-opacity-40 inline-block align-middle ml-1" :class="sciStats.acrClass">
                    {{ sciStats.acrZone }}
                </span>
            </h2>
            <p class="text-xs text-slate-500 mt-1">Rasio stressor 7 hari vs 28 hari fondasi fisik.</p>
        </div>

        <div class="bento-card p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div class="card-header flex justify-between items-center mb-2">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Latest Dynamics</span>
                <div class="icon-box p-1.5 bg-purple-50 rounded-lg">
                    <i data-lucide="gauge" class="w-4 h-4 text-purple-500"></i>
                </div>
            </div>
            <h2 class="stat-value text-xl font-black text-slate-800">
                {{ sciStats.latestCadence }} <span class="text-xs font-bold text-slate-400">SPM</span>
                <span class="text-slate-300 mx-1">/</span>
                {{ sciStats.latestStride }} <span class="text-xs font-bold text-slate-400">cm</span>
            </h2>
            <p class="text-xs text-slate-500 mt-1.5">Teknik langkah efisien dari aktivitas terakhir.</p>
        </div>

        <div class="bento-card p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div class="card-header flex justify-between items-center mb-2">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Propulsion Engine</span>
                <div class="icon-box p-1.5 bg-amber-50 rounded-lg">
                    <i data-lucide="zap" class="w-4 h-4 text-amber-500"></i>
                </div>
            </div>
            <h2 class="stat-value text-3xl font-black text-amber-600">
                {{ sciStats.latestPropulsion }} <span class="text-xs font-bold text-slate-400">Score</span>
            </h2>
            <p class="text-xs text-slate-500 mt-1">Rasio dorongan mekanis vertikal vs matriks langkah.</p>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div class="lg:col-span-2 flex flex-col gap-6">
            <div class="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <advanced-mekanika-chart 
                    :labels="biomechanicsChartData.labels"
                    :cadence-dataset="biomechanicsChartData.cadence"
                    :stride-dataset="biomechanicsChartData.stride">
                </advanced-mekanika-chart>
            </div>

            <div class="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h3 class="text-base font-black text-slate-800">Latest Sesi Splits Breakdown</h3>
                        <p class="text-[11px] text-slate-400 mt-0.5">Analisis distribusi pace granular per kilometer</p>
                    </div>
                    <span class="text-[10px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded font-mono text-slate-500">
                        view_granular_splits_breakdown
                    </span>
                </div>
                <splits-breakdown-chart :splits="splitsData"></splits-breakdown-chart>
            </div>
        </div>

        <div class="flex flex-col gap-6">
            <div class="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-base font-black text-slate-800">Weekly Workload Trend</h3>
                    <i data-lucide="bar-chart-3" class="w-4 h-4 text-slate-400"></i>
                </div>
                
                <div class="w-full h-[180px] flex items-end gap-2 pt-2">
                    <div v-for="(wl, index) in weeklyWorkloadData.workloads" :key=\"index\" class="flex-1 flex flex-col items-center gap-1.5">
                        <div class="w-full bg-blue-500 bg-opacity-80 rounded-t-sm hover:bg-opacity-100 transition-all" 
                             :style="{ height: (wl / Math.max(...weeklyWorkloadData.workloads) * 120) + 'px' }"></div>
                        <span class="text-[9px] font-bold text-slate-400 uppercase">{{ weeklyWorkloadData.labels[index] }}</span>
                    </div>
                    <div v-if="weeklyWorkloadData.workloads.length === 0" class="w-full h-full flex items-center justify-center text-xs text-slate-400">
                        Tidak ada data mingguan
                    </div>
                </div>
            </div>

            <div class="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-950 rounded-2xl p-5 text-white shadow-md">
                <div class="flex items-center gap-2 mb-3">
                    <i data-lucide="info" class="w-4 h-4 text-blue-400"></i>
                    <h4 class="text-xs font-black uppercase tracking-wider text-blue-400">Sport Science Lab Note</h4>
                </div>
                <p class="text-xs leading-relaxed text-slate-300">
                    Kalkulasi beban latihan ini dikunci menggunakan formula <strong>ACR (Foster Session Workload)</strong>. 
                    Dengan membandingkan stressor akut (7 hari terakhir) dengan kronis (28 hari terakhir), sistem memastikan 
                    langkah lari tokomu terhindar dari bahaya cedera jaringan lunak (*injury risk prevention*) demi proteksi 
                    sendi pergelangan kaki (*ankle armor*).
                </p>
            </div>
        </div>
    </div>
</div>
`;
