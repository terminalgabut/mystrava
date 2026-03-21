export default `
<div class="activities-wrapper animate-in">
    <header class="flex justify-between items-center mb-8">
        <div>
            <h1 class="text-3xl font-black text-slate-900 tracking-tight">Activities</h1>
            <p class="text-slate-500 text-sm mt-1">Review your full training history</p>
        </div>
        
        <div class="flex gap-2">
            <button @click="loadActivities" 
                    class="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-95"
                    :disabled="loading">
                <i data-lucide="refresh-cw" class="w-5 h-5 text-slate-600" :class="{'animate-spin': loading}"></i>
            </button>
        </div>
    </header>

    <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-slate-50/50 border-b border-slate-100">
                        <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Activity</th>
                        <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                        <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Distance</th>
                        <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Date</th>
                        <th class="px-6 py-4 w-10"></th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                    <tr v-for="act in activities" 
                        :key="act.id" 
                        @click="goToDetail(act.id)"
                        class="group hover:bg-blue-50/30 cursor-pointer transition-all">
                        
                        <td class="px-6 py-4">
                            <p class="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{{ act.name }}</p>
                            <p class="text-[10px] text-slate-400 mt-0.5 font-mono">ID: {{ act.id.toString().slice(0,8) }}</p>
                        </td>
                        
                        <td class="px-6 py-4">
                            <span :class="getTypeBadgeClass(act.type)" class="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tight">
                                {{ act.type }}
                            </span>
                        </td>

                        <td class="px-6 py-4 text-right">
                            <span class="text-sm font-black text-slate-700">{{ (act.distance / 1000).toFixed(2) }}</span>
                            <span class="text-[10px] text-slate-400 ml-1">km</span>
                        </td>

                        <td class="px-6 py-4 text-right text-sm text-slate-500 font-medium">
                            {{ formatDate(act.start_date) }}
                        </td>

                        <td class="px-6 py-4 text-right">
                            <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300 group-hover:text-blue-400 transform group-hover:translate-x-1 transition-all"></i>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-if="activities.length === 0 && !loading" class="py-20 text-center">
            <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <i data-lucide="database" class="w-8 h-8 text-slate-200"></i>
            </div>
            <p class="text-slate-400 text-sm font-medium">No activities found in your database.</p>
        </div>

        <div v-if="loading" class="p-6 space-y-4">
            <div v-for="i in 5" class="h-16 w-full bg-slate-50/50 rounded-2xl animate-pulse"></div>
        </div>
    </div>
</div>
`;
