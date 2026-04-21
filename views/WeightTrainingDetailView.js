// root/views/WeightTrainingDetailView.js

export default `
<div class="activity-detail-wrapper animate-in pb-12">
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div class="flex items-center gap-4">
            <button @click="$router.back()" class="p-2 bg-white border border-slate-200 rounded-xl shadow-sm">
                <i data-lucide="arrow-left" class="w-5 h-5 text-slate-600"></i>
            </button>
            <div>
                <h1 class="text-2xl font-black text-slate-900 tracking-tight">{{ activity?.name }}</h1>
                <p class="text-slate-500 text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 mt-1">
                    <span class="text-rose-600 font-black">Weight Training</span>
                    <span class="text-slate-300">•</span>
                    <span>{{ formatDate(activity?.start_date) }}</span>
                </p>
            </div>
        </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm border-l-4 border-l-rose-500">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Volume</p>
                    <p class="text-3xl font-black text-slate-900 leading-none">
                        {{ totalVolume }} <span class="text-sm text-slate-400">kg</span>
                    </p>
                </div>
                <div class="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm border-l-4 border-l-rose-500">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Reps</p>
                    <p class="text-3xl font-black text-slate-900 leading-none">
                        {{ totalReps }} <span class="text-sm text-slate-400">times</span>
                    </p>
                </div>
            </div>

            <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div class="p-6 border-b border-slate-50 flex justify-between items-center">
                    <h3 class="font-black text-slate-900">Exercise Details</h3>
                    <label v-if="!workoutDetails.length" class="cursor-pointer bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-rose-100">
                        Import CSV
                        <input type="file" class="hidden" @change="handleLyftaUpload" accept=".csv">
                    </label>
                </div>
                
                <div v-if="workoutDetails.length" class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase">
                            <tr>
                                <th class="p-6">Exercise</th>
                                <th class="p-6 text-center">Weight</th>
                                <th class="p-6 text-center">Reps</th>
                                <th class="p-6 text-right">Volume</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-50">
                            <tr v-for="set in workoutDetails" class="hover:bg-slate-50/30">
                                <td class="p-6">
                                    <p class="text-sm font-black text-slate-900">{{ set.exercise_name }}</p>
                                    <p class="text-[9px] font-bold text-slate-400 uppercase">{{ set.set_type }}</p>
                                </td>
                                <td class="p-6 text-center text-sm font-bold">{{ set.weight }}kg</td>
                                <td class="p-6 text-center text-sm font-bold">{{ set.reps }}</td>
                                <td class="p-6 text-right text-sm font-black text-rose-600">{{ set.weight * set.reps }}kg</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-else class="p-20 text-center">
                    <i data-lucide="dumbbell" class="w-12 h-12 text-slate-200 mx-auto mb-4"></i>
                    <p class="text-slate-400 font-bold uppercase text-[10px]">No Data Imported</p>
                </div>
            </div>
        </div>

        <div class="space-y-6">
            <div class="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden">
                <h3 class="font-black text-lg mb-6 text-rose-400">Time Session</h3>
                <div class="space-y-4 relative z-10">
                    <div>
                        <p class="text-white/40 text-[10px] font-bold uppercase mb-1">Duration</p>
                        <p class="text-4xl font-black text-white">{{ formatTime(activity?.moving_time) }}</p>
                    </div>
                    <div class="pt-4 border-t border-white/10">
                        <p class="text-white/40 text-[10px] font-bold uppercase mb-1">Calories Burned</p>
                        <p class="text-2xl font-black text-rose-400">{{ activity?.calories }} kcal</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
`;
