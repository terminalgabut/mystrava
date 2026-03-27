// js/utils/PaceZoneChart.js
import { PerformanceLogic } from './performanceLogic.js';

export default {
    name: 'PaceZoneChart',
    props: {
        splits: { type: Array, required: true },
        threshold: { type: Number, required: true }
    },
    template: `
    <div class="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-visible">
        <div class="flex items-center justify-between mb-6 px-1">
            <h3 class="font-black text-slate-900 flex items-center gap-2">
                <i data-lucide="bar-chart-2" class="w-4 h-4 text-blue-500"></i>
                Pace Zones
            </h3>
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Time In Zone</span>
        </div>

        <div class="space-y-4">
            <div v-for="zone in zoneDistribution" :key="zone.id" class="relative group">
                <div class="flex justify-between items-end mb-1.5 px-1">
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] font-black text-slate-900 w-4">Z{{ zone.id }}</span>
                        <span class="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{{ zone.label }}</span>
                    </div>
                    <span class="text-[10px] font-black text-slate-900 tabular-nums">{{ zone.percentage }}%</span>
                </div>
                
                <div class="h-2.5 bg-slate-50 rounded-full overflow-hidden relative cursor-help">
                    <div class="h-full transition-all duration-1000 ease-out rounded-full"
                         :style="{ 
                            width: zone.percentage + '%', 
                            backgroundColor: zone.color 
                         }">
                    </div>
                </div>

                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50">
                    <div class="bg-slate-900 text-white text-[10px] font-black py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap flex items-center gap-2">
                         <span class="text-white/60 uppercase" style="font-size: 8px;">Duration:</span>
                         {{ formatDuration(zone.time) }}
                         <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
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
                const pace = 1000 / s.average_speed;
                const zoneId = PerformanceLogic.getRunZone(pace, this.threshold);
                // Kita gunakan moving_time dari split strava
                const duration = s.moving_time || 0;
                
                stats[zoneId].time += duration;
                totalMovingTime += duration;
            });

            // Urutkan dari Z6 ke Z1 (seperti Strava)
            return Object.values(stats).reverse().map(z => ({
                ...z,
                percentage: totalMovingTime > 0 ? Math.round((z.time / totalMovingTime) * 100) : 0
            }));
        }
    },
    methods: {
        formatDuration(seconds) {
            if (seconds === 0) return '0s';
            const m = Math.floor(seconds / 60);
            const s = Math.round(seconds % 60);
            return m > 0 ? `${m}m ${s}s` : `${s}s`;
        }
    },
    mounted() {
        if (window.lucide) window.lucide.createIcons();
    }
};
