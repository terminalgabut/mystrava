// root/views/sleepView.js
export default `
<div class="dashboard-wrapper animate-in bg-slate-50 text-slate-900 min-h-screen pb-20">
    <header class="p-6 flex justify-between items-center bg-white border-b border-slate-200 sticky top-0 z-10 backdrop-blur-md bg-white/80">
        <button @click="goBack" class="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
            <i data-lucide="chevron-left" class="w-6 h-6"></i>
        </button>
        <div class="text-center">
            <h1 class="text-xl font-black italic uppercase tracking-tighter text-slate-900">Sleep Engine</h1>
            <p class="text-[9px] font-black text-blue-600 tracking-[0.3em] uppercase italic">AASM Standard v1.0</p>
        </div>
        <div class="w-10"></div> 
    </header>

    <div class="p-6 max-w-2xl mx-auto space-y-8">
        
        <section class="space-y-4">
            <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <i data-lucide="clock" class="w-3 h-3 text-blue-500"></i> Main Sleep Cycle
            </h3>
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-white p-5 rounded-[32px] border border-slate-200 shadow-sm transition-all hover:border-blue-200">
                    <label class="text-[8px] font-black text-slate-400 uppercase block mb-1 tracking-widest">Sleep Start</label>
                    <input type="time" v-model="form.start" class="bg-transparent text-2xl font-black text-slate-900 w-full outline-none focus:text-blue-600 transition-colors">
                </div>
                <div class="bg-white p-5 rounded-[32px] border border-slate-200 shadow-sm transition-all hover:border-blue-200">
                    <label class="text-[8px] font-black text-slate-400 uppercase block mb-1 tracking-widest">Wake Up</label>
                    <input type="time" v-model="form.end" class="bg-transparent text-2xl font-black text-slate-900 w-full outline-none focus:text-blue-600 transition-colors">
                </div>
            </div>
        </section>

        <section class="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
            <div class="flex justify-between items-center mb-8">
                <div>
                    <h3 class="text-sm font-black italic uppercase tracking-tight text-slate-900">Sleep Latency</h3>
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Waktu Menuju Terlelap</p>
                </div>
                <div class="px-4 py-2 bg-blue-50 rounded-2xl border border-blue-100">
                    <span class="text-2xl font-black text-blue-600 italic">{{ form.latency }}<span class="text-xs uppercase ml-1">m</span></span>
                </div>
            </div>
            
            <input type="range" min="0" max="60" step="5" v-model="form.latency" 
                   class="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600">
            
            <div v-if="form.latency > 30" class="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
                <i data-lucide="alert-circle" class="w-4 h-4 text-amber-500"></i>
                <p class="text-[10px] text-amber-700 font-black italic uppercase tracking-tight">
                    High Latency: Overstimulation Detected
                </p>
            </div>
        </section>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                <div class="flex items-center gap-3 mb-4">
                    <div class="p-2 bg-amber-50 rounded-lg">
                        <i data-lucide="sun" class="w-4 h-4 text-amber-500"></i>
                    </div>
                    <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Daytime Nap</h3>
                </div>
                <div class="flex items-end gap-2">
                    <input type="number" v-model="form.nap" class="bg-transparent text-4xl font-black text-slate-900 w-24 outline-none border-b-2 border-slate-100 focus:border-amber-400 transition-all">
                    <span class="text-[10px] font-black text-slate-300 mb-2 uppercase tracking-widest">Minutes</span>
                </div>
            </div>

            <div class="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                <div class="flex items-center gap-3 mb-4">
                    <div class="p-2 bg-emerald-50 rounded-lg">
                        <i data-lucide="refresh-cw" class="w-4 h-4 text-emerald-500"></i>
                    </div>
                    <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Schedule Sync</h3>
                </div>
                <div class="flex items-end gap-2">
                    <span class="text-4xl font-black text-slate-900 italic">{{ form.consistency }}%</span>
                    <span class="text-[10px] font-black text-slate-300 mb-2 uppercase tracking-widest italic">Stability</span>
                </div>
            </div>
        </div>

        <section class="space-y-4">
             <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Neural Readiness Assessment</h3>
             <div class="grid grid-cols-2 gap-4">
                <button @click="form.isComplete = true" 
                        :class="form.isComplete ? 'bg-blue-600 border-blue-500 shadow-xl shadow-blue-200 scale-[1.02]' : 'bg-white border-slate-200 grayscale opacity-60'"
                        class="p-6 rounded-[28px] border text-left transition-all duration-300">
                    <i data-lucide="zap" class="w-6 h-6 mb-3" :class="form.isComplete ? 'text-white' : 'text-slate-400'"></i>
                    <p class="text-xs font-black uppercase italic" :class="form.isComplete ? 'text-white' : 'text-slate-900'">Refreshed</p>
                    <p class="text-[8px] font-bold uppercase mt-1 opacity-60" :class="form.isComplete ? 'text-white' : 'text-slate-400'">Neural Alert: High</p>
                </button>
                
                <button @click="form.isComplete = false" 
                        :class="!form.isComplete ? 'bg-slate-900 border-slate-800 shadow-xl shadow-slate-200 scale-[1.02]' : 'bg-white border-slate-200 grayscale opacity-60'"
                        class="p-6 rounded-[28px] border text-left transition-all duration-300">
                    <i data-lucide="cloud-rain" class="w-6 h-6 mb-3" :class="!form.isComplete ? 'text-white' : 'text-slate-400'"></i>
                    <p class="text-xs font-black uppercase italic" :class="!form.isComplete ? 'text-white' : 'text-slate-900'">Groggy</p>
                    <p class="text-[8px] font-bold uppercase mt-1 opacity-60" :class="!form.isComplete ? 'text-white' : 'text-slate-400'">System Lag</p>
                </button>
             </div>
        </section>

        <button @click="saveSleepData" 
                class="w-full py-6 bg-blue-600 text-white rounded-[32px] font-black italic tracking-[0.2em] hover:bg-blue-700 active:scale-[0.98] transition-all shadow-2xl shadow-blue-600/30">
            SYNC TO BIO-ENGINE
        </button>

    </div>
</div>
`;
