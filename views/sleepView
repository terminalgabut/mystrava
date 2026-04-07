export default `
<div class="sleep-engine-wrapper animate-in pb-12">
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div class="flex items-center gap-4">
            <button @click="$router.back()" class="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
                <i data-lucide="arrow-left" class="w-5 h-5 text-slate-600"></i>
            </button>
            <div>
                <h1 class="text-2xl font-black text-slate-900 tracking-tight italic uppercase">Sleep Engine <span class="text-blue-600">AASM</span></h1>
                <p class="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
                    <i data-lucide="calendar" class="w-3 h-3 text-blue-500"></i>
                    <span>{{ new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}</span>
                    <span class="text-slate-300">•</span>
                    <span class="text-slate-700 font-black">NEURAL RECOVERY MODE</span>
                </p>
            </div>
        </div>

        <div class="flex items-center gap-3 bg-slate-900 px-4 py-2.5 rounded-2xl border border-white/10 shadow-lg">
            <div class="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
            <span class="text-[10px] font-black text-indigo-100 uppercase tracking-[0.2em]">Clinical Analysis Active</span>
        </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div class="lg:col-span-2 space-y-6">
            
            <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div class="relative z-10">
                    <div class="flex items-center gap-3 mb-8">
                        <div class="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                            <i data-lucide="clock" class="w-5 h-5 text-blue-600"></i>
                        </div>
                        <h3 class="font-black text-slate-900 uppercase tracking-tighter italic">Sleep Window Calibration</h3>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="space-y-2">
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lights Out (Start)</label>
                            <input type="time" v-model="sleepForm.start" 
                                   class="w-full bg-slate-50 border border-slate-100 p-6 rounded-3xl text-3xl font-black text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all">
                        </div>
                        <div class="space-y-2">
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Wake Up (End)</label>
                            <input type="time" v-model="sleepForm.end" 
                                   class="w-full bg-slate-50 border border-slate-100 p-6 rounded-3xl text-3xl font-black text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all">
                        </div>
                    </div>
                </div>
                <i data-lucide="moon" class="absolute -right-8 -bottom-8 w-48 h-48 text-slate-50/50 -rotate-12 pointer-events-none"></i>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm group hover:border-blue-200 transition-all">
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Latency (AASM)</p>
                    <div class="flex items-end gap-2">
                        <input type="number" v-model="sleepForm.latency" 
                               class="w-full bg-transparent text-2xl font-black text-slate-900 focus:outline-none">
                        <span class="text-[10px] font-bold text-slate-400 mb-1">MINS</span>
                    </div>
                    <div class="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div class="h-full bg-blue-500" :style="{ width: Math.min(100, (sleepForm.latency/60)*100) + '%' }"></div>
                    </div>
                </div>

                <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm group hover:border-orange-200 transition-all">
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Power Nap</p>
                    <div class="flex items-end gap-2">
                        <input type="number" v-model="sleepForm.nap" 
                               class="w-full bg-transparent text-2xl font-black text-slate-900 focus:outline-none">
                        <span class="text-[10px] font-bold text-slate-400 mb-1">MINS</span>
                    </div>
                    <div class="mt-4 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div class="h-full bg-orange-400" :style="{ width: Math.min(100, (sleepForm.nap/90)*100) + '%' }"></div>
                    </div>
                </div>

                <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm col-span-2 sm:col-span-1">
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Consistency</p>
                    <div class="flex items-center justify-between">
                        <span class="text-xl font-black italic text-slate-900">{{ sleepForm.consistency }}%</span>
                        <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100">
                            <i data-lucide="trending-up" class="w-4 h-4 text-emerald-500"></i>
                        </div>
                    </div>
                </div>
            </div>

            <button @click="saveSleepData" 
                    class="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black italic tracking-[0.2em] text-sm hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3">
                <i data-lucide="zap" class="w-5 h-5 text-yellow-400"></i>
                SYNC NEURAL DATA
            </button>
        </div>

        <div class="space-y-6">
            
            <div class="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                <div class="relative z-10">
                    <h3 class="font-black text-lg mb-6 flex items-center gap-2 uppercase italic tracking-tighter">
                        <i data-lucide="brain-circuit" class="w-5 h-5 text-indigo-400"></i> CNS Readiness
                    </h3>
                    <div class="space-y-6">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Morning Quality</p>
                                <p class="text-4xl font-black text-indigo-400">{{ sleepForm.quality || 0 }}<span class="text-lg">/10</span></p>
                            </div>
                            <div class="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <i data-lucide="sparkles" class="w-8 h-8 text-indigo-300"></i>
                            </div>
                        </div>
                        
                        <div class="pt-6 border-t border-white/10">
                            <p class="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">Wakeup Feeling</p>
                            <div class="flex gap-2">
                                <button @click="sleepForm.isComplete = true" 
                                        :class="sleepForm.isComplete ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white/5 text-white/50 border-white/10'"
                                        class="flex-1 py-3 rounded-xl border text-[10px] font-black uppercase transition-all">Refreshed</button>
                                <button @click="sleepForm.isComplete = false" 
                                        :class="sleepForm.isComplete === false ? 'bg-rose-500 text-white border-rose-400' : 'bg-white/5 text-white/50 border-white/10'"
                                        class="flex-1 py-3 rounded-xl border text-[10px] font-black uppercase transition-all">Groggy</button>
                            </div>
                        </div>
                    </div>
                </div>
                <i data-lucide="activity" class="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 rotate-12"></i>
            </div>

            <div class="bg-blue-50 p-6 rounded-[2.5rem] border border-blue-100">
                <h4 class="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <i data-lucide="info" class="w-4 h-4"></i> AASM Guidelines
                </h4>
                <ul class="space-y-3">
                    <li class="flex gap-3 items-start text-[11px] font-medium text-blue-800/80 leading-relaxed italic">
                        <span class="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 shrink-0"></span>
                        Ideal latency is 15-20 minutes. Lower than 5m might indicate exhaustion.
                    </li>
                    <li class="flex gap-3 items-start text-[11px] font-medium text-blue-800/80 leading-relaxed italic">
                        <span class="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 shrink-0"></span>
                        Naps should be kept under 45 mins to avoid sleep inertia.
                    </li>
                </ul>
            </div>
        </div>
    </div>
</div>
`;
