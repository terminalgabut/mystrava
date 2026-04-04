// views/TrainingLogView.js
import { supabase } from '../js/services/supabase.js'; 
// ^ Pastikan path-nya benar, biasanya di ../services/ atau ../utils/
export default {
    name: 'TrainingLogView',
    template: `
    <div class="training-log-container p-8 max-w-4xl mx-auto animate-in">
        <header class="mb-10 flex justify-between items-end">
            <div>
                <h1 class="text-3xl font-black text-slate-900 tracking-tighter">Training Log</h1>
                <p class="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Consistency is Key</p>
            </div>
            <div class="bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100">
                <span class="text-blue-600 font-black text-sm italic">{{ totalActivities }} Total Activities</span>
            </div>
        </header>

        <div class="relative">
            <div class="absolute left-[19px] top-0 bottom-0 w-[2px] bg-slate-100"></div>

            <div v-for="(week, index) in groupedData" :key="index" class="relative pl-12 pb-12 group">
                <div class="absolute left-[13px] top-2 w-3.5 h-3.5 rounded-full bg-white border-2 border-slate-300 group-hover:border-blue-500 transition-colors z-10"></div>

                <div class="flex justify-between items-center mb-5">
                    <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest">{{ week.range }}</h3>
                    <div class="flex items-baseline gap-1">
                        <span class="text-xl font-black text-slate-900">{{ week.totalDistance.toFixed(1) }}</span>
                        <span class="text-[10px] font-bold text-slate-400 uppercase">KM</span>
                    </div>
                </div>

                <div class="grid grid-cols-7 gap-3 bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm group-hover:shadow-md transition-shadow">
                    <div v-for="(day, dIdx) in week.days" :key="dIdx" class="flex flex-col items-center gap-2">
                        <span class="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">{{ dayLabels[dIdx] }}</span>
                        
                        <div v-if="day" 
                             @click="goToActivity(day.id)"
                             :title="day.type"
                             :style="{ backgroundColor: getActivityColor(day.type) }"
                             class="w-11 h-11 rounded-full flex items-center justify-center shadow-lg shadow-black/5 cursor-pointer transform hover:scale-110 active:scale-95 transition-all">
                            <span class="text-[11px] font-black text-white italic">{{ Math.round(day.distance) }}</span>
                        </div>
                        
                        <div v-else class="w-11 h-11 flex items-center justify-center">
                            <div class="w-1.5 h-1.5 bg-slate-100 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="loading" class="text-center py-10">
            <div class="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        </div>
    </div>
    `,
    data() {
        return {
            loading: false,
            activities: [], // Ini nanti diisi dari Supabase
            dayLabels: ['S', 'S', 'R', 'K', 'J', 'S', 'M'],
        };
    },
    computed: {
        totalActivities() {
            return this.activities.length;
        },
        groupedData() {
            // Logika pengelompokan berdasarkan minggu
            const weeks = {};
            
            // Urutkan aktivitas dari yang terbaru
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

                // Hitung index hari (0 = Senin, 6 = Minggu)
                const dayIndex = (date.getDay() + 6) % 7;
                const km = act.distance / 1000;

                weeks[rangeLabel].days[dayIndex] = {
                    id: act.id,
                    type: act.type,
                    distance: km
                };
                weeks[rangeLabel].totalDistance += km;
            });

            return Object.values(weeks);
        }
    },
    methods: {
        getStartOfWeek(date) {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
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
                'Run': '#22C55E',   // Green
                'Ride': '#0052FF',  // Blue
                'Hike': '#F97316',  // Orange
                'Walk': '#F97316'
            };
            return colors[type] || '#64748B'; // Default Slate
        },
        goToActivity(id) {
            this.$router.push(`/activity/${id}`);
        },
        async fetchActivities() {
            this.loading = true;
            try {
                // Contoh Fetch dari Supabase kamu
                const { data, error } = await supabase
                    .from('activities')
                    .select('id, type, distance, start_date')
                    .order('start_date', { ascending: false });

                if (error) throw error;
                this.activities = data;
            } catch (err) {
                console.error("Error fetching logs:", err.message);
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
