export default `
<div class="dashboard-wrapper animate-in" :class="{ 'is-loading': isLoading }">
    <header class="dashboard-header">
        <div>
            <h1 class="text-display">Training Analytics</h1>
            <p class="text-caption mt-1">Deep dive into your performance</p>
        </div>
        
        <div class="filter-group">
            <select v-model="selectedType" class="select-clean" :disabled="isLoading">
                <option value="Run">Running</option>
                <option value="Ride">Cycling</option>
                <option value="Walk">Walking</option>
            </select>
            <select v-model="selectedPeriodKey" class="select-clean" :disabled="isLoading">
                <option value="total">All Time</option>
                <option value="2026">Year 2026</option>
                <option value="2026-03">March 2026</option>
            </select>
        </div>
    </header>

    <div class="bento-grid-summary">
        <div class="bento-card">
            <div class="card-header">
                <span class="label-muted">Total Distance</span>
                <div class="icon-box"><i data-lucide="map" class="w-4 h-4"></i></div>
            </div>
            <h2 class="stat-value text-2xl shimmer-text">
                {{ stats.totalDistance }} <span class="text-xs font-medium tracking-normal text-slate-400">km</span>
            </h2>
        </div>
        
        <div class="bento-card">
            <div class="card-header">
                <span class="label-muted">Total Elevation</span>
                <div class="icon-box"><i data-lucide="mountain" class="w-4 h-4"></i></div>
            </div>
            <h2 class="stat-value text-2xl shimmer-text">
                {{ stats.elevation }} <span class="text-xs font-medium tracking-normal text-slate-400">m</span>
            </h2>
        </div>

        <div class="bento-card">
            <div class="card-header">
                <span class="label-muted">Activities</span>
                <div class="icon-box"><i data-lucide="calendar" class="w-4 h-4"></i></div>
            </div>
            <h2 class="stat-value text-2xl shimmer-text">{{ stats.totalActivities }}</h2>
        </div>

        <div class="bento-card">
            <div class="card-header">
                <span class="label-muted">{{ performanceConfig.label }}</span>
                <div class="icon-box">
                    <i :data-lucide="performanceConfig.icon" class="w-4 h-4"></i>
                </div>
            </div>
            <h2 class="stat-value text-2xl shimmer-text">
                <template v-if="performanceConfig.showSteps">
                    {{ (stats.steps || 0).toLocaleString('id-ID') }}
                </template>
                <template v-else>
                    {{ stats.avgPace }}
                </template>
                <span class="text-xs font-medium tracking-normal text-slate-400 ml-0.5">
                    {{ performanceConfig.unit }}
                </span>
            </h2>
        </div>

        <div class="bento-card">
            <div class="card-header">
                <span class="label-muted">Calories</span>
                <div class="icon-box"><i data-lucide="flame" class="w-4 h-4"></i></div>
            </div>
            <h2 class="stat-value text-2xl shimmer-text">
                {{ (stats.calories || 0).toLocaleString('id-ID') }} <span class="text-xs font-medium tracking-normal text-slate-400">kcal</span>
            </h2>
        </div>
    </div>

    <div class="bento-grid-detailed">
        <div class="bento-card p-6">
             <h3 class="text-card-title mb-6">Performance Records</h3>
             <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-4 bg-slate-50 rounded-xl border border-slate-100 transition-all hover:bg-white hover:border-blue-100 group">
                    <p class="label-muted mb-1">Longest Activity</p>
                    <p class="stat-value text-xl text-slate-900 shimmer-text">
                        {{ stats.records?.longestDistance || '0.00' }} <span class="text-sm font-medium tracking-normal text-slate-400">km</span>
                    </p>
                </div>
                <div class="p-4 bg-slate-50 rounded-xl border border-slate-100 transition-all hover:bg-white hover:border-blue-100 group">
                    <p class="label-muted mb-1">
                        {{ selectedType === 'Ride' ? 'Top Speed' : 'Best Effort' }}
                    </p>
                    <p class="stat-value text-xl text-slate-900 shimmer-text">
                        {{ stats.records?.bestEffort || '--:--' }}
                        <span class="text-sm font-medium tracking-normal text-slate-400">
                             {{ performanceConfig.unit }}
                        </span>
                    </p>
                </div>
             </div>
        </div>

        <div class="bento-card p-6">
            <h3 class="text-card-title mb-6">Recent Log</h3>
            <div class="space-y-3">
                <template v-if="isLoading && stats.recentActivities.length === 0">
                    <div v-for="i in 3" class="activity-item shimmer-text opacity-50">
                        <div class="h-8 w-full"></div>
                    </div>
                </template>

                <template v-else>
                    <div v-for="act in stats.recentActivities" :key="act.id" class="activity-item">
                        <div class="flex items-center gap-3">
                            <div class="icon-box">
                                <i :data-lucide="act.type === 'Ride' ? 'zap' : 'footprints'" class="w-4 h-4"></i>
                            </div>
                            <div>
                                <p class="text-xs font-bold text-slate-900">{{ act.name }}</p>
                                <p class="label-muted !text-[8px] !tracking-widest">{{ act.date }}</p>
                            </div>
                        </div>
                        <span class="stat-value text-sm">{{ act.distance }} km</span>
                    </div>
                </template>
                
                <div v-if="!isLoading && stats.recentActivities.length === 0" class="text-center py-8">
                    <i data-lucide="database" class="w-8 h-8 text-slate-200 mx-auto mb-2"></i>
                    <p class="text-caption">No activities recorded for this period.</p>
                </div>
            </div>
        </div>
    </div>
</div>
`;
