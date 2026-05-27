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
                <i data-lucide="shield-check" class="w-3 h-3 inline mr-1"></i> Running Mode Only
            </span>
        </div>
    </header>

    <!-- Bento Grid Summary: Sport Science Engine -->
    <div class="bento-grid-summary">
        <!-- 1. METRIK BARU: VO2 Max Estimate -->
        <div class="bento-card">
            <div class="card-header">
                <span class="label-muted">Aerobic Capacity (VO2 Max)</span>
                <div class="icon-box"><i data-lucide="wind" class="w-4 h-4 text-blue-500"></i></div>
            </div>
            <h2 class="stat-value text-3xl font-black text-blue-600">
                {{ sciStats.currentVo2Max }} <span class="text-xs font-bold text-slate-400">mL/kg/min</span>
            </h2>
            <p class="text-slate-400 uppercase tracking-tighter" style="font-size: 8px; font-weight: 800; margin-top: 4px;">
                Velocity-based estimate
            </p>
        </div>
        
        <!-- 2. METRIK BARU: ACR Workload Ratio -->
        <div class="bento-card">
            <div class="card-header">
                <span class="label-muted">Acute:Chronic Workload (ACR)</span>
                <div class="icon-box"><i data-lucide="scale" class="w-4 h-4 text-purple-500"></i></div>
            </div>
            <h2 class="stat-value text-3xl font-black text-purple-600">
                {{ sciStats.acrRatio }}
            </h2>
            <div class="mt-1 px-2 py-0.5 rounded border inline-block text-[8px] font-black uppercase tracking-wider" :class="sciStats.acrClass">
                {{ sciStats.acrZone }}
            </div>
        </div>

        <!-- 3. Propulsion Score Sesi Terakhir -->
        <div class="bento-card">
            <div class="card-header">
                <span class="label-muted">Latest Propulsion Efficiency</span>
                <div class="icon-box"><i data-lucide="zap" class="w-4 h-4 text-amber-500"></i></div>
            </div>
            <h2 class="stat-value text-2xl">
                {{ sciStats.latestPropulsion }} <span class="text-xs font-medium text-slate-400">%</span>
            </h2>
            <p class="text-slate-400 uppercase tracking-tighter" style="font-size: 8px; font-weight: 800; margin-top: 4px;">
                True push-off force ratio
            </p>
        </div>

        <!-- 4. Kerapatan Langkah (Barefoot Metric Indicator) -->
        <div class="bento-card">
            <div class="card-header">
                <span class="label-muted">Barefoot Step Density</span>
                <div class="icon-box"><i data-lucide="footprints" class="w-4 h-4 text-emerald-500"></i></div>
            </div>
            <h2 class="stat-value text-2xl">
                {{ sciStats.latestStepsPerMeter }} <span class="text-xs font-medium text-slate-400">steps/m</span>
            </h2>
            <p class="text-slate-400 uppercase tracking-tighter" style="font-size: 8px; font-weight: 800; margin-top: 4px;">
                Ground contact cadence map
            </p>
        </div>
    </div>

    <!-- Charts & Advanced Status Section -->
    <div class="bento-grid-detailed">
        <div class="grid grid-cols-1 gap-6 mb-6">
            <AdvancedMekanikaChart 
                chartId="biomechanicsTrend"
                title="Running Dynamics: Cadence & Stride Length Execution"
                :labels="chartData.labels"
                :cadenceDataset="chartData.cadence"
                :strideDataset="chartData.stride"
            />
        </div>

        <!-- STRATEGI BARU REFACTOR: EDUKASI ACUAN DIAGNOSIS SPORT SCIENCE (MENGGANTIKAN RECENT LOG) -->
        <div class="bento-card p-6 border-l-4 border-l-purple-500 bg-white">
            <h3 class="text-card-title text-purple-900 mb-3 flex items-center gap-2">
                <i data-lucide="activity-square" class="w-5 h-5 text-purple-600"></i>
                Sport Science Diagnostics: Injury Prevention Guide
            </h3>
            <p class="text-slate-600 text-sm leading-relaxed mb-4">
                Sistem mendeteksi rasio kelelahan akut latihan kamu menggunakan formula <strong>ACR (Foster Load)</strong>. Ini membandingkan akumulasi stressor fisik 7 hari terakhir dengan fondasi kebugaran 28 hari terakhir kamu untuk menghindari bahaya cedera jaringan lunak atau tendon kaki akibat lari tanpa alas kaki (*barefoot*).
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div class="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Under-training (&lt; 0.8)</p>
                    <p class="text-xs text-slate-600 font-medium mt-1">Beban kurang, kapasitas kebugaran tubuh berisiko menurun.</p>
                </div>
                <div class="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <p class="text-[10px] font-black text-emerald-700 uppercase tracking-wider">The Sweet Spot (0.8 - 1.3)</p>
                    <p class="text-xs text-emerald-800 font-semibold mt-1">Zona latihan paling aman untuk memicu adaptasi paru & otot.</p>
                </div>
                <div class="p-3 bg-red-50 border border-red-100 rounded-xl">
                    <p class="text-[10px] font-black text-red-700 uppercase tracking-wider">Danger Zone (&gt; 1.5)</p>
                    <p class="text-xs text-red-800 font-semibold mt-1">Risiko cedera meningkat 4x lipat. Kurangi volume lari segera!</p>
                </div>
            </div>
        </div>
    </div>
</div>
`;
