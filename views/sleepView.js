export default `
<div class="dashboard-wrapper animate-in bg-slate-950 text-slate-100 min-h-screen pb-20">
    <header class="p-6 flex justify-between items-center border-b border-white/5">
        <button @click="goBack" class="p-2 hover:bg-white/5 rounded-full transition-colors">
            <i data-lucide="chevron-left" class="w-6 h-6"></i>
        </button>
        <div class="text-center">
            <h1 class="text-xl font-black italic uppercase tracking-tighter">Sleep Engine</h1>
            <p class="text-[9px] font-bold text-indigo-400 tracking-[0.3em] uppercase">AASM Standard v1.0</p>
        </div>
        <div class="w-10"></div> </header>

    <div class="p-6 max-w-2xl mx-auto space-y-8">
        
        <section class="space-y-4">
            <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <i data-lucide="clock" class="w-3 h-3"></i> Main Sleep Cycle
            </h3>
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-white/5 p-4 rounded-3xl border border-white/10">
                    <label class="text-[8px] font-black text-indigo-300 uppercase block mb-1 tracking-widest">Sleep Start</label>
                    <input type="time" v-model="form.start" class="bg-transparent text-2xl font-black text-white w-full outline-none">
                </div>
                <div class="bg-white/5 p-4 rounded-3xl border border-white/10">
                    <label class="text-[8px] font-black text-indigo-300 uppercase block mb-1 tracking-widest">Wake Up</label>
                    <input type="time" v-model="form.end" class="bg-transparent text-2xl font-black text-white w-full outline-none">
                </div>
            </div>
        </section>

        <section class="bg-indigo-950/30 p-6 rounded-[32px] border border-indigo-500/20">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h3 class="text-sm font-black italic uppercase tracking-tight">Sleep Latency</h3>
                    <p class="text-[10px] text-slate-400 font-medium">Berapa menit sampai terlelap?</p>
                </div>
                <span class="text-2xl font-black text-indigo-400">{{ form.latency }}m</span>
            </div>
            <input type="range" min="0" max="60" step="5" v-model="form.latency" 
                   class="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500">
            <p v-if="form.latency > 30" class="mt-4 text-[10px] text-amber-400 font-bold italic uppercase tracking-tight">
                <i data-lucide="alert-circle" class="inline w-3 h-3 mr-1"></i> High Latency: Indikasi Overstimulation / Cortisol Spike
            </p>
        </section>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-slate-900 p-6 rounded-[32px] border border-white/5">
                <div class="flex items-center gap-3 mb-4">
                    <i data-lucide="sun" class="w-5 h-5 text-amber-400"></i>
                    <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-400">Daytime Nap</h3>
                </div>
                <div class="flex items-end gap-2">
                    <input type="number" v-model="form.nap" class="bg-transparent text-3xl font-black text-white w-20 outline-none border-b border-white/10">
                    <span class="text-xs font-bold text-slate-500 mb-2 uppercase">Mins</span>
                </div>
            </div>

            <div class="bg-slate-900 p-6 rounded-[32px] border border-white/5">
                <div class="flex items-center gap-3 mb-4">
                    <i data-lucide="refresh-cw" class="w-5 h-5 text-emerald-400"></i>
                    <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-400">Consistency</h3>
                </div>
                <div class="flex items-end gap-2">
                    <span class="text-3xl font-black text-white">{{ form.consistency }}%</span>
                    <span class="text-[8px] font-bold text-slate-500 mb-2 uppercase tracking-tighter">Schedule Sync</span>
                </div>
            </div>
        </div>

        <section class="space-y-4">
             <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-500">How do you feel upon waking?</h3>
             <div class="grid grid-cols-2 gap-3">
                <button @click="form.isComplete = true" 
                        :class="form.isComplete ? 'bg-indigo-600 border-indigo-400 shadow-lg shadow-indigo-500/20' : 'bg-white/5 border-white/10'"
                        class="p-4 rounded-2xl border text-left transition-all">
                    <i data-lucide="zap" class="w-5 h-5 mb-2" :class="form.isComplete ? 'text-white' : 'text-slate-500'"></i>
                    <p class="text-xs font-black uppercase italic">Refreshed</p>
                </button>
                <button @click="form.isComplete = false" 
                        :class="!form.isComplete ? 'bg-red-950 border-red-500' : 'bg-white/5 border-white/10'"
                        class="p-4 rounded-2xl border text-left transition-all">
                    <i data-lucide="cloud-rain" class="w-5 h-5 mb-2" :class="!form.isComplete ? 'text-white' : 'text-slate-500'"></i>
                    <p class="text-xs font-black uppercase italic">Groggy</p>
                </button>
             </div>
        </section>

        <button @click="saveSleepData" 
                class="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black italic tracking-[0.2em] hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-900/40">
            SYNC TO BIO-ENGINE
        </button>

    </div>
</div>
`;
