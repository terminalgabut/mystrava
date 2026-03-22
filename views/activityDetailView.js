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
                    <span class="flex items-center gap-1 text-slate-700 max-w-[250px] md:max-w-none">
                        <i data-lucide="map-pin" class="w-3 h-3 text-red-500 shrink-0"></i> 
                        <span class="truncate md:whitespace-normal">{{ locationName || 'Unknown Location' }}</span>
                    </span>
                    <span class="text-slate-300">•</span>
                    <span class="text-blue-600 font-black">{{ activity?.type || 'Activity' }}</span>
                </p>
            </div>
        </div>

        <div v-if="!loading && activity" class="flex items-center gap-4 bg-white p-2 pr-6 rounded-2xl border border-slate-100 shadow-sm">
            <div class="flex items-center gap-3 border-r border-slate-100 pr-4">
                <div class="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                    <i :data-lucide="weatherIcon || 'sun'" class="w-6 h-6"></i>
                </div>
                <div>
                    <p class="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Temp</p>
                    <p class="text-sm font-black text-slate-900 leading-none">
                        {{ activity?.weather_temp || '28' }}°C
                    </p>
                </div>
            </div>
            <div class="flex gap-5">
                <div class="text-center">
                    <i data-lucide="wind" class="w-4 h-4 text-slate-300 mx-auto mb-1"></i>
                    <p class="text-[10px] font-bold text-slate-700">
                        {{ activity?.weather_wind || '12' }} <span class="text-[8px] text-slate-400">km/h</span>
                    </p>
                </div>
                <div class="text-center">
                    <i data-lucide="droplets" class="w-4 h-4 text-blue-300 mx-auto mb-1"></i>
                    <p class="text-[10px] font-bold text-slate-700">
                        {{ activity?.weather_humidity || '65' }} <span class="text-[8px] text-slate-400">%</span>
                    </p>
                </div>
            </div>
        </div>
    </header>

    <div v-if="loading" class="space-y-6">
        <div class="h-80 w-full bg-slate-100 rounded-[2.5rem] animate-pulse"></div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div v-for="i in 4" :key="i" class="h-28 bg-slate-50 rounded-3xl animate-pulse"></div>
        </div>
    </div>

    <div v-else-if="activity" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
            <div class="bg-white p-2 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden h-[450px] relative">
                <div id="map" class="w-full h-full rounded-[2rem] z-10"></div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Distance</p>
                    <p class="text-xl font-black text-slate-900 leading-none">
                        {{ ((activity?.distance || 0) / 1000).toFixed(2) }} <span class="text-xs text-slate-400 font-bold">km</span>
                    </p>
                </div>
                <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{{ activity?.type === 'Ride' ? 'Avg Speed' : 'Avg Pace' }}</p>
                    <p class="text-xl font-black text-slate-900 leading-none">
                        {{ performanceValue || '00:00' }} <span class="text-xs text-slate-400 font-bold">{{ performanceUnit }}</span>
                    </p>
                </div>
                <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Elevation</p>
                    <p class="text-xl font-black text-slate-900 leading-none">
                        {{ Math.round(activity?.total_elevation_gain || 0) }} <span class="text-xs text-slate-400 font-bold">m</span>
                    </p>
                </div>
                <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <template v-if="activity?.type === 'Walk'">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Steps</p>
                        <p class="text-xl font-black text-slate-900 leading-none">{{ calculateSteps(activity?.distance || 0) }}</p>
                    </template>
                    <template v-else>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Calories</p>
                        <p class="text-xl font-black text-slate-900 leading-none">
                            {{ Math.round(activity?.calories || 0) }} <span class="text-xs text-slate-400 font-bold">kcal</span>
                        </p>
                    </template>
                </div>
            </div>
        </div>

        <div class="space-y-6">
            <div class="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-200 relative overflow-hidden">
                <div class="relative z-10">
                    <h3 class="font-black text-lg mb-6 flex items-center gap-2">
                        <i data-lucide="timer" class="w-5 h-5 text-blue-400"></i> Time Analysis
                    </h3>
                    <div class="space-y-6">
                        <div>
                            <p class="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Moving Time</p>
                            <p class="text-4xl font-black tabular-nums tracking-tighter text-blue-400">
                                {{ formatTime(activity?.moving_time) }}
                            </p>
                        </div>
                        <div class="pt-6 border-t border-white/10">
                            <p class="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Elapsed Time</p>
                            <p class="text-2xl font-bold text-white tabular-nums">
                                {{ formatTime(activity?.elapsed_time_seconds || activity?.elapsed_time || 0) }}
                            </p>
                        </div>
                    </div>
                </div>
                <i data-lucide="clock" class="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 rotate-12"></i>
            </div>

            <div class="bg-white p-6 rounded-[3rem] border border-slate-100 shadow-sm">
                <div class="flex items-center justify-between mb-4 px-2">
                    <h3 class="font-black text-slate-900">Splits Metric</h3>
                    <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pace /km</span>
                </div>
                <div class="space-y-2">
                    <template v-if="realSplits && realSplits.length > 0">
                        <div v-for="split in realSplits" :key="split.number" 
                             class="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-transparent hover:border-slate-100 transition-all">
                            <div class="flex items-center gap-3">
                                <span class="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 shadow-sm">
                                    {{ split.number }}
                                </span>
                                <div class="flex flex-col">
                                    <span class="text-xs font-bold text-slate-900">KM {{ split.number }}</span>
                                    <span class="text-[9px] font-medium text-slate-400">{{ split.distance }} km</span>
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="text-sm font-black text-slate-900">{{ split.pace }}</p>
                                <p class="text-[9px] font-bold" :class="split.elevation >= 0 ? 'text-emerald-500' : 'text-rose-500'">
                                    {{ split.elevation > 0 ? '+' : '' }}{{ split.elevation }}m
                                </p>
                            </div>
                        </div>
                    </template>
                    
                    <div v-else class="py-4 text-center">
                        <p class="text-[10px] text-slate-400 font-bold uppercase italic">Data split tidak tersedia</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
\`;
