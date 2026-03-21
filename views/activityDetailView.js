export default `
<div class="activity-detail-wrapper animate-in pb-12">
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div class="flex items-center gap-4">
            <button @click="$router.back()" class="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
                <i data-lucide="arrow-left" class="w-5 h-5 text-slate-600"></i>
            </button>
            <div>
                <h1 class="text-2xl font-black text-slate-900 tracking-tight">{{ activity?.name || 'Loading...' }}</h1>
                <p class="text-slate-500 text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 mt-1">
                    <span>{{ formatDate(activity?.start_date) }}</span>
                    <span class="text-slate-300">•</span>
                    <span class="flex items-center gap-1"><i data-lucide="map-pin" class="w-3 h-3"></i> {{ locationName }}</span>
                    <span class="text-slate-300">•</span>
                    <span class="text-blue-600">{{ activity?.type }}</span>
                </p>
            </div>
        </div>

        <div v-if="!loading" class="flex items-center gap-1 bg-white p-1.5 pr-4 rounded-2xl border border-slate-100 shadow-sm">
            <div class="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                <i :data-lucide="weatherIcon" class="w-6 h-6"></i>
            </div>
            <div class="ml-2 flex gap-4">
                <div class="text-center">
                    <p class="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Wind</p>
                    <div class="flex items-center gap-1 text-slate-700">
                        <i data-lucide="wind" class="w-3 h-3 text-slate-400"></i>
                        <span class="text-xs font-bold">{{ activity?.wind_speed || '12' }}<span class="text-[8px] ml-0.5">km/h</span></span>
                    </div>
                </div>
                <div class="text-center">
                    <p class="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Hum</p>
                    <div class="flex items-center gap-1 text-slate-700">
                        <i data-lucide="droplets" class="w-3 h-3 text-blue-400"></i>
                        <span class="text-xs font-bold">{{ activity?.humidity || '65' }}<span class="text-[8px] ml-0.5">%</span></span>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <div v-if="loading" class="space-y-6">
        <div class="h-80 w-full bg-slate-100 rounded-[2.5rem] animate-pulse"></div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div v-for="i in 4" class="h-28 bg-slate-50 rounded-3xl animate-pulse"></div>
        </div>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
            <div class="bg-white p-2 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden h-[450px] relative">
                <div id="map" class="w-full h-full rounded-[2rem] z-10"></div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Distance</p>
                    <p class="text-xl font-black text-slate-900">{{ (activity.distance / 1000).toFixed(2) }} <span class="text-xs text-slate-400">km</span></p>
                </div>
                <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{{ activity.type === 'Ride' ? 'Avg Speed' : 'Avg Pace' }}</p>
                    <p class="text-xl font-black text-slate-900">{{ performanceValue }} <span class="text-xs text-slate-400">{{ performanceUnit }}</span></p>
                </div>
                <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Elevation</p>
                    <p class="text-xl font-black text-slate-900">{{ Math.round(activity.total_elevation_gain) }} <span class="text-xs text-slate-400">m</span></p>
                </div>
                <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <template v-if="activity.type === 'Walk'">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Steps</p>
                        <p class="text-xl font-black text-slate-900">{{ calculateSteps(activity.distance).toLocaleString('id-ID') }}</p>
                    </template>
                    <template v-else>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Calories</p>
                        <p class="text-xl font-black text-slate-900">{{ Math.round(activity.calories || 0) }} <span class="text-xs text-slate-400">kcal</span></p>
                    </template>
                </div>
            </div>
        </div>

        <div class="space-y-6">
            <div class="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-200">
                <h3 class="font-black text-lg mb-6 flex items-center gap-2">
                    <i data-lucide="clock" class="w-5 h-5 text-blue-400"></i> Time Analysis
                </h3>
                <div class="space-y-6">
                    <div>
                        <p class="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Moving Time</p>
                        <p class="text-3xl font-black tabular-nums">{{ formatTime(activity.moving_time) }}</p>
                    </div>
                    <div class="pt-4 border-t border-white/10">
                        <p class="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Elapsed Time</p>
                        <p class="text-xl font-bold text-white/80 tabular-nums">{{ formatTime(activity.elapsed_time) }}</p>
                    </div>
                </div>
            </div>

            <div class="bg-white p-6 rounded-[3rem] border border-slate-100 shadow-sm">
                <div class="flex items-center justify-between mb-4 px-2">
                    <h3 class="font-black text-slate-900">Est. Splits</h3>
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">per KM</span>
                </div>
                <div class="space-y-2">
                    <div v-for="n in 3" :key="n" class="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl hover:bg-slate-50 transition-colors">
                        <div class="flex items-center gap-3">
                            <span class="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm">{{ n }}</span>
                            <span class="text-xs font-bold text-slate-600">Kilometer {{ n }}</span>
                        </div>
                        <span class="text-sm font-black text-slate-900">{{ performanceValue }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
`;
