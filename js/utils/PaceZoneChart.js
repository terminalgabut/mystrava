// js/utils/PaceZoneChart.js
import { PerformanceLogic } from './PerformanceLogic.js';

export default {
    name: 'PaceZoneChart',
    props: {
        splits: { type: Array, required: true },
        threshold: { type: Number, required: true }
    },
    template: `
    <div class="bg-white p-7 rounded-[3rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative">
        <div class="flex items-start justify-between mb-8 px-1">
            <div>
                <h3 class="font-black text-slate-900 flex items-center gap-2.5 text-base tracking-tight">
                    <div class="p-2 bg-blue-50 rounded-xl">
                        <i data-lucide="bar-chart-big" class="w-4 h-4 text-blue-600"></i>
                    </div>
                    Pace Zones
                </h3>
                <p class="text-[10px] font-bold text-slate-400 mt-1 ml-10 uppercase tracking-[0.15em]">Intensity Distribution</p>
            </div>
            <div class="bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                <span class="text-[10px] font-black text-slate-600 tabular-nums">{{ totalTimeDisplay }}</span>
            </div>
        </div>

        <div class="space-y-6">
            <div v-for="zone in zoneDistribution" 
                 :key="zone.id" 
                 class="group relative transition-all duration-300 hover:translate-x-1"
                 v-if="zone.time > 0 || zone.id <= 4"> <div class="flex justify-between items-end mb-2 px-1">
                    <div class="flex flex-col">
                        <div class="flex items-center gap-2">
                            <div class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: zone.color }"></div>
                            <span class="text-[11px] font-black text-slate-900 tracking-tight">Z{{ zone.id }}</span>
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{{ zone.label }}</span>
                        </div>
                    </div>
                    
                    <div class="flex flex-col items-end">
                        <span class="text-[11px] font-black text-slate-900 tabular-nums">
                            {{ zone.percentage }}%
                        </span>
                        <span class="text-[9px] font-bold text-slate-400 tabular-nums leading-none mt-0.5">
                            {{ formatDuration(zone.time) }}
                        </span>
                    </div>
                </div>
                
                <div class="h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-50/50 shadow-inner p-[2px]">
                    <div class="h-full transition-all duration-1000 cubic-bezier(0.34, 1.56, 0.64, 1) rounded-full shadow-sm relative"
                         :style="{ width: zone.percentage + '%', backgroundColor: zone.color }">
                        <div class="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="mt-8 pt-5 border-t border-slate-50 flex justify-between items-center px-1">
            <div class="flex items-center gap-1.5">
                <i data-lucide="info" class="w-3 h-3 text-slate-300"></i>
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Based on {{ threshold }}s threshold</span>
            </div>
            <button @click="refreshChart" class="text-slate-300 hover:text-blue-500 transition-colors">
                <i data-lucide="refresh-cw" class="w-3 h-3"></i>
            </button>
        </div>
    </div>
    `,
    computed: {
        zoneDistribution() {
            if (!this.splits || !this.threshold) return [];

            const stats = {
                6: { id: 6, label: 'Neuromuscular', time: 0, color: '#0F172A' },
                5: { id: 5, label: 'Anaerobic', time: 0, color: '#EF4444' },
                4: { id: 4, label: 'Threshold', time: 0, color: '#0052FF' },
                3: { id: 3, label: 'Tempo', time: 0, color: '#EAB308' },
                2: { id: 2, label: 'Endurance', time: 0, color: '#22C55E' },
                1: { id: 1, label: 'Recovery', time: 0, color: '#64748B' }
            };

            let totalMovingTime = 0;

            this.splits.forEach(s => {
                // Guard clause untuk speed 0
                if (!s.average_speed || s.average_speed <= 0) return;

                const paceSec = 1000 / s.average_speed;
                const zoneId = PerformanceLogic.getRunZone(paceSec, this.threshold);
                const duration = s.moving_time || 0;
                
                if(stats[zoneId]) {
                    stats[zoneId].time += duration;
                    totalMovingTime += duration;
                }
            });

            // Menyimpan total untuk header
            this.totalSeconds = totalMovingTime;

            return Object.values(stats).reverse().map(z => ({
                ...z,
                percentage: totalMovingTime > 0 ? Math.round((z.time / totalMovingTime) * 100) : 0
            }));
        },
        totalTimeDisplay() {
            return this.formatDuration(this.totalSeconds || 0);
        }
    },
    data() {
        return {
            totalSeconds: 0
        };
    },
    methods: {
        formatDuration(sec) {
            if (!sec) return '0s';
            const m = Math.floor(sec / 60);
            const s = Math.round(sec % 60);
            return m > 0 ? `${m}m ${s}s` : `${s}s`;
        },
        refreshChart() {
            if (window.lucide) window.lucide.createIcons();
        }
    },
    mounted() {
        if (window.lucide) window.lucide.createIcons();
    }
};
