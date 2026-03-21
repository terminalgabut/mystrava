export default `
<div class="dashboard-wrapper animate-in">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
            <h1 class="text-2xl font-black tracking-tight text-slate-900">Training Analytics</h1>
            <p class="text-slate-500 text-sm font-medium">Deep dive into your performance</p>
        </div>
        
        <div class="flex items-center gap-2">
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
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div class="bento-card-white">
            <div class="flex justify-between text-slate-400">
                <span class="text-[10px] font-bold uppercase tracking-wider">Total Distance</span>
                <i data-lucide="map" class="w-3.5 h-3.5"></i>
            </div>
            <h2 class="text-xl font-black text-slate-900 mt-2">{{ stats.totalDistance }} <span class="text-xs font-medium">km</span></h2>
        </div>
        
        <div class="bento-card-white">
            <div class="flex justify-between text-slate-400">
                <span class="text-[10px] font-bold uppercase tracking-wider">Total Elevation</span>
                <i data-lucide="mountain" class="w-3.5 h-3.5"></i>
            </div>
            <h2 class="text-xl font-black text-slate-900 mt-2">{{ stats.elevation }} <span class="text-xs font-medium">m</span></h2>
        </div>

        <div class="bento-card-white">
            <div class="flex justify-between text-slate-400">
                <span class="text-[10px] font-bold uppercase tracking-wider">Activities</span>
                <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
            </div>
            <h2 class="text-xl font-black text-slate-900 mt-2">{{ stats.totalActivities }}</h2>
        </div>

        <div class="bento-card-white">
            <div class="flex justify-between text-slate-400">
                <span class="text-[10px] font-bold uppercase tracking-wider">Avg Pace</span>
                <i data-lucide="timer" class="w-3.5 h-3.5"></i>
            </div>
            <h2 class="text-xl font-black text-slate-900 mt-2">{{ stats.avgPace }}</h2>
        </div>

        <div class="bento-card-white">
            <div class="flex justify-between text-slate-400">
                <span class="text-[10px] font-bold uppercase tracking-wider">Calories</span>
                <i data-lucide="flame" class="w-3.5 h-3.5"></i>
            </div>
            <h2 class="text-xl font-black text-slate-900 mt-2">{{ stats.calories.toLocaleString() }} <span class="text-xs font-medium">kcal</span></h2>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 bento-card-white p-6">
             <h3 class="text-sm font-bold text-slate-900 mb-4">Performance Records</h3>
             <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p class="text-[10px] font-bold text-slate-500 uppercase">Longest Activity</p>
                    <p class="text-lg font-black text-slate-900">-- km</p>
                </div>
                <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p class="text-[10px] font-bold text-slate-500 uppercase">Best Effort</p>
                    <p class="text-lg font-black text-slate-900">--:--</p>
                </div>
             </div>
        </div>

        <div class="bento-card-white p-6">
            <h3 class="text-sm font-bold text-slate-900 mb-4">Recent Log</h3>
            <div class="space-y-4">
                <div v-for="act in stats.recentActivities" class="flex items-center justify-between group">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <i data-lucide="footprints" class="w-4 h-4"></i>
                        </div>
                        <div>
                            <p class="text-xs font-bold text-slate-900">{{ act.name }}</p>
                            <p class="text-[10px] text-slate-400 uppercase font-medium">{{ act.date }}</p>
                        </div>
                    </div>
                    <span class="text-xs font-black text-slate-900">{{ act.distance }} km</span>
                </div>
            </div>
        </div>
    </div>
</div>
`;
