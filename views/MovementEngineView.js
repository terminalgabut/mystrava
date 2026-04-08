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
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
            
            <div class="flex bg-slate-100 p-1.5 rounded-3xl border border-slate-200 shadow-inner">
                <button @click="moveMode = 'dynamic'" 
                        :class="moveMode === 'dynamic' ? 'bg-white shadow-md text-slate-900 border-slate-100' : 'text-slate-500 hover:text-slate-700'"
                        class="flex-1 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 border border-transparent">
                    <i data-lucide="zap" class="w-4 h-4"></i> Analysis (Live)
                </button>
                <button @click="moveMode = 'static'" 
                        :class="moveMode === 'static' ? 'bg-white shadow-md text-green-600 border-slate-100' : 'text-slate-500 hover:text-slate-700'"
                        class="flex-1 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 border border-transparent">
                    <i data-lucide="edit-3" class="w-4 h-4"></i> Manual Input
                </button>
            </div>

            <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div class="relative z-10">
                    <div class="flex items-center gap-3 mb-8">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center border"
                             :class="moveMode === 'dynamic' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-slate-50 border-slate-100 text-slate-600'">
                            <i :data-lucide="moveMode === 'dynamic' ? 'gauge' : 'pencil-line'" class="w-5 h-5"></i>
                        </div>
                        <h3 class="font-black text-slate-900 uppercase tracking-tighter italic">
                            {{ moveMode === 'dynamic' ? 'Propulsion Metrics' : 'Static Step Data' }}
                        </h3>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="space-y-2">
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">True Cadence</label>
                            <div class="relative flex items-center">
                                <input type="number" v-model="moveForm.cadence" 
                                       class="w-full bg-slate-50 border border-slate-100 p-6 rounded-3xl text-3xl font-black text-slate-900 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all italic">
                                <span class="absolute right-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">SPM</span>
                            </div>
                        </div>
                        <div class="space-y-2">
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stride Length</label>
                            <div class="relative flex items-center">
                                <input type="number" v-model="moveForm.stride" 
                                       class="w-full bg-slate-50 border border-slate-100 p-6 rounded-3xl text-3xl font-black text-slate-900 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all italic">
                                <span class="absolute right-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">CM</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Mechanical Density</p>
                <div class="flex items-end gap-2">
                    <span class="text-2xl font-black text-slate-900 italic">{{ moveForm.step_density }}</span>
                    <span class="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-tighter italic">Steps / KM</span>
                    
                    <div class="ml-auto flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                        <div class="w-2 h-2 rounded-full" :class="impactColor"></div>
                        <span class="text-[9px] font-black text-slate-600 uppercase tracking-tight">{{ impactLabel }}</span>
                    </div>
                </div>
            </div>

            <button @click="saveMovementData" 
                    :disabled="isLoading"
                    class="w-full py-6 text-white rounded-[2rem] font-black italic tracking-[0.2em] text-sm hover:opacity-90 transition-all shadow-xl flex items-center justify-center gap-3 bg-slate-900 disabled:opacity-50">
                <i v-if="!isLoading" data-lucide="refresh-cw" class="w-5 h-5 text-green-400"></i>
                <i v-else data-lucide="loader-2" class="w-5 h-5 animate-spin text-green-400"></i>
                {{ isLoading ? 'SYNCING...' : 'SYNC MECHANICAL DATA' }}
            </button>
        </div>

        <div class="space-y-6">
            <div class="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                <div class="absolute -right-4 -top-4 opacity-10">
                    <i data-lucide="zap" class="w-32 h-32 text-white"></i>
                </div>
                <h3 class="font-black text-lg mb-6 flex items-center gap-2 uppercase italic tracking-tighter relative z-10">
                    <i data-lucide="trending-up" class="w-5 h-5 text-green-400"></i> Engine Power
                </h3>
                <div class="space-y-6 relative z-10">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Propulsion Score</p>
                            <p class="text-4xl font-black text-green-400">{{ moveForm.propulsion_score }}<span class="text-lg">%</span></p>
                        </div>
                    </div>
                    <div class="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                        <p class="text-[10px] text-white/60 font-medium leading-relaxed italic">
                            "Berdasarkan TB 166.5cm, efisiensi langkah Anda berada di zona optimal."
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
`;
