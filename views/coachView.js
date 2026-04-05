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
    </header>


    <div v-if="!isRecoverySynced" class="bento-card p-6 border-2 border-blue-500 bg-slate-900 text-white mb-8 shadow-2xl shadow-blue-500/20">
        <div class="flex flex-col md:flex-row items-center justify-between gap-6">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                    <i data-lucide="activity" class="w-6 h-6 text-blue-400"></i>
                </div>
                <div>
                    <h3 class="font-black text-white uppercase tracking-tighter">Bio-Signal Sync Required</h3>
                    <p class="text-[10px] text-blue-400 font-black uppercase tracking-widest leading-none mb-1">
                        Morning Recovery Check-in
                    </p>
                    <p class="text-sm text-slate-400 font-bold uppercase tracking-tight">
                        Current RHR trend detected: 69 BPM
                    </p>
                </div>
            </div>
            <button @click="openRecoveryModal" class="px-8 py-3 bg-blue-600 text-white rounded-xl font-black italic text-sm tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/40">
                SYNC MORNING DATA
            </button>
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        </div>

    <div v-if="isRecoveryModalOpen" class="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-md px-4 pb-4 animate-in fade-in">
        <div class="w-full max-w-md bg-slate-900 border border-white/10 rounded-[32px] p-8 shadow-2xl shadow-blue-500/20 animate-in slide-in-from-bottom-8">
            <div class="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8"></div>
            
            <header class="text-center mb-8">
                <p class="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Manual Bio-Data</p>
                <h2 class="text-2xl font-black italic tracking-tighter text-white">RECOVERY CHECK-IN</h2>
                <p class="text-slate-400 text-xs mt-1 italic">Input your signals for WIB Timezone</p>
            </header>

            <div class="space-y-6">
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <label class="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-2">Sleep Start</label>
                        <input type="time" v-model="recoveryForm.start" class="bg-transparent text-white font-black text-xl w-full focus:outline-none">
                    </div>
                    <div class="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <label class="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-2">Wake Up</label>
                        <input type="time" v-model="recoveryForm.end" class="bg-transparent text-white font-black text-xl w-full focus:outline-none">
                    </div>
                </div>

                <div class="bg-white/5 p-6 rounded-3xl border border-white/10">
                    <div class="flex justify-between mb-4">
                        <span class="text-[10px] font-black text-slate-400 uppercase">Sleep Quality (1-10)</span>
                        <span class="text-blue-400 font-black">{{ recoveryForm.quality }}/10</span>
                    </div>
                    <input type="range" min="1" max="10" v-model="recoveryForm.quality" class="w-full h-2 bg-slate-800 rounded-lg appearance-none accent-blue-500">
                </div>

                <div class="bg-blue-600/10 p-6 rounded-3xl border border-blue-500/30">
                    <label class="text-[10px] font-black text-blue-400 uppercase block mb-2">Morning RHR (BPM)</label>
                    <input type="number" v-model="recoveryForm.rhr" placeholder="69" class="bg-transparent text-white text-4xl font-black italic tracking-tighter w-full focus:outline-none">
                </div>

                <button @click="saveRecovery" class="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black italic tracking-[0.2em] hover:bg-blue-500 transition-all">
                    UPDATE BIO-ENGINE
                </button>
            </div>
        </div>
    </div>
    

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bento-card p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div class="absolute top-0 right-0 p-4 opacity-10">
                <i data-lucide="zap" class="w-20 h-20 text-blue-600"></i>
            </div>
            <span class="label-muted mb-4 uppercase tracking-[0.2em] text-[10px]">Readiness Score</span>
            <div class="relative mb-4">
                <div class="w-24 h-24 rounded-full border-[8px] border-slate-50 flex items-center justify-center"
                     :style="{ borderTopColor: getStatusColor(readinessScore) }">
                    <h2 class="stat-value text-3xl">{{ readinessScore }}%</h2>
                </div>
            </div>
            <p class="font-black text-slate-900 uppercase italic tracking-tighter">{{ readinessStatus }}</p>
        </div>

        <div class="bento-card md:col-span-2 p-8 bg-slate-900 text-white relative shadow-2xl shadow-blue-200">
            <div class="flex items-start justify-between mb-6">
                <div>
                    <p class="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-2">Today's Prescription</p>
                    <h2 class="text-3xl font-black italic tracking-tighter leading-none">
                        {{ coachBrief.recommendation || 'Analyzing Data...' }}
                    </h2>
                </div>
                <div class="icon-box bg-white/10 border-white/20">
                    <i data-lucide="sparkles" class="w-6 h-6 text-blue-300"></i>
                </div>
            </div>
            
            <div class="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                <p class="text-sm font-medium text-slate-300 leading-relaxed italic">
                    "{{ coachBrief.breathing_tip }}"
                </p>
            </div>
        </div>
    </div>

    <div v-if="pendingActivity" class="bento-card p-6 border-2 border-amber-400 bg-amber-50/50 mb-8 animate-bounce-subtle">
        <div class="flex flex-col md:flex-row items-center justify-between gap-6">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center border border-amber-200">
                    <i :data-lucide="pendingActivity.type === 'Hike' ? 'mountain' : 'run'" class="w-6 h-6 text-amber-600"></i>
                </div>
                <div>
                    <h3 class="font-black text-slate-900 uppercase tracking-tighter">Feedback Required</h3>
                    <p class="text-[10px] text-amber-700 font-black uppercase tracking-widest leading-none mb-1">
                        {{ pendingActivity.type }}
                    </p>
                    <p class="text-sm text-slate-600 font-bold uppercase tracking-tight">
                        {{ pendingActivity.name }}
                    </p>
                </div>
            </div>
            <button @click="openRpeModal" class="px-8 py-3 bg-slate-900 text-white rounded-xl font-black italic text-sm tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200">
                RATE EFFORT
            </button>
        </div>
    </div>

    <div class="bento-grid-detailed mb-8">
        <div class="bento-card p-6">
            <h3 class="text-card-title mb-6 flex items-center gap-2">
                <i data-lucide="bar-chart-3" class="w-4 h-4 text-blue-500"></i>
                Power Efficiency
            </h3>
            <div class="space-y-6">
                <div v-for="insight in efficiencyInsights" :key="insight.label" class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div class="flex justify-between items-end mb-2">
                        <p class="label-muted text-[10px] uppercase font-black tracking-widest">{{ insight.label }}</p>
                        <p class="stat-value text-lg" :class="insight.value === 'DANGER' ? 'text-red-600' : 'text-slate-900'">
                            {{ insight.value }}
                        </p>
                    </div>
                    <div class="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div class="h-full transition-all" 
                             :class="insight.percentage > 80 && insight.label.includes('Workload') ? 'bg-red-500' : 'bg-blue-600'"
                             :style="{ width: insight.percentage + '%' }">
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="bento-card p-6">
            <h3 class="text-card-title mb-6 flex items-center gap-2">
                <i data-lucide="history" class="w-4 h-4 text-slate-400"></i>
                Coach Interaction Log
            </h3>
            <div class="space-y-4">
                <div v-for="log in coachHistory" :key="log.id" class="flex gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                    <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                         <i :data-lucide="log.type === 'Warning' ? 'alert-triangle' : 'check-circle-2'" 
                            :class="log.type === 'Warning' ? 'text-amber-500' : 'text-green-500'" class="w-4 h-4"></i>
                    </div>
                    <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{{ log.date }}</p>
                        <p class="text-xs font-bold text-slate-900 leading-tight mt-0.5">{{ log.message }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 mb-12">
        <div v-for="item in dynamicInsights" :key="item.title" 
             class="bento-card p-8 bg-slate-900 text-white relative shadow-2xl transition-all"
             :class="{ 'border-red-500/40 ring-1 ring-red-500/20 shadow-red-500/10': item.type === 'danger' }">
            
            <div class="flex items-start justify-between mb-6">
                <div>
                    <p class="text-[10px] font-black uppercase tracking-widest mb-2"
                       :class="item.type === 'danger' ? 'text-red-400' : 'text-blue-400'">
                        {{ item.type === 'danger' ? 'System Alert' : 'Coach Intelligence' }}
                    </p>
                    <h2 class="text-3xl font-black italic tracking-tighter leading-none">
                        {{ item.title }}
                    </h2>
                </div>
                <div class="icon-box bg-white/10 border-white/20">
                    <i :data-lucide="item.type === 'danger' ? 'alert-octagon' : 'sparkles'" 
                       class="w-6 h-6" 
                       :class="item.type === 'danger' ? 'text-red-400' : 'text-blue-300'"></i>
                </div>
            </div>
            
            <div class="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                <p class="text-sm font-medium text-slate-300 leading-relaxed italic">
                    "{{ item.text }}"
                </p>
            </div>
            
            <div class="mt-6 pt-4 border-t border-white/5 flex items-center justify-between opacity-40">
                <span class="text-[8px] font-black uppercase tracking-widest">Neural Analysis Active</span>
                <span class="text-[8px] italic">ACWR Method</span>
            </div>
        </div>
    </div>

    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm px-4 pb-4 animate-in fade-in">
        <div class="w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl animate-in slide-in-from-bottom-8">
            <div class="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8"></div>
            
            <div class="text-center mb-6">
                <p class="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] leading-none mb-1">
                    {{ pendingActivity?.type }}
                </p>
                <h3 class="text-lg font-black text-slate-900 uppercase tracking-tighter">
                    {{ pendingActivity?.name }}
                </h3>
            </div>

            <header class="text-center mb-8">
                <p class="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Feeling Check</p>
                <h2 class="text-2xl font-black italic tracking-tighter text-slate-900">HOW HARD WAS IT?</h2>
                <p class="text-caption mt-1">Rate your perceived effort (1-10)</p>
            </header>

            <div class="px-4">
                <input type="range" min="1" max="10" v-model="rpeValue" 
                       class="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-6">
                
                <div class="flex justify-between items-center bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8 transition-all">
                    <div class="text-left">
                        <span class="text-4xl font-black italic tracking-tighter" :style="{ color: getStatusColor(rpeValue * 10) }">
                            {{ rpeValue }}
                        </span>
                    </div>
                    <div class="text-right">
                        <p class="font-black text-slate-900 uppercase tracking-tighter leading-none">{{ getRpeLabel(rpeValue) }}</p>
                        <p class="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{{ getRpeDescription(rpeValue) }}</p>
                    </div>
                </div>

                <button @click="saveRpe" 
                        class="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black italic tracking-[0.2em] hover:bg-blue-600 active:scale-95 transition-all shadow-xl shadow-blue-100">
                    SAVE EVALUATION
                </button>
            </div>
        </div>
    </div>
</div>
`;
