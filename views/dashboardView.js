export default `
<div class="dashboard-wrapper">
    <header class="mb-8">
        <span class="label-muted">Overview</span>
        <h1 class="text-display mt-1">Activity Insights</h1>
    </header>

    <div v-if="isLoading" class="flex items-center justify-center h-64">
        <div class="text-center">
            <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p class="text-caption mt-4 font-bold tracking-widest uppercase">Fetching Data...</p>
        </div>
    </div>

    <div v-else class="bento-grid animate-in">
        
        <div class="bento-item span-2-2 premium-card main-gradient">
            <div class="flex flex-col h-full justify-between">
                <div>
                    <span class="label-muted text-white/70">Total Distance</span>
                    <h2 class="stat-value text-white text-5xl mt-2">
                        {{ stats.totalDistance }} <span class="text-lg font-medium">km</span>
                    </h2>
                </div>
                <div class="mt-8 flex items-center gap-2 text-white/80">
                    <i data-lucide="trending-up" class="w-4 h-4 text-white"></i>
                    <span class="text-sm font-semibold">Updated just now</span>
                </div>
            </div>
        </div>

        <div class="bento-item premium-card">
            <span class="label-muted">Average Pace</span>
            <div class="mt-4 flex items-baseline gap-1">
                <h2 class="stat-value text-3xl">{{ stats.avgPace }}</h2>
                <span class="text-muted font-bold text-xs">/km</span>
            </div>
            <div class="mt-auto pt-4">
                <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-600" style="width: 75%"></div>
                </div>
            </div>
        </div>

        <div class="bento-item premium-card">
            <span class="label-muted">Heart Rate</span>
            <div class="mt-4 flex items-center gap-3">
                <h2 class="stat-value text-3xl text-red-500">{{ stats.heartRate }}</h2>
                <i data-lucide="heart" class="w-6 h-6 text-red-500 animate-pulse"></i>
            </div>
            <p class="text-caption mt-2">Zone 3: Aerobic</p>
        </div>

        <div class="bento-item span-2-1 premium-card overflow-hidden">
            <div class="flex justify-between items-center mb-6">
                <span class="label-muted">Recent Runs</span>
                <i data-lucide="calendar" class="w-4 h-4 text-muted"></i>
            </div>
            <div class="activity-list space-y-4">
                <div v-for="(act, index) in stats.recentActivities" :key="index" 
                     class="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100">
                    <div class="w-11 h-11 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                        <i data-lucide="play" class="w-5 h-5 fill-current"></i>
                    </div>
                    <div class="flex-1">
                        <p class="text-sm font-bold">{{ act.name || 'Untitled Run' }}</p>
                        <p class="text-caption">{{ act.date }}</p>
                    </div>
                    <p class="text-sm font-black tracking-tight text-right">{{ act.distance }} km</p>
                </div>
            </div>
        </div>

    </div>
</div>
`;
