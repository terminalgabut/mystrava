// views/TrainingLogView.js
import { supabase } from '../js/services/supabase.js';

export default {
    name: 'TrainingLogView',
    // Template yang sudah disesuaikan agar konsisten dengan Dashboard Mobile
template: `
<div class="dashboard-wrapper animate-in px-3 md:px-8" :class="{ 'is-loading': loading }">
    <header class="dashboard-header flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
            <h1 class="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">Training Log</h1>
            <p class="text-caption mt-1 uppercase tracking-[0.2em] font-bold text-[9px] md:text-[10px]">Your consistency timeline</p>
        </div>
        
        <div class="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 md:bg-transparent md:border-0 md:p-0">
            <div class="icon-box bg-blue-600 text-white shadow-lg shadow-blue-200 w-8 h-8 md:w-10 md:h-10">
                <i data-lucide="calendar-days" class="w-4 h-4 md:w-5 md:h-5"></i>
            </div>
            <div>
                <p class="label-muted text-[8px] md:text-[10px] uppercase font-black">Total Activities</p>
                <h2 class="stat-value text-sm md:text-xl">{{ totalActivities }}</h2>
            </div>
        </div>
    </header>

    <div class="max-w-4xl mx-auto mt-6 md:mt-10">
        <div class="relative">
            <div class="absolute left-[15px] md:left-[23px] top-0 bottom-0 w-[1.5px] bg-slate-100"></div>

            <div v-for="(week, index) in groupedData" :key="index" class="relative pl-10 md:pl-16 pb-10 group">
                
                <div class="absolute left-[9px] md:left-[17px] top-1.5 w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-white border-2 border-slate-300 group-hover:border-blue-500 z-10"></div>

                <div class="flex justify-between items-center mb-3 pr-2">
                    <h3 class="text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest">{{ week.range }}</h3>
                    <div class="text-right">
                        <span class="text-base md:text-xl font-black text-slate-900">{{ week.totalDistance.toFixed(1) }}</span>
                        <span class="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase ml-1">KM</span>
                    </div>
                </div>

                <div class="bento-card p-3 md:p-6 bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm group-hover:shadow-md transition-all">
                    <div class="grid grid-cols-7 gap-1 md:gap-4">
                        <div v-for="(day, dIdx) in week.days" :key="dIdx" class="flex flex-col items-center gap-1.5">
                            <span class="text-[8px] md:text-[9px] font-black text-slate-300 uppercase">{{ dayLabels[dIdx] }}</span>
                            
                            <div v-if="day" 
                                 @click="goToActivity(day.id)"
                                 :style="{ backgroundColor: getActivityColor(day.type) }"
                                 class="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-md cursor-pointer transform active:scale-90 transition-all">
                                <span class="text-[8px] md:text-[11px] font-black text-white italic">
                                    {{ day.distance.toFixed(1) }}
                                </span>
                            </div>
                            
                            <div v-else class="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center">
                                <div class="w-1 h-1 bg-slate-100 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
`
    data() {
        return {
            loading: false,
            activities: [],
            dayLabels: ['S', 'S', 'R', 'K', 'J', 'S', 'M'],
        };
    },
    computed: {
        totalActivities() {
            return this.activities.length;
        },
        groupedData() {
            const weeks = {};
            const sorted = [...this.activities].sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

            sorted.forEach(act => {
                const date = new Date(act.start_date);
                const start = this.getStartOfWeek(date);
                const rangeLabel = this.formatWeekRange(start);

                if (!weeks[rangeLabel]) {
                    weeks[rangeLabel] = {
                        range: rangeLabel,
                        totalDistance: 0,
                        days: Array(7).fill(null)
                    };
                }

                // Di dalam groupedData()
const dayIndex = (date.getDay() + 6) % 7;
const km = act.distance / 1000; // Biarkan tetap desimal (misal 5.75)

if (!weeks[rangeLabel].days[dayIndex] || weeks[rangeLabel].days[dayIndex].distance < km) {
    weeks[rangeLabel].days[dayIndex] = {
        id: act.id,
        type: act.type,
        distance: km // Jangan di-round di sini
    };
}
                
                weeks[rangeLabel].totalDistance += km;
            });

            return Object.values(weeks);
        }
    },
    methods: {
        getStartOfWeek(date) {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            return new Date(d.setDate(diff));
        },
        formatWeekRange(start) {
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            const options = { day: '2-digit', month: 'short' };
            return `${start.toLocaleDateString('id-ID', options)} - ${end.toLocaleDateString('id-ID', options)}`.toUpperCase();
        },
        getActivityColor(type) {
            const colors = {
                'Run': '#22C55E',   // Green (Success)
                'Ride': '#0052FF',  // Blue (Primary)
                'Walk': '#F97316',  // Orange
                'Hike': '#8B5CF6'   // Purple
            };
            return colors[type] || '#64748B';
        },
        goToActivity(id) {
            this.$router.push(`/activity/${id}`);
        },
        async fetchActivities() {
            this.loading = true;
            try {
                const { data, error } = await supabase
                    .from('activities')
                    .select('id, type, distance, start_date')
                    .order('start_date', { ascending: false });

                if (error) throw error;
                this.activities = data || [];
                
                // Re-init lucide icons after data load
                this.$nextTick(() => {
                    if (window.lucide) window.lucide.createIcons();
                });
            } catch (err) {
                console.error("Error:", err.message);
            } finally {
                this.loading = false;
            }
        }
    },
    mounted() {
        this.fetchActivities();
        if (window.lucide) window.lucide.createIcons();
    }
};
