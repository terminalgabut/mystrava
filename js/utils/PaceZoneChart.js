// js/utils/PaceZoneChart.js
import { PerformanceLogic } from './performanceLogic.js';

export default {
    name: 'PaceZoneChart',
    props: {
        splits: { type: Array, required: true },
        threshold: { type: Number, required: true }
    },
    template: `
    <div class="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div class="flex items-center justify-between mb-6">
            <h3 class="font-black text-slate-900 flex items-center gap-2">
                <i data-lucide="bar-chart-2" class="w-4 h-4 text-blue-500"></i>
                Pace Zones
            </h3>
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Time Distribution</span>
        </div>

        <div class="space-y-3">
            <div v-for="zone in zoneDistribution" :key="zone.id" class="group">
                <div class="flex justify-between items-end mb-1 px-1">
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] font-black text-slate-900 w-4">Z{{ zone.id }}</span>
                        <span class="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{{ zone.label }}</span>
                    </div>
                    <span class="text-[10px] font-black text-slate-900">{{ zone.percentage }}%</span>
                </div>
                
                <div class="h-2 bg-slate-50 rounded-full overflow-hidden">
                    <div class="h-full transition-all duration-1000 ease-out rounded-full"
                         :style="{ 
                            width: zone.percentage + '%', 
                            backgroundColor: zone.color 
                         }">
                    </div>
                </div>
            </div>
        </div>
    </div>
    `,
    computed: {
        zoneDistribution() {
            if (!this.splits || !this.threshold) return [];

            // Inisialisasi total waktu per zona (Z1 - Z6)
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
                const pace = 1000 / s.average_speed;
                const zoneId = PerformanceLogic.getRunZone(pace, this.threshold);
                const duration = s.moving_time || 0;
                
                stats[zoneId].time += duration;
                totalMovingTime += duration;
            });

            return Object.values(stats).reverse().map(z => ({
                ...z,
                percentage: totalMovingTime > 0 ? Math.round((z.time / totalMovingTime) * 100) : 0
            }));
        }
    },
    mounted() {
        if (window.lucide) window.lucide.createIcons();
    }
};
