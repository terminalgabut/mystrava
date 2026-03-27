// js/utils/PaceZoneChart.js
import { PerformanceLogic } from './PerformanceLogic.js';

export default {
    name: 'PaceZoneChart',
    props: {
        splits: { type: Array, required: true },
        threshold: { type: Number, required: true }
    },
    template: `
    <div class="bg-white p-7 rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden relative">
        <div class="flex items-start justify-between mb-8 px-1">
            <div>
                <h3 class="font-black text-slate-900 flex items-center gap-2.5 text-base tracking-tight">
                    <div class="p-2 bg-blue-50 rounded-xl">
                        <i data-lucide="bar-chart-big" class="w-4 h-4 text-blue-600"></i>
                    </div>
                    Zona Pace
                </h3>
                <p class="text-[10px] font-bold text-slate-400 mt-1 ml-10 uppercase tracking-[0.15em]">Distribusi Intensitas</p>
            </div>
            <div class="bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                <span class="text-[10px] font-black text-slate-600 tabular-nums">{{ totalTimeDisplay }}</span>
            </div>
        </div>

        <div class="space-y-5">
            <template v-for="zone in zoneDistribution" :key="zone.id">
                <div class="group relative transition-all duration-300">
                    <div class="flex justify-between items-center mb-2 px-1">
                        <div class="flex items-center gap-2 w-24">
                            <span class="text-[11px] font-black text-slate-900 tracking-tight">Z{{ zone.id }}</span>
                            <span class="text-[9px] font-bold text-slate-400 uppercase truncate">{{ zone.label }}</span>
                        </div>
                        
                        <div class="flex-1 h-2.5 bg-slate-50 rounded-full overflow-hidden mx-4 relative border border-slate-50 shadow-inner">
                            <div class="h-full transition-all duration-1000 rounded-full"
                                 :style="{ width: zone.percentage + '%', backgroundColor: zone.color }">
                            </div>
                        </div>

                        <div class="flex items-center gap-3 w-32 justify-end">
                            <span class="text-[10px] font-black text-slate-900 w-8 text-right">{{ zone.percentage }}%</span>
                            <span class="text-[10px] font-bold text-slate-400 tabular-nums w-20 text-right">{{ zone.range }}</span>
                        </div>
                    </div>
                </div>
            </template>
        </div>

        <div class="mt-8 pt-5 border-t border-slate-50 flex justify-between items-center px-1">
            <div class="flex items-center gap-1.5">
                <i data-lucide="info" class="w-3 h-3 text-slate-300"></i>
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider italic">Berdasarkan ambang batas {{ threshold }} dtk</span>
            </div>
        </div>
    </div>
    `,

    computed: {
        processedStats() {
            if (!Array.isArray(this.splits) || !this.threshold) {
                return { zones: [], total: 0 };
            }

            // Dapatkan range pace dari PerformanceLogic
            const ranges = PerformanceLogic.getZoneRanges(this.threshold);

            const stats = {
                6: { id: 6, label: 'Neuromuscular', time: 0, color: '#0F172A', range: ranges[6].display },
                5: { id: 5, label: 'Anaerobic', time: 0, color: '#EF4444', range: ranges[5].display },
                4: { id: 4, label: 'Ambang Batas', time: 0, color: '#0052FF', range: ranges[4].display },
                3: { id: 3, label: 'Tempo', time: 0, color: '#EAB308', range: ranges[3].display },
                2: { id: 2, label: 'Endurance', time: 0, color: '#22C55E', range: ranges[2].display },
                1: { id: 1, label: 'Recovery', time: 0, color: '#64748B', range: ranges[1].display }
            };

            let totalTime = 0;
            this.splits.forEach(s => {
                if (!s.average_speed || s.average_speed <= 0) return;
                const paceSec = 1000 / s.average_speed;
                const zoneId = PerformanceLogic.getRunZone(paceSec, this.threshold);
                const duration = s.moving_time || 0;
                
                if (stats[zoneId]) {
                    stats[zoneId].time += duration;
                    totalTime += duration;
                }
            });

            return { 
                zones: Object.values(stats).reverse().map(z => ({
                    ...z,
                    percentage: totalTime > 0 ? Math.round((z.time / totalTime) * 100) : 0
                })), 
                total: totalTime 
            };
        },

        zoneDistribution() { return this.processedStats.zones; },
        totalTimeDisplay() { return this.formatDuration(this.processedStats.total); }
    },

    methods: {
        formatDuration(sec) {
            if (!sec) return '0d';
            const m = Math.floor(sec / 60);
            const s = Math.round(sec % 60);
            return m > 0 ? `${m}m ${s}d` : `${s}d`;
        }
    },

    mounted() {
        if (window.lucide) window.lucide.createIcons();
    }
};
