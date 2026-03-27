// js/utils/PaceZoneChart.js
import { PerformanceLogic } from './PerformanceLogic.js';

export default {
    name: 'PaceZoneChart',
    props: {
        splits: { type: Array, required: true },
        threshold: { type: Number, required: true }
    },
    template: `
    <div class="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div class="flex items-center justify-between mb-6 px-1">
            <h3 class="font-black text-slate-900 flex items-center gap-2 text-sm uppercase tracking-tight">
                <i data-lucide="gauge" class="w-4 h-4 text-blue-500"></i>
                Pace Zones
            </h3>
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Time Distribution</span>
        </div>

        <div class="space-y-4">
            <div v-for="zone in zoneDistribution" :key="zone.id" class="group relative">
                <div class="flex justify-between items-end mb-1.5 px-1">
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] font-black text-slate-900">Z{{ zone.id }}</span>
                        <span class="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{{ zone.label }}</span>
                    </div>
                    <div class="text-right">
                        <span class="text-[10px] font-black text-slate-900 tabular-nums">{{ zone.percentage }}%</span>
                        <p class="text-[8px] font-bold text-slate-400 leading-none">{{ formatDuration(zone.time) }}</p>
                    </div>
                </div>
                
                <div class="h-2.5 bg-slate-50 rounded-full overflow-hidden">
                    <div class="h-full transition-all duration-700 ease-out rounded-full"
                         :style="{ width: zone.percentage + '%', backgroundColor: zone.color }">
                    </div>
                </div>
            </div>
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
                const paceSec = 1000 / s.average_speed;
                const zoneId = PerformanceLogic.getRunZone(paceSec, this.threshold);
                const duration = s.moving_time || 0;
                
                if(stats[zoneId]) {
                    stats[zoneId].time += duration;
                    totalMovingTime += duration;
                }
            });

            return Object.values(stats).reverse().map(z => ({
                ...z,
                percentage: totalMovingTime > 0 ? Math.round((z.time / totalMovingTime) * 100) : 0
            }));
        }
    },
    methods: {
        formatDuration(sec) {
            const m = Math.floor(sec / 60);
            const s = Math.round(sec % 60);
            return m > 0 ? `${m}m ${s}s` : `${s}s`;
        }
    },
    mounted() {
        if (window.lucide) window.lucide.createIcons();
    }
};
