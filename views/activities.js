import activitiesTemplate from './activitiesView.js';
import { supabase } from '../js/services/supabase.js';
import { Logger } from '../js/services/debug.js';

export default {
    name: 'ActivitiesView',
    template: activitiesTemplate,
    setup() {
        const { ref, onMounted, nextTick, computed, watch } = Vue;
        const router = VueRouter.useRouter();
        
        const activities = ref([]);
        const loading = ref(true);
        const filterType = ref('All'); 

        // Filter Logic
        const filteredActivities = computed(() => {
            if (filterType.value === 'All') return activities.value;
            return activities.value.filter(act => act.type === filterType.value);
        });

        // PENTING: Pantau perubahan filterType
        // Setiap kali user klik filter, jalankan lucide.createIcons setelah DOM update
        watch(filterType, () => {
            nextTick(() => {
                if (window.lucide) window.lucide.createIcons();
            });
        });

        const loadActivities = async () => {
            loading.value = true;
            try {
                const { data, error } = await supabase
                    .from('activities')
                    .select('*')
                    .order('start_date', { ascending: false });
                
                if (error) throw error;
                activities.value = data || [];
            } catch (err) {
                Logger.error('Activities_Load_Error', err);
            } finally {
                loading.value = false;
                nextTick(() => {
                    if (window.lucide) window.lucide.createIcons();
                });
            }
        };

        /* Sporty Icons Selector
        const getIconName = (type) => {
            const icons = {
                'Run': 'sport-shoe',
                'Ride': 'bike',
                'Walk': 'footprints',
                'Hike': 'mountain',
                'WeightTraining': 'dumbbell'
            }; 
            return icons[type] || 'activity';
        }; 

        const getTypeIconClass = (type) => {
            const classes = {
                'Run': 'bg-emerald-100 text-emerald-600 ring-1 ring-emerald-200',
                'Ride': 'bg-blue-100 text-blue-600 ring-1 ring-blue-200',
                'Walk': 'bg-orange-100 text-orange-600 ring-1 ring-orange-200',
                'Hike': 'bg-violet-100 text-violet-600 ring-1 ring-violet-200',
                'WeightTraining': 'bg-rose-100 text-rose-600 ring-1 ring-rose-200'
            };
            return classes[type] || 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';
        }; */

        // Sporty Icons Selector - Menggunakan path ke folder icon/
const getIconName = (type) => {
    const icons = {
        'Run': 'icon/run.png',
        'Ride': 'icon/ride.png',
        'Walk': 'icon/walk.png',
        'Hike': 'icon/hike.png',
        'WeightTraining': 'icon/wheighttraining.png'
    };
    // Fallback ke ikon default jika tipe tidak terdaftar
    return icons[type] || 'icon/default.png';
};

const getTypeIconClass = (type) => {
    // Menggunakan background transparan tipis agar ikon .png lebih menonjol
    const classes = {
        'Run': 'bg-emerald-500/10 ring-1 ring-emerald-500/20',
        'Ride': 'bg-blue-500/10 ring-1 ring-blue-500/20',
        'Walk': 'bg-orange-500/10 ring-1 ring-orange-500/20',
        'Hike': 'bg-violet-500/10 ring-1 ring-violet-500/20',
        'WeightTraining': 'bg-rose-500/10 ring-1 ring-rose-500/20'
    };
    return classes[type] || 'bg-slate-500/10 ring-1 ring-slate-500/20';
};

       // const goToDetail = (id) => router.push(`/activity/${id}`);
        const goToDetail = (id) => {
        const act = activities.value.find(a => a.id === id);
        
        if (act && act.type === 'WeightTraining') {
            router.push({ 
                name: 'weight-training-detail', 
                params: { id: id } 
            });
        } else {
            router.push({ 
                name: 'activity-detail', 
                params: { id: id } 
            });
        }
    };
        
        const formatDate = (dateStr) => {
            if (!dateStr) return '-';
            return new Date(dateStr).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'short', year: 'numeric'
            });
        };

        onMounted(loadActivities);

        return { 
            activities, filteredActivities, loading, filterType,
            loadActivities, goToDetail, formatDate, 
            getIconName, getTypeIconClass
        };
    }
};
