// coachView.js
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

    <div class="bento-grid-detailed">
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

    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm px-4 pb-4 animate-in fade-in">
        <div class="w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl animate-in slide-in-from-bottom-8">
            <div class="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8"></div>
            
            <header class="text-center mb-8">
                <p class="text-blue-600 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Feeling Check</p>
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
