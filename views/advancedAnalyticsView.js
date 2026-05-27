// advancedAnalyticsView.js
export default `
<div class="dashboard-wrapper animate-in" :class="{ 'is-loading': isLoading }">
    <!-- Header Seragam -->
    <header class="dashboard-header">
        <div>
            <h1 class="text-display">Advanced Analytics</h1>
            <p class="text-caption mt-1">Deep dive into custom biomechanics and efficiency models</p>
        </div>
        
        <div class="filter-group">
            <!-- Filter Mingguan Menggunakan view_weekly_performance_trend -->
            <select v-model="selectedWeeklyPeriod" class="select-clean" :disabled="isLoading">
                <option value="all">All Weeks</option>
                <option v-for="week in weeklyOptions" :key="week.value" :value="week.value">
                    {{ week.label }}
                </option>
            </select>
        </div>
    </header>

    <!-- Bento Grid Summary: Khusus Metrik Kalkulasi Tingkat Lanjut -->
    <div class="bento-grid-summary">
        <!-- 1. RPE Efficiency Index (Subjektif Pengganti HR) -->
        <div class="bento-card">
            <div class="card-header">
                <span class="label-muted">RPE Efficiency Index</span>
                <div class="icon-box"><i data-lucide="activity" class="w-4 h-4 text-emerald-500"></i></div>
            </div>
            <h2 class="stat-value text-2xl">
                {{ advStats.avgRpeEfficiency || '0.00' }}
            </h2>
            <p class="text-slate-400 uppercase tracking-tighter" style="font-size: 8px; font-weight: 800; margin-top: 4px;">
                Speed per RPE Unit
            </p>
        </div>
        
        <!-- 2. Propulsion Score (Mekanika Dorongan) -->
        <div class="bento-card">
            <div class="card-header">
                <span class="label-muted">Avg Propulsion Score</span>
                <div class="icon-box"><i data-lucide="zap" class="w-4 h-4 text-amber-500"></i></div>
            </div>
            <h2 class="stat-value text-2xl">
                {{ advStats.avgPropulsion || 0 }} <span class="text-xs font-medium text-slate-400">%</span>
            </h2>
            <p class="text-slate-400 uppercase tracking-tighter" style="font-size: 8px; font-weight: 800; margin-top: 4px;">
                Stride push efficiency
            </p>
        </div>

        <!-- 3. Step Density (Kerapatan Langkah) -->
        <div class="bento-card">
            <div class="card-header">
                <span class="label-muted">Steps Per Meter</span>
                <div class="icon-box"><i data-lucide="footprints" class="w-4 h-4"></i></div>
            </div>
            <h2 class="stat-value text-2xl">
                {{ advStats.stepsPerMeter || '0.00' }}
            </h2>
            <p class="text-slate-400 uppercase tracking-tighter" style="font-size: 8px; font-weight: 800; margin-top: 4px;">
                Step concentration
            </p>
        </div>

        <!-- 4. Fatigue Baseline (Dari debug_info JSON) -->
        <div class="bento-card">
            <div class="card-header">
                <span class="label-muted">Accumulated Fatigue</span>
                <div class="icon-box"><i data-lucide="brain-circuit" class="w-4 h-4 text-red-500"></i></div>
            </div>
            <h2 class="stat-value text-2xl">
                {{ advStats.fatigueScore || '0.00' }}
            </h2>
            <p class="text-slate-400 uppercase tracking-tighter" style="font-size: 8px; font-weight: 800; margin-top: 4px;">
                Algorithmic fatigue level
            </p>
        </div>
    </div>

    <!-- Detailed Section: Grafik Korelasi Mekanika Lari & Pemecah Kilometer -->
    <div class="bento-grid-detailed">
        <!-- Grafik 1: Tren Komparasi Cadence vs Stride Length (Meniru Sensor Garmin Pod) -->
        <div class="grid grid-cols-1 gap-6 mb-6">
            <AdvancedMekanikaChart 
                chartId="biomechanicsTrend"
                title="Running Dynamics: Cadence & Stride Length Trend"
                :labels="advTrendData.labels"
                :cadenceDataset="advTrendData.cadence"
                :strideDataset="advTrendData.stride"
            />
        </div>

        <!-- Grafik 2: Pemecah Kilometer (Unboxing Data Splits JSON) -->
        <div class="bento-card p-6 mb-6">
             <div class="flex items-center justify-between mb-6">
                 <h3 class="text-card-title">Pacing Strategy per Split Kilometer</h3>
                 <span class="px-2 py-1 bg-slate-100 rounded text-slate-600 uppercase font-black" style="font-size: 8px;">
                     From view_granular_splits_breakdown
                 </span>
             </div>
             <div class="grid grid-cols-1 gap-4">
                 <!-- Komponen Grafik Bar/Line internal untuk melihat fluktuasi pace per kilometer lari -->
                 <SplitsBreakdownChart 
                     :splits="selectedActivitySplits"
                 />
             </div>
        </div>

        <!-- Log Sesi Khusus: Memantau Gaya Lari Tanpa Alas Kaki (Barefoot / Nyeker) -->
        <div class="bento-card p-6">
            <h3 class="text-card-title mb-6">Barefoot Dynamics & Substantive Logs</h3>
            <div class="space-y-4">
                <template v-if="isLoading && advStats.recentAdvancedLogs.length === 0">
                    <div v-for="i in 3" class="h-16 bg-slate-50 rounded-2xl animate-pulse"></div>
                </template>

                <template v-else>
                    <div v-for="log in advStats.recentAdvancedLogs" :key="log.activity_id" 
                         class="flex items-center justify-between p-3 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50/50 transition-all cursor-pointer group">
                        
                        <div class="flex items-center gap-4 min-w-0">
                            <!-- Kondisi Icon Berubah jika ada kata 'nyeker' di nama aktivitas -->
                            <div class="icon-box group-hover:bg-white transition-all shadow-sm"
                                 :class="{ 'bg-emerald-50 text-emerald-600': log.name.toLowerCase().includes('nyeker') }">
                                <i :data-lucide="log.name.toLowerCase().includes('nyeker') ? 'leaf' : 'run'" class="w-4 h-4"></i>
                            </div>
                            <div class="min-w-0">
                                <p class="text-xs font-black text-slate-900 truncate">
                                    {{ log.name }} 
                                    <span v-if="log.name.toLowerCase().includes('nyeker')" class="ml-1 text-[8px] font-extrabold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">BAREFOOT</span>
                                </p>
                                <div class="flex items-center gap-2 mt-0.5">
                                    <span class="label-muted whitespace-nowrap" style="font-size: 8px;">{{ log.start_date_local }}</span>
                                    <span class="text-slate-200">•</span>
                                    <span class="label-muted truncate" style="font-size: 8px;">
                                        Stride Factor: <strong>{{ log.stride_factor_final }}</strong>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <!-- Sisi Kanan: Tampilkan Kontras Metrik Mekanika vs Kelelahan -->
                        <div class="flex items-center gap-6">
                            <div class="text-right hidden sm:block">
                                <p class="label-muted" style="font-size: 8px;">CADENCE / STRIDE</p>
                                <p class="stat-value text-xs text-slate-900">{{ log.cadence }} SPM / {{ log.stride_length }} cm</p>
                            </div>
                            
                            <div class="text-right px-2.5 py-1 bg-slate-100/50 rounded-xl border border-slate-200/40">
                                <p class="label-muted" style="font-size: 8px; font-weight: 800;">FATIGUE</p>
                                <p class="stat-value text-xs" :class="log.fatigue_score > 0.7 ? 'text-red-500' : 'text-slate-700'">
                                    {{ log.fatigue_score || '0.00' }}
                                </p>
                            </div>
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </div>
</div>
`;
