import activitiesTemplate from './activitiesView.js';
import { supabase } from '../js/services/supabase.js';
import { Logger } from '../js/services/debug.js';

export default {
    name: 'ActivitiesView',
    template: activitiesTemplate,
    setup() {
        const { ref, onMounted, nextTick, computed } = Vue;
        const router = VueRouter.useRouter();
        
        const activities = ref([]);
        const loading = ref(true);
        const filterType = ref('All'); 

        const filteredActivities = computed(() => {
            if (filterType.value === 'All') return activities.value;
            return activities.value.filter(act => act.type === filterType.value);
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

        // --- SELEKSI IKON SPORTY ---
        const getIconName = (type) => {
            const icons = {
                'Run': 'footprints', // Jejak kaki (Google Fit Style)
                'Ride': 'bike',      // Sepeda (Strava Style)
                'Walk': 'person-standing' // Orang berjalan/berdiri
            };
            return icons[type] || 'activity';
        };

        const getTypeIconClass = (type) => {
            const classes = {
                'Run': 'bg-orange-100 text-orange-600 ring-1 ring-orange-200',
                'Ride': 'bg-blue-100 text-blue-600 ring-1 ring-blue-200',
                'Walk': 'bg-emerald-100 text-emerald-600 ring-1 ring-emerald-200'
            };
            return classes[type] || 'bg-slate-100 text-slate-600 ring-1 ring-slate-200';
        };

        const goToDetail = (id) => router.push(`/activity/${id}`);
        
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
