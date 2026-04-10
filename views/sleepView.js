export default `
<div class="sleep-engine-wrapper animate-in pb-12 px-4">
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div class="flex items-center gap-4">
            <button @click="$router.back()" class="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                <i data-lucide="arrow-left" class="w-5 h-5 text-slate-600"></i>
            </button>
            <div>
                <h1 class="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Sleep Engine <span class="text-blue-600">AASM</span></h1>
                <p class="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
                    <i data-lucide="calendar" class="w-3 h-3 text-blue-500"></i>
                    <span>{{ new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}</span>
                </p>
            </div>
        </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
            
            <div class="flex bg-slate-100 p-1.5 rounded-3xl border border-slate-200 shadow-inner">
                <button @click="sleepMode = 'night'" 
                        :class="sleepMode === 'night' ? 'bg-white shadow-md text-slate-900 border-slate-100' : 'text-slate-500 hover:text-slate-700'"
                        class="flex-1 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 border border-transparent">
                    <i data-lucide="moon" class="w-4 h-4"></i> Utama (Malam)
                </button>
                <button @click="sleepMode = 'nap'" 
                        :class="sleepMode === 'nap' ? 'bg-white shadow-md text-amber-600 border-slate-100' : 'text-slate-500 hover:text-slate-700'"
                        class="flex-1 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 border border-transparent">
                    <i data-lucide="coffee" class="w-4 h-4"></i> Power Nap (Siang)
                </button>
            </div>

            <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div class="relative z-10">
                    <div class="flex items-center gap-3 mb-8">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center border"
                             :class="sleepMode === 'night' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-amber-50 border-amber-100 text-amber-600'">
                            <i :data-lucide="sleepMode === 'night' ? 'moon' : 'coffee'" class="w-5 h-5"></i>
                        </div>
                        <h3 class="font-black text-slate-900 uppercase tracking-tighter italic">
                            {{ sleepMode === 'night' ? 'Main Sleep Window' : 'Nap Time Duration' }}
                        </h3>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="space-y-2">
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Time</label>
                            <input type="time" v-model="sleepForm.start" 
                                   class="w-full bg-slate-50 border border-slate-100 p-6 rounded-3xl text-3xl font-black text-slate-900 focus:ring-2 focus:outline-none transition-all"
                                   :class="sleepMode === 'night' ? 'focus:ring-blue-500' : 'focus:ring-amber-500'">
                        </div>
                        <div class="space-y-2">
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Wake Up</label>
                            <input type="time" v-model="sleepForm.end" 
                                   class="w-full bg-slate-50 border border-slate-100 p-6 rounded-3xl text-3xl font-black text-slate-900 focus:ring-2 focus:outline-none transition-all"
                                   :class="sleepMode === 'night' ? 'focus:ring-blue-500' : 'focus:ring-amber-500'">
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="sleepMode === 'night'" class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Latency (AASM)</p>
                <div class="flex items-end gap-2">
                    <input type="number" v-model="sleepForm.latency" 
                           class="w-full bg-transparent text-2xl font-black text-slate-900 focus:outline-none">
                    <span class="text-[10px] font-bold text-slate-400 mb-1">MINS</span>
                </div>
            </div>

            <button @click="saveSleepData" 
                    :class="sleepMode === 'night' ? 'bg-slate-900' : 'bg-amber-600'"
                    class="w-full py-6 text-white rounded-[2rem] font-black italic tracking-[0.2em] text-sm hover:opacity-90 transition-all shadow-xl flex items-center justify-center gap-3">
                <i data-lucide="zap" class="w-5 h-5" :class="sleepMode === 'night' ? 'text-yellow-400' : 'text-white'"></i>
                SYNC {{ sleepMode === 'night' ? 'NEURAL' : 'NAP' }} DATA
            </button>
        </div>

        <div class="space-y-6">
            <div class="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
                <h3 class="font-black text-lg mb-6 flex items-center gap-2 uppercase italic tracking-tighter">
                    <i data-lucide="brain-circuit" class="w-5 h-5 text-indigo-400"></i> CNS Readiness
                </h3>
                <div class="space-y-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-1"> CNS Quality</p>
                            <p class="text-4xl font-black text-indigo-400">{{ sleepForm.cns || 0 }}<span class="text-lg">/10</span></p>
                        </div>
                        <input type="range" v-model="sleepForm.cns" min="1" max="10" class="w-24 accent-indigo-400">
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
`;
