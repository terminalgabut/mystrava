export default `
<div class="dashboard-wrapper animate-in">
    <header class="dashboard-header">
        <div>
            <h1 class="text-display">Training Analytics</h1>
            <p class="text-caption mt-1">Deep dive into your performance</p>
        </div>
        
        <div class="filter-group">
            <select v-model="selectedType" class="select-clean">
                <option value="Run">Running</option>
                <option value="Ride">Cycling</option>
                <option value="Walk">Walking</option>
            </select>
            <select v-model="selectedPeriodKey" class="select-clean">
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
            <h2 class="stat-value text-2xl">
                {{ stats.totalDistance }} <span class="text-xs font-medium tracking-normal text-slate-400">km</span>
            </h2>
        </div>
        
        <div class="bento-card">
            <div class="card-header">
                <span class="label-muted">Total Elevation</span>
                <div class="icon-box"><i data-lucide="mountain" class="w-4 h-4"></i></div>
            </div>
            <h2 class="stat-value text-2xl">
                {{ stats.elevation }} <span class="text-xs font-medium tracking-normal text-slate-400">m</span>
            </h2>
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
                <span class="label-muted">Avg Pace</span>
                <div class="icon-box"><i data-lucide="timer" class="w-4 h-4"></i></div>
            </div>
            <h2 class="stat-value text-2xl">{{ stats.avgPace }}</h2>
        </div>

        <div class="bento-card">
            <div class="card-header">
                <span class="label-muted">Calories</span>
                <div class="icon-box"><i data-lucide="flame" class="w-4 h-4"></i></div>
            </div>
            <h2 class="stat-value text-2xl">
                {{ stats.calories.toLocaleString() }} <span class="text-xs font-medium tracking-normal text-slate-400">kcal</span>
            </h2>
        </div>
    </div>

    <div class="bento-grid-detailed">
        <div class="bento-card p-6">
             <h3 class="text-card-title mb-6">Performance Records</h3>
             <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-4 bg-slate-50 rounded-xl border border-slate-100 transition-all hover:bg-white hover:border-blue-100 group">
                    <p class="label-muted mb-1">Longest Activity</p>
                    <p class="stat-value text-xl text-slate-900">-- <span class="text-sm font-medium">km</span></p>
                </div>
                <div class="p-4 bg-slate-50 rounded-xl border border-slate-100 transition-all hover:bg-white hover:border-blue-100 group">
                    <p class="label-muted mb-1">Best Effort (10K)</p>
                    <p class="stat-value text-xl text-slate-900">--:--</p>
                </div>
             </div>
        </div>

        <div class="bento-card p-6">
            <h3 class="text-card-title mb-6">Recent Log</h3>
            <div class="space-y-3">
                <div v-for="act in stats.recentActivities" class="activity-item">
                    <div class="flex items-center gap-3">
                        <div class="icon-box">
                            <i data-lucide="footprints" class="w-4 h-4"></i>
                        </div>
                        <div>
                            <p class="text-xs font-bold text-slate-900">{{ act.name }}</p>
                            <p class="label-muted !text-[8px] !tracking-widest">{{ act.date }}</p>
                        </div>
                    </div>
                    <span class="stat-value text-sm">{{ act.distance }} km</span>
                </div>
                
                <p v-if="stats.recentActivities.length === 0" class="text-caption text-center py-4">
                    No activities recorded.
                </p>
            </div>
        </div>
    </div>
</div>
`;
