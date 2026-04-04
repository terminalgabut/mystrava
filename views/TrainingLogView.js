// views/TrainingLogView.js
import { supabase } from '../services/supabase.js';

export default {
    name: 'TrainingLogView',
    template: `
    <div class="dashboard-wrapper animate-in" :class="{ 'is-loading': loading }">
        <header class="dashboard-header">
            <div>
                <h1 class="text-display text-3xl font-black text-slate-900 tracking-tighter">Training Log</h1>
                <p class="text-caption mt-1 uppercase tracking-[0.2em] font-bold text-[10px]">Your consistency timeline</p>
            </div>
            
            <div class="flex gap-4">
                <div class="hidden md:flex flex-col items-end">
                    <span class="label-muted text-[10px] uppercase font-black">All Time</span>
                    <h2 class="stat-value text-xl">{{ totalActivities }} <span class="text-[10px] text-slate-400">Activities</span></h2>
                </div>
                <div class="icon-box bg-blue-600 text-white shadow-lg shadow-blue-200">
                    <i data-lucide="calendar-days" class="w-5 h-5"></i>
                </div>
            </div>
        </header>

        <div class="max-w-4xl mx-auto mt-8">
            <div class="relative pl-4 md:pl-0">
                <div class="absolute left-[23px] md:left-[23px] top-0 bottom-0 w-[2px] bg-slate-100"></div>

                <div v-for="(week, index) in groupedData" :key="index" class="relative pl-14 pb-12 group">
                    
                    <div class="absolute left-[17px] top-2 w-3.5 h-3.5 rounded-full bg-white border-2 border-slate-300 group-hover:border-blue-500 transition-colors z-10 shadow-sm"></div>

                    <div class="flex justify-between items-center mb-5 pr-2">
                        <div>
                            <h3 class="text-[11px] font-black text-slate-400 uppercase tracking-widest">{{ week.range }}</h3>
                        </div>
                        <div class="text-right">
                            <span class="text-xl font-black text-slate-900">{{ week.totalDistance.toFixed(1) }}</span>
                            <span class="text-[10px] font-bold text-slate-400 uppercase ml-1">KM</span>
                        </div>
                    </div>

                    <div class="bento-card p-5 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm group-hover:shadow-md group-hover:border-blue-100 transition-all duration-300">
                        <div class="grid grid-cols-7 gap-2 md:gap-4">
                            <div v-for="(day, dIdx) in week.days" :key="dIdx" class="flex flex-col items-center gap-2">
                                <span class="text-[9px] font-black text-slate-300 uppercase tracking-tighter">{{ dayLabels[dIdx] }}</span>
                                
                                <div v-if="day" 
                                     @click="goToActivity(day.id)"
                                     :style="{ backgroundColor: getActivityColor(day.type) }"
                                     class="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-lg shadow-black/5 cursor-pointer transform hover:scale-110 active:scale-95 transition-all">
                                    <span class="text-[10px] md:text-[11px] font-black text-white italic">{{ Math.round(day.distance) }}</span>
                                </div>
                                
                                <div v-else class="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
                                    <div class="w-1.5 h-1.5 bg-slate-100 rounded-full group-hover:bg-slate-200 transition-colors"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="loading" class="flex flex-col items-center py-20">
                    <div class="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
                    <p class="text-caption">Retrieving your data...</p>
                </div>

                <div v-if="!loading && activities.length === 0" class="text-center py-20 bento-card">
                    <i data-lucide="database-backup" class="w-12 h-12 text-slate-200 mx-auto mb-4"></i>
                    <p class="stat-value text-slate-400">No activities found</p>
                    <p class="text-caption mt-2">Time to hit the road!</p>
                </div>
            </div>
        </div>
    </div>
    `,
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

                const dayIndex = (date.getDay() + 6) % 7;
                const km = act.distance / 1000;

                // Jika ada aktivitas ganda di hari yang sama, kita bisa pilih yang terjauh
                if (!weeks[rangeLabel].days[dayIndex] || weeks[rangeLabel].days[dayIndex].distance < km) {
                    weeks[rangeLabel].days[dayIndex] = {
                        id: act.id,
                        type: act.type,
                        distance: km
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
