// js/utils/PaceZoneChart.js
import { PerformanceLogic } from './performanceLogic.js';

export default {
    name: 'PaceZoneChart',
    props: {
        splits: { type: Array, required: true },
        threshold: { type: Number, required: true }
    },
    template: `
    <div class="pace-zone-card bento-card p-6 shadow-premium">
        <div class="card-header mb-6">
            <span class="label-muted">Distribusi Zona Pace</span>
            <div class="icon-box"><i data-lucide="bar-chart-2" class="w-4 h-4"></i></div>
        </div>

        <div class="space-y-4">
            <div v-for="zone in sortedZones" :key="zone.id" class="zone-row group">
                <div class="flex justify-between items-end mb-1">
                    <div class="flex items-center gap-2">
                        <span class="stat-value text-xs w-4">Z{{ zone.id }}</span>
                        <span class="text-caption" style="font-size: 10px; font-weight: 700;">
                            {{ zone.label }}
                        </span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="label-muted" style="letter-spacing: 0;">{{ zone.range }}</span>
                        <span class="stat-value text-sm">{{ zone.percentage }}%</span>
                    </div>
                </div>
                
                <div class="h-3 bg-slate-100 rounded-full overflow-hidden flex">
                    <div class="transition-all duration-1000 ease-out rounded-full"
                         :style="{ 
                            width: zone.percentage + '%', 
                            backgroundColor: zone.color,
                            boxShadow: '0 0 10px ' + zone.color + '40'
                         }">
                    </div>
                </div>
            </div>
        </div>
        
        <p class="text-caption mt-6 pt-4 border-t border-slate-50 italic">
            Berdasarkan ambang batas lari {{ formatPace(threshold) }} /km
        </p>
    </div>
    `,
    computed: {
        sortedZones() {
            // 1. Inisialisasi 6 Zona
            const zoneStats = {
                6: { id: 6, label: 'Neuromuscular', seconds: 0, color: '#0F172A' }, // Slate 900
                5: { id: 5, label: 'Anaerobic', seconds: 0, color: '#EF4444' },    // Red
                4: { id: 4, label: 'Ambang Batas', seconds: 0, color: '#0052FF' }, // Brand Primary
                3: { id: 3, label: 'Tempo', seconds: 0, color: '#EAB308' },       // Yellow
                2: { id: 2, label: 'Endurance', seconds: 0, color: '#22C55E' },    // Green
                1: { id: 1, label: 'Recovery', seconds: 0, color: '#64748B' }     // Slate 500
            };

            // 2. Kalkulasi Durasi per Zona dari Splits
            let totalSeconds = 0;
            this.splits.forEach(split => {
                const pace = 1000 / split.average_speed;
                const zoneId = PerformanceLogic.getZone(pace, this.threshold);
                zoneStats[zoneId].seconds += split.moving_time;
                totalSeconds += split.moving_time;
            });

            // 3. Mapping ke Array untuk Display
            return Object.values(zoneStats).reverse().map(zone => ({
                ...zone,
                percentage: totalSeconds > 0 ? Math.round((zone.seconds / totalSeconds) * 100) : 0,
                range: this.getZoneRangeLabel(zone.id)
            }));
        }
    },
    methods: {
        formatPace(sec) {
            const m = Math.floor(sec / 60);
            const s = Math.round(sec % 60).toString().padStart(2, '0');
            return `${m}:${s}`;
        },
        getZoneRangeLabel(id) {
            const t = this.threshold;
            const ranges = {
                6: `< ${this.formatPace(t * 0.81)}`,
                5: `${this.formatPace(t * 0.81)}-${this.formatPace(t * 0.90)}`,
                4: `${this.formatPace(t * 0.90)}-${this.formatPace(t * 0.95)}`,
                3: `${this.formatPace(t * 0.95)}-${this.formatPace(t * 1.00)}`,
                2: `${this.formatPace(t * 1.00)}-${this.formatPace(t * 1.15)}`,
                1: `> ${this.formatPace(t * 1.15)}`
            };
            return ranges[id];
        }
    }
};
