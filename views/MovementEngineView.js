// views/MovementEngineView.js
export default `
<div class="movement-engine-wrapper animate-in pb-12 px-4">
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 mt-4">
    <div class="flex items-center gap-4">
        <button @click="$router.back()" class="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
            <i data-lucide="arrow-left" class="w-5 h-5 text-slate-600"></i>
        </button>

        <div>
            <div class="flex items-center gap-2 mb-1">
                <span :class="moveForm.activity_type === 'Run' ? 'bg-green-600' : 'bg-blue-600'" 
                      class="px-2 py-0.5 text-[8px] font-black text-white uppercase tracking-tighter rounded-md italic shadow-sm">
                    {{ moveForm.activity_type || 'N/A' }}
                </span>
                <span class="text-slate-400 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                    <i data-lucide="map-pin" class="w-2.5 h-2.5"></i>
                    {{ formatDistance(moveForm.distance) }} 
                    <span class="mx-1 text-slate-300">•</span>
                    {{ formatDate(moveForm.start_date) }}
                </span>
            </div>

            <h1 class="text-2xl font-black text-slate-900 tracking-tight italic uppercase leading-none">
                {{ moveForm.activity_name || 'Movement Engine' }}
            </h1>
        </div>
    </div>
    
    <div class="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-2xl border border-green-100 h-fit">
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span class="text-[10px] font-black text-green-700 uppercase tracking-widest">Live Strava Sync</span>
    </div>
</header>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div class="lg:col-span-4 space-y-6">
            <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                <div class="space-y-1">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">True Cadence</p>
                    <div class="flex items-baseline gap-2">
                        <span class="text-5xl font-black text-slate-900 italic">{{ moveForm.cadence }}</span>
                        <span class="text-xs font-bold text-slate-400 uppercase">SPM</span>
                    </div>
                </div>
                
                <div class="space-y-1">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stride Length</p>
                    <div class="flex items-baseline gap-2">
                        <span class="text-5xl font-black text-slate-900 italic">{{ moveForm.stride }}</span>
                        <span class="text-xs font-bold text-slate-400 uppercase">CM</span>
                    </div>
                </div>
            </div>

            <div class="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                <div class="absolute -right-4 -top-4 opacity-10">
                    <i data-lucide="zap" class="w-32 h-32"></i>
                </div>
                <h3 class="font-black text-xs mb-4 flex items-center gap-2 uppercase tracking-[0.2em] text-green-400">
                    <i data-lucide="cpu" class="w-4 h-4"></i> Coach Intelligence
                </h3>
                <p class="text-sm font-bold leading-relaxed italic mb-6">
                    "{{ coachAdvice }}"
                </p>
                <div class="pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-white/40 text-[8px] font-black uppercase tracking-widest mb-1">Propulsion</p>
                        <p class="text-3xl font-black text-green-400 italic">{{ moveForm.propulsion_score }}%</p>
                    </div>
                    <div>
                        <p class="text-white/40 text-[8px] font-black uppercase tracking-widest mb-1">Density</p>
                        <p class="text-3xl font-black italic text-white">{{ moveForm.step_density }}</p>
                    </div>
                </div>
            </div>

            <button @click="saveMovementData" 
                    :disabled="isLoading"
                    class="w-full py-6 text-slate-900 border-2 border-slate-900 rounded-[2rem] font-black italic tracking-[0.2em] text-sm flex items-center justify-center gap-3 hover:bg-slate-900 hover:text-white transition-all disabled:opacity-30">
                <i :class="isLoading ? 'animate-spin' : ''" :data-lucide="isLoading ? 'loader-2' : 'refresh-cw'" class="w-5 h-5"></i>
                RE-CALIBRATE ENGINE
            </button>
        </div>

        <div class="lg:col-span-8 space-y-6">
            <div class="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div class="flex items-center justify-between mb-6 px-2">
                    <h3 class="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] italic flex items-center gap-2">
                        <i data-lucide="crosshair" class="w-4 h-4 text-green-600"></i> Efficiency Matrix
                    </h3>
                    <div class="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                        <div class="w-2 h-2 rounded-full" :class="impactColor"></div>
                        <span class="text-[9px] font-black text-slate-600 uppercase">{{ impactLabel }}</span>
                    </div>
                </div>
                <div class="relative h-[300px] w-full">
                    <canvas id="efficiencyMatrixChart"></canvas>
                </div>
            </div>

            <div class="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 class="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] italic flex items-center gap-2 mb-6 px-2">
                    <i data-lucide="trending-up" class="w-4 h-4 text-green-600"></i> Propulsion Trend (Last 10)
                </h3>
                <div class="relative h-[200px] w-full">
                    <canvas id="propulsionTrendChart"></canvas>
                </div>
            </div>
        </div>
    </div>
</div>
`;
