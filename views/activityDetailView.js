export default `
<div class="activity-detail-wrapper animate-in pb-12">
    <header class="flex items-center gap-4 mb-8">
        <button @click="$router.back()" class="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-95">
            <i data-lucide="arrow-left" class="w-5 h-5 text-slate-600"></i>
        </button>
        <div>
            <h1 class="text-2xl font-black text-slate-900 tracking-tight">{{ activity?.name || 'Loading...' }}</h1>
            <p class="text-slate-500 text-xs font-medium">{{ formatDate(activity?.start_date) }} • {{ activity?.type }}</p>
        </div>
    </header>

    <div v-if="loading" class="space-y-6">
        <div class="h-64 w-full bg-slate-100 rounded-3xl animate-pulse"></div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div v-for="i in 4" class="h-24 bg-slate-50 rounded-2xl animate-pulse"></div>
        </div>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
            <div class="bg-white p-2 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden h-[400px] relative">
                <div id="map" class="w-full h-full rounded-[2rem] z-10"></div>
                <div v-if="!hasRoute" class="absolute inset-0 flex items-center justify-center bg-slate-50/50 backdrop-blur-sm z-20">
                    <p class="text-slate-400 text-sm font-medium">Rute tidak tersedia untuk aktivitas ini</p>
                </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Distance</p>
                    <p class="text-xl font-black text-slate-900">{{ (activity.distance / 1000).toFixed(2) }} <span class="text-xs text-slate-400">km</span></p>
                </div>
                <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{{ activity.type === 'Ride' ? 'Avg Speed' : 'Avg Pace' }}</p>
                    <p class="text-xl font-black text-slate-900">{{ performanceValue }} <span class="text-xs text-slate-400">{{ activity.type === 'Ride' ? 'km/h' : '/km' }}</span></p>
                </div>
                <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Elevation</p>
                    <p class="text-xl font-black text-slate-900">{{ Math.round(activity.total_elevation_gain) }} <span class="text-xs text-slate-400">m</span></p>
                </div>
                <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm" v-if="activity.type === 'Walk'">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Steps</p>
                    <p class="text-xl font-black text-slate-900">{{ calculateSteps(activity.distance).toLocaleString('id-ID') }}</p>
                </div>
                <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm" v-else>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Calories</p>
                    <p class="text-xl font-black text-slate-900">{{ Math.round(activity.calories || 0) }} <span class="text-xs text-slate-400">kcal</span></p>
                </div>
            </div>
        </div>

        <div class="space-y-6">
            <div class="bg-slate-900 p-6 rounded-[2.5rem] text-white">
                <h3 class="font-black text-lg mb-4">Time Analysis</h3>
                <div class="space-y-4">
                    <div class="flex justify-between items-end border-b border-white/10 pb-2">
                        <span class="text-white/50 text-[10px] font-bold uppercase tracking-widest">Moving Time</span>
                        <span class="text-lg font-black">{{ formatTime(activity.moving_time) }}</span>
                    </div>
                    <div class="flex justify-between items-end border-b border-white/10 pb-2">
                        <span class="text-white/50 text-[10px] font-bold uppercase tracking-widest">Elapsed Time</span>
                        <span class="text-lg font-black">{{ formatTime(activity.elapsed_time) }}</span>
                    </div>
                </div>
            </div>

            <div class="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 class="font-black text-slate-900 text-lg mb-4">Estimated Splits</h3>
                <div class="space-y-3">
                    <div v-for="n in 3" :key="n" class="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                        <div class="flex items-center gap-3">
                            <span class="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black">{{ n }}</span>
                            <span class="text-xs font-bold text-slate-600">KM {{ n }}</span>
                        </div>
                        <span class="text-sm font-black text-slate-900">{{ performanceValue }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
`;
