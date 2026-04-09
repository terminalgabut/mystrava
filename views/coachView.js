// root/views/coachView.js
export default `
<div class="dashboard-wrapper animate-in" :class="{ 'is-loading': isLoading }">
    <header class="dashboard-header">
        <div>
            <h1 class="text-display">AI Coach Intelligence</h1>
            <p class="text-caption mt-1">Personalized guidance based on your bio-signals</p>
        </div>
        <div class="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100">
            <span class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            <span class="text-[10px] font-black text-blue-700 uppercase tracking-wider">Coach Active</span>
        </div>

        <button @click="goToSleepEngine" 
                class="group flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/10 border border-white/10">
            <i data-lucide="moon" class="w-4 h-4 text-indigo-400 group-hover:text-white transition-colors"></i>
            <span class="text-[10px] font-black uppercase tracking-widest italic">Sleep Engine AASM</span>
        </button>

        <button @click="goToMovementEngine" 
                class="group flex items-center gap-2 px-4 py-2 bg-white hover:bg-green-50 text-slate-900 rounded-xl transition-all shadow-sm border border-slate-200 hover:border-green-200">
            <i data-lucide="activity" class="w-4 h-4 text-green-500 transition-colors"></i>
            <span class="text-[10px] font-black uppercase tracking-widest italic">Movement Engine</span>
        </button>

        <button @click="goToTobaccoEngine" 
            class="group flex items-center gap-2 px-4 py-2 bg-white hover:bg-orange-50 text-slate-900 rounded-xl transition-all shadow-sm border border-slate-200 hover:border-orange-200">
        <i data-lucide="cigarette" class="w-4 h-4 text-orange-500 transition-colors"></i>
        <span class="text-[10px] font-black uppercase tracking-widest italic">Tobacco Engine</span>
    </button>
        
    </header>

    <div v-if="!isRecoverySynced" class="bento-card p-6 border-2 border-blue-500 bg-slate-900 text-white mb-8 shadow-2xl shadow-blue-500/20">
        <div class="flex flex-col md:flex-row items-center justify-between gap-6">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                    <i data-lucide="activity" class="w-6 h-6 text-blue-400"></i>
                </div>
                <div>
                    <h3 class="font-black text-white uppercase tracking-tighter italic">Bio-Signal Sync Required</h3>
                    <p class="text-sm text-slate-400 font-bold uppercase tracking-tight">RHR Trend: 69 BPM. Input data untuk kalibrasi skor.</p>
                </div>
            </div>
            <button @click="openRecoveryModal" class="px-8 py-3 bg-blue-600 text-white rounded-xl font-black italic text-sm tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/40">
                SYNC MORNING DATA
            </button>
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bento-card p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <span class="label-muted mb-4 uppercase tracking-[0.2em] text-[10px]">Readiness Score</span>
            <div class="relative mb-4">
                <div class="w-24 h-24 rounded-full border-[8px] border-slate-50 flex items-center justify-center"
                     :style="{ borderTopColor: getStatusColor(readinessScore) }">
                    <h2 class="stat-value text-3xl">{{ readinessScore }}%</h2>
                </div>
            </div>
            <p class="font-black text-slate-900 uppercase italic tracking-tighter">{{ readinessStatus }}</p>
        </div>

        <div class="bento-card md:col-span-2 p-8 bg-slate-900 text-white relative shadow-2xl">
            <div class="flex items-start justify-between mb-6">
                <div>
                    <p class="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-2">Today's Prescription</p>
                    <h2 class="text-2xl md:text-3xl font-black italic tracking-tighter leading-tight">
                        {{ coachBrief.recommendation }}
                    </h2>
                </div>
                <div class="icon-box bg-white/10 border-white/20">
                    <i data-lucide="sparkles" class="w-6 h-6 text-blue-300"></i>
                </div>
            </div>
            <div class="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                <p class="text-sm font-medium text-slate-300 leading-relaxed italic">"{{ coachBrief.breathing_tip }}"</p>
            </div>
        </div>
    </div>
    

<div v-if="dynamicInsights && dynamicInsights.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
    <div v-for="item in dynamicInsights" :key="item.title" 
         class="bento-card group p-0 bg-slate-900 text-white relative shadow-2xl transition-all overflow-hidden border border-white/5"
         :class="{ 'border-red-500/30 ring-1 ring-red-500/10 shadow-red-500/10': item.type?.toLowerCase() === 'danger' || item.type?.toLowerCase() === 'warning' }">
        
        <div class="h-1.5 w-full" 
             :class="(item.type?.toLowerCase() === 'danger' || item.type?.toLowerCase() === 'warning') ? 'bg-red-500' : 'bg-blue-500'">
        </div>

        <div class="p-8">
            <div class="flex items-start justify-between mb-6">
                <div class="space-y-1">
                    <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 mb-2">
                        <span class="w-1.5 h-1.5 rounded-full animate-pulse"
                              :class="(item.type?.toLowerCase() === 'danger' || item.type?.toLowerCase() === 'warning') ? 'bg-red-400' : 'bg-blue-400'">
                        </span>
                        <span class="text-[9px] font-black uppercase tracking-[0.15em]"
                              :class="(item.type?.toLowerCase() === 'danger' || item.type?.toLowerCase() === 'warning') ? 'text-red-400' : 'text-blue-400'">
                           {{ (item.type?.toLowerCase() === 'danger' || item.type?.toLowerCase() === 'warning') ? 'Neural Alert' : 'System Insight' }}
                        </span>
                    </div>
                    <h2 class="text-2xl font-black italic tracking-tighter leading-tight text-white group-hover:text-blue-400 transition-colors">
                        {{ item.title }}
                    </h2>
                </div>
                
                <div class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all"
                     :class="(item.type?.toLowerCase() === 'danger' || item.type?.toLowerCase() === 'warning') ? 'bg-red-500/10 border-red-500/20' : 'bg-blue-500/10 border-blue-500/20'">
                    <i :data-lucide="(item.type?.toLowerCase() === 'danger' || item.type?.toLowerCase() === 'warning') ? 'alert-octagon' : 'brain-circuit'" 
                       class="w-6 h-6" :class="(item.type?.toLowerCase() === 'danger' || item.type?.toLowerCase() === 'warning') ? 'text-red-400' : 'text-blue-400'">
                    </i>
                </div>
            </div>

            <div class="relative">
                <div class="absolute -left-2 top-0 w-1 h-full bg-white/5 rounded-full"></div>
                <p class="text-[13px] md:text-sm font-medium text-slate-300 leading-relaxed text-justify tracking-tight pl-4">
                    {{ item.text }}
                </p>
            </div>
            
            <div class="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                <div class="flex items-center gap-2 opacity-30 group-hover:opacity-60 transition-opacity">
                    <i data-lucide="fingerprint" class="w-3 h-3"></i>
                    <span class="text-[8px] font-black uppercase tracking-widest italic">Core Analysis Engine v3.0</span>
                </div>
                <div class="px-2 py-0.5 rounded bg-white/5 opacity-30 text-[8px] font-bold">
                    {{ new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }} WIB
                </div>
            </div>
        </div>
    </div>
</div>
    

    <div v-if="pendingActivity" class="bento-card p-6 border-2 border-amber-400 bg-amber-50/50 mb-8">
        <div class="flex flex-col md:flex-row items-center justify-between gap-6">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center border border-amber-200">
                    <i data-lucide="award" class="w-6 h-6 text-amber-600"></i>
                </div>
                <div>
                    <h3 class="font-black text-slate-900 uppercase tracking-tighter">Feedback Required</h3>
                    <p class="text-sm text-slate-600 font-bold uppercase tracking-tight">{{ pendingActivity.name }}</p>
                </div>
            </div>
            <button @click="openRpeModal" class="px-8 py-3 bg-slate-900 text-white rounded-xl font-black italic text-sm tracking-widest hover:bg-blue-600 transition-all">
                RATE EFFORT
            </button>
        </div>
    </div>

    <div class="bento-grid-detailed mb-8">
        <div class="bento-card p-6">
            <h3 class="text-card-title mb-6 flex items-center gap-2"><i data-lucide="bar-chart-3" class="w-4 h-4 text-blue-500"></i> Power Efficiency</h3>
            <div class="space-y-6">
                <div v-for="insight in efficiencyInsights" :key="insight.label" class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div class="flex justify-between items-end mb-2">
                        <p class="label-muted text-[10px] uppercase font-black tracking-widest">{{ insight.label }}</p>
                        <p class="stat-value text-lg">{{ insight.value }}</p>
                    </div>
                    <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div class="h-full bg-blue-600 transition-all" :style="{ width: insight.percentage + '%' }"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="bento-card p-6">
            <h3 class="text-card-title mb-6 flex items-center gap-2"><i data-lucide="history" class="w-4 h-4 text-slate-400"></i> Interaction Log</h3>
            <div class="space-y-4">
                <div v-for="log in coachHistory" :key="log.id" class="flex gap-4 p-3 rounded-2xl border border-transparent">
                    <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                         <i :data-lucide="log.type === 'Warning' ? 'alert-triangle' : 'check-circle-2'" :class="log.type === 'Warning' ? 'text-amber-500' : 'text-green-500'" class="w-4 h-4"></i>
                    </div>
                    <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{{ log.date }}</p>
                        <p class="text-xs font-bold text-slate-900 leading-tight mt-0.5">{{ log.message }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div v-if="isRecoveryModalOpen" class="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-md px-4 pb-4 animate-in fade-in">
        <div class="w-full max-w-md bg-slate-900 border border-white/10 rounded-[32px] p-8 shadow-2xl animate-in slide-in-from-bottom-8">
            <div class="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8"></div>
            
            <header class="text-center mb-8">
                <h2 class="text-2xl font-black italic tracking-tighter text-white uppercase">Bio-Signal Sync</h2>
                <p class="text-slate-400 text-[10px] mt-1 font-black uppercase tracking-widest italic">Calibration Engine v3.0</p>
            </header>

            <div class="space-y-6">
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <label class="text-[8px] font-black text-slate-500 uppercase block mb-2 text-center tracking-widest">Sleep Quality</label>
                        <input type="number" v-model="recoveryForm.quality" min="1" max="10" class="bg-transparent text-white font-black text-2xl w-full text-center focus:outline-none">
                    </div>
                    <div class="bg-blue-600/10 p-4 rounded-2xl border border-blue-500/30">
                        <label class="text-[8px] font-black text-blue-400 uppercase block mb-2 text-center tracking-widest">Morning RHR</label>
                        <input type="number" v-model="recoveryForm.rhr" class="bg-transparent text-white text-2xl font-black italic w-full text-center focus:outline-none">
                    </div>
                </div>

                <div class="bg-slate-800/50 p-6 rounded-3xl border border-white/5">
                    <div class="flex justify-between items-center mb-4">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leg Soreness</label>
                        <span class="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-[10px] font-black italic">SCORE: {{ sorenessValue }}/10</span>
                    </div>

                    <div class="flex items-center gap-6">
                        <div class="w-16 h-16 bg-slate-900 rounded-2xl flex flex-col items-center justify-center border border-white/10 shadow-inner">
                            <i :data-lucide="currentSorenessIcon" class="w-8 h-8 text-blue-400 mb-1"></i>
                        </div>

                        <div class="flex-1">
                            <input type="range" min="1" max="10" v-model="sorenessValue" 
                                   class="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500">
                            <div class="flex justify-between mt-3">
                                <span class="text-[9px] font-black text-red-500 uppercase italic">Heavy</span>
                                <span class="text-[9px] font-black text-slate-500 uppercase tracking-tighter">{{ sorenessLabel }}</span>
                                <span class="text-[9px] font-black text-green-500 uppercase italic">Fresh</span>
                            </div>
                        </div>
                    </div>
                </div>

                <button @click="saveRecovery" class="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black italic tracking-[0.2em] hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/20">
                    UPDATE BIO-ENGINE
                </button>
                
                <button @click="isRecoveryModalOpen = false" class="w-full text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">Dismiss</button>
            </div>
        </div>
    </div>

    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-md px-4 pb-4 animate-in fade-in">
        <div class="w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl animate-in slide-in-from-bottom-8">
            <div class="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8"></div>
            <header class="text-center mb-8">
                <h2 class="text-2xl font-black italic tracking-tighter text-slate-900 uppercase">Rate Your Effort</h2>
                <p class="text-slate-400 text-xs mt-1 uppercase font-black tracking-widest">{{ pendingActivity?.name }}</p>
            </header>
            <div class="px-4 text-center">
                <input type="range" min="1" max="10" v-model="rpeValue" class="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-8">
                <div class="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8">
                    <span class="text-5xl font-black italic tracking-tighter text-blue-600">{{ rpeValue }}</span>
                    <p class="font-black text-slate-900 uppercase mt-2 italic">{{ getRpeLabel(rpeValue) }}</p>
                </div>
                <button @click="saveRpe" class="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black italic tracking-[0.2em] hover:bg-blue-600 transition-all">
                    SAVE EVALUATION
                </button>
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
    <div class="bento-card p-6 bg-white border border-slate-100">
        <div class="flex items-center justify-between mb-6">
            <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-400">Load vs Readiness Correlation</h3>
            <div class="flex items-center gap-4">
                <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span class="text-[9px] font-bold text-slate-400 uppercase">Load</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-slate-900"></span>
                    <span class="text-[9px] font-bold text-slate-400 uppercase">Readiness</span>
                </div>
            </div>
        </div>
        <div class="h-[200px] w-full">
            <canvas id="correlationChart"></canvas>
        </div>
    </div>

    <div class="bento-card p-6 bg-white border border-slate-100">
        <div class="flex items-center justify-between mb-6">
            <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-400">RHR Baseline Analysis</h3>
            <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-blue-400"></span>
                <span class="text-[9px] font-bold text-slate-400 uppercase">Morning RHR</span>
            </div>
        </div>
        <div class="h-[200px] w-full">
            <canvas id="rhrChart"></canvas>
        </div>
    </div>
</div>

</div>
`;
