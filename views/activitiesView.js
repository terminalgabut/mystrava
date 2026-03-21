export default `
<div class="activities-wrapper animate-in">
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
            <h1 class="text-3xl font-black text-slate-900 tracking-tight">Activities</h1>
            <p class="text-slate-500 text-sm mt-1">Review your full training history</p>
        </div>
        
        <div class="flex items-center gap-3">
            <div class="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                <p class="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">Data Dimuat</p>
                <p class="text-sm font-bold text-blue-900 leading-none">{{ activities.length }} Aktivitas</p>
            </div>
            <button @click="loadActivities" 
                    class="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                    :disabled="loading">
                <i data-lucide="refresh-cw" class="w-5 h-5 text-slate-600" :class="{'animate-spin': loading}"></i>
            </button>
        </div>
    </header>

    <div class="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
        <button v-for="type in ['All', 'Run', 'Ride', 'Walk']" 
                :key="type"
                @click="filterType = type"
                :class="filterType === type ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'"
                class="px-5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap">
            {{ type }}
        </button>
    </div>

    <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-slate-50/50 border-b border-slate-100">
                        <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Activity</th>
                        <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Type</th>
                        <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Distance</th>
                        <th class="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Date</th>
                        <th class="px-6 py-4 w-10"></th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                    <tr v-for="act in filteredActivities" 
                        :key="act.id" 
                        @click="goToDetail(act.id)"
                        class="group hover:bg-blue-50/30 cursor-pointer transition-all">
                        
                        <td class="px-6 py-4">
                            <p class="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{{ act.name }}</p>
                            <p class="text-[10px] text-slate-400 mt-0.5 font-mono">ID: {{ act.id.toString().slice(0,8) }}</p>
                        </td>
                        
                        <td class="px-6 py-4 text-center">
                            <div :class="getTypeIconClass(act.type)" class="w-10 h-10 rounded-xl flex items-center justify-center mx-auto transition-transform group-hover:scale-110">
                                <i :data-lucide="getIconName(act.type)" class="w-5 h-5"></i>
                            </div>
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

        <div v-if="filteredActivities.length === 0 && !loading" class="py-20 text-center">
             <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <i data-lucide="search-x" class="w-8 h-8"></i>
            </div>
            <p class="text-slate-400 text-sm font-medium">Tidak ada aktivitas dengan tipe ini.</p>
        </div>
        <div v-if="loading" class="p-6 space-y-4">
            <div v-for="i in 5" class="h-16 w-full bg-slate-50/50 rounded-2xl animate-pulse"></div>
        </div>
    </div>
</div>
`;
