// views/MovementEngineView.js
export default `
<div class="movement-engine-wrapper animate-in pb-12 px-4">
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 mt-4">
        <div class="flex items-center gap-4">
            <button @click="$router.back()" class="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                <i data-lucide="arrow-left" class="w-5 h-5 text-slate-600"></i>
            </button>
            <div>
                <h1 class="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Movement <span class="text-green-600">Engine</span></h1>
                <p class="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
                    <i data-lucide="activity" class="w-3 h-3 text-green-500"></i>
                    <span>{{ moveForm.activity_name || 'Biomechanics Calibration' }}</span>
                </p>
            </div>
        </div>
        
        <div class="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 w-fit">
            <button @click="moveMode = 'dynamic'" 
                    :class="moveMode === 'dynamic' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'"
                    class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
                <i data-lucide="zap" class="w-3 h-3"></i> Analysis
            </button>
            <button @click="moveMode = 'static'" 
                    :class="moveMode === 'static' ? 'bg-white shadow-sm text-green-600' : 'text-slate-500'"
                    class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
                <i data-lucide="edit-3" class="w-3 h-3"></i> Manual
            </button>
        </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div class="lg:col-span-4 space-y-6">
            <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div class="grid grid-cols-1 gap-8">
                    <div class="space-y-2">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">True Cadence</label>
                        <div class="relative flex items-center">
                            <input type="number" v-model="moveForm.cadence" 
                                   class="w-full bg-slate-50 border border-slate-100 p-6 rounded-3xl text-4xl font-black text-slate-900 focus:ring-2 focus:ring-green-500 transition-all italic">
                            <span class="absolute right-6 text-[10px] font-black text-slate-400 uppercase">SPM</span>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stride Length</label>
                        <div class="relative flex items-center">
                            <input type="number" v-model="moveForm.stride" 
                                   class="w-full bg-slate-50 border border-slate-100 p-6 rounded-3xl text-4xl font-black text-slate-900 focus:ring-2 focus:ring-green-500 transition-all italic">
                            <span class="absolute right-6 text-[10px] font-black text-slate-400 uppercase">CM</span>
                        </div>
                    </div>
                </div>
            </div>

            <button @click="saveMovementData" 
                    :disabled="isLoading"
                    class="w-full py-6 text-white rounded-[2rem] font-black italic tracking-[0.2em] text-sm shadow-xl flex items-center justify-center gap-3 bg-slate-900 transition-all active:scale-95 disabled:opacity-50">
                <i :class="isLoading ? 'animate-spin' : ''" :data-lucide="isLoading ? 'loader-2' : 'refresh-cw'" class="w-5 h-5 text-green-400"></i>
                {{ isLoading ? 'CALIBRATING...' : 'SYNC MECHANICAL' }}
            </button>

            <div class="bg-green-600 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                <div class="absolute -right-4 -top-4 opacity-10">
                    <i data-lucide="zap" class="w-32 h-32"></i>
                </div>
                <h3 class="font-black text-xs mb-4 flex items-center gap-2 uppercase tracking-[0.2em]">
                    <i data-lucide="cpu" class="w-4 h-4 text-green-300"></i> Coach Intelligence
                </h3>
                <p class="text-sm font-bold leading-relaxed italic mb-4">
                    "{{ coachAdvice }}"
                </p>
                <div class="pt-4 border-t border-white/20 flex items-center justify-between">
                    <div>
                        <p class="text-white/50 text-[8px] font-black uppercase tracking-widest">Propulsion</p>
                        <p class="text-2xl font-black italic">{{ moveForm.propulsion_score }}%</p>
                    </div>
                    <div class="text-right">
                        <p class="text-white/50 text-[8px] font-black uppercase tracking-widest">Density</p>
                        <p class="text-2xl font-black italic">{{ moveForm.step_density }}</p>
                    </div>
                </div>
            </div>
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
                    <i data-lucide="trending-up" class="w-4 h-4 text-green-600"></i> Propulsion Stability
                </h3>
                <div class="relative h-[200px] w-full">
                    <canvas id="propulsionTrendChart"></canvas>
                </div>
            </div>
        </div>

    </div>
</div>
`;
