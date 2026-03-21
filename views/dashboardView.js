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
                <option v-for="opt in periodOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                </option>
            </select>
        </div>
    </header>

    <div class="bento-grid-summary">
        <div class="bento-card">
            <div class="card-header">
                <span class="label-muted">Total Distance</span>
                <div class="icon-box"><i data-lucide="map" class="w-4 h-4"></i></div>
            </div>
            <h2 class="stat-value text-2xl">
                {{ stats.totalDistance }} <span class="text-xs font-medium tracking-normal text-slate-400">km</span>
            </h2>
        </div>

        <div class="bento-card">
            <div class="card-header">
                <span class="label-muted">Total Time (Elapsed)</span>
                <div class="icon-box"><i data-lucide="timer" class="w-4 h-4"></i></div>
            </div>
            <h2 class="stat-value text-2xl">
                {{ stats.totalDuration || '00:00' }}
            </h2>
            <p class="text-slate-400 mt-1 uppercase tracking-tighter" style="font-size: 9px; font-weight: 700;">
                Incl. pauses & rest
            </p>
        </div>

        <div class="bento-card">
            <div class="card-header">
                <span class="label-muted">Activities</span>
                <div class="icon-box"><i data-lucide="calendar" class="w-4 h-4"></i></div>
            </div>
            <h2 class="stat-value text-2xl">{{ stats.totalActivities }}</h2>
        </div>

        <div class="bento-card">
            <div class="card-header">
                <span class="label-muted">{{ performanceConfig.label }}</span>
                <div class="icon-box">
                    <i :data-lucide="performanceConfig.icon" class="w-4 h-4"></i>
                </div>
            </div>
            <h2 class="stat-value text-2xl">
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
            <h2 class="stat-value text-2xl">
                {{ (stats.calories || 0).toLocaleString('id-ID') }} <span class="text-xs font-medium tracking-normal text-slate-400">kcal</span>
            </h2>
        </div>
    </div>

    <div class="bento-grid-detailed">
        <div class="bento-card p-6">
             <h3 class="text-card-title mb-6">Performance Records</h3>
             <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-4 bg-slate-50 rounded-xl border border-slate-100 transition-all hover:bg-white hover:border-blue-100">
                    <p class="label-muted mb-1">Longest Activity</p>
                    <p class="stat-value text-xl text-slate-900">
                        {{ stats.records?.longestDistance || '0.00' }} <span class="text-sm font-medium tracking-normal text-slate-400">km</span>
                    </p>
                </div>
                <div class="p-4 bg-slate-50 rounded-xl border border-slate-100 transition-all hover:bg-white hover:border-blue-100">
                    <p class="label-muted mb-1">
                        {{ selectedType === 'Ride' ? 'Top Speed' : 'Best Effort' }}
                    </p>
                    <p class="stat-value text-xl text-slate-900">
                        {{ stats.records?.bestEffort || '--:--' }}
                        <span class="text-sm font-medium tracking-normal text-slate-400">
                             {{ performanceConfig.unit }}
                        </span>
                    </p>
                </div>
             </div>
        </div>

        <div class="flex flex-col lg:grid gap-6 mb-6" :class="trendData.comparisonDatasets.length > 0 ? 'lg:grid-cols-2' : 'lg:grid-cols-1'">
            <PaceChart 
                chartId="monthlyPace"
                :title="selectedType === 'Ride' ? 'Average Speed per Month' : 'Average Pace per Month'"
                :labels="trendData.labels"
                :datasets="trendData.paceDatasets"
                :unit="selectedType === 'Ride' ? ' km/h' : ' /km'"
            />
            <PaceChart 
                v-if="trendData.comparisonDatasets.length > 0"
                chartId="trailVsRoad"
                title="Trail vs Road Comparison"
                :labels="trendData.labels"
                :datasets="trendData.comparisonDatasets"
                :unit="' /km'"
            />
        </div>

        <div class="bento-card p-6">
            <h3 class="text-card-title mb-6">Recent Log</h3>
            <div class="space-y-4">
                <template v-if="isLoading && stats.recentActivities.length === 0">
                    <div v-for="i in 3" class="activity-item shimmer-text opacity-50 h-16 bg-slate-50 rounded-2xl"></div>
                </template>

                <template v-else>
                    <div v-for="act in stats.recentActivities" :key="act.id" 
                         @click="$router.push('/activity/' + act.id)"
                         class="flex items-center justify-between p-3 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50/50 transition-all cursor-pointer group">
                        
                        <div class="flex items-center gap-4 min-w-0">
                            <div class="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                                <i :data-lucide="act.type === 'Ride' ? 'zap' : 'footprints'" class="w-5 h-5 text-slate-600"></i>
                            </div>
                            <div class="min-w-0">
                                <p class="text-xs font-black text-slate-900 truncate">{{ act.name }}</p>
                                <div class="flex items-center gap-2 mt-0.5">
                                    <span class="label-muted whitespace-nowrap" style="font-size: 9px; letter-spacing: 0.05em;">{{ act.date }}</span>
                                    <span class="text-slate-200">•</span>
                                    <span class="label-muted truncate max-w-[120px] md:max-w-[200px]" style="font-size: 9px;">
                                        <i data-lucide="map-pin" class="w-2.5 h-2.5 inline mr-0.5"></i>
                                        {{ act.location_name || 'Global Area' }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="flex items-center gap-4">
                            <div v-if="act.weather_temp" class="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-lg border border-amber-100/50">
                                <i data-lucide="sun" class="w-3 h-3 text-amber-500"></i>
                                <span class="text-[10px] font-black text-amber-700">{{ act.weather_temp }}°</span>
                            </div>
                            
                            <div class="text-right">
                                <p class="stat-value text-sm text-slate-900">{{ act.distance }} km</p>
                                <p class="text-slate-400 uppercase tracking-tighter" style="font-size: 9px; font-weight: 700;">
                                    {{ formatTime(act.moving_time) }}
                                </p>
                            </div>
                        </div>
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
