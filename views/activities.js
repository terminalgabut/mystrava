import activitiesTemplate from './activitiesView.js';
import { supabase } from '../js/services/supabase.js';
import { Logger } from '../js/services/debug.js';

export default {
    name: 'ActivitiesView',
    template: activitiesTemplate,
    setup() {
        const { ref, onMounted, nextTick, computed } = Vue;
        const router = VueRouter.useRouter();
        
        // --- STATES ---
        const activities = ref([]);
        const loading = ref(true);
        const filterType = ref('All'); // Default filter

        // --- COMPUTED: FILTER LOGIC ---
        // Menghitung data yang tampil berdasarkan chip yang dipilih
        const filteredActivities = computed(() => {
            if (filterType.value === 'All') return activities.value;
            return activities.value.filter(act => act.type === filterType.value);
        });

        // --- METHODS ---
        const loadActivities = async () => {
            loading.value = true;
            try {
                Logger.info(`Activities: Fetching data from Supabase`);
                
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
                // Re-render Lucide Icons setelah DOM update
                nextTick(() => {
                    if (window.lucide) window.lucide.createIcons();
                });
            }
        };

        const goToDetail = (id) => {
            router.push(`/activity/${id}`);
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '-';
            return new Date(dateStr).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        };

        // --- ICON HELPERS ---
        const getIconName = (type) => {
            const icons = {
                'Run': 'timer',
                'Ride': 'zap',
                'Walk': 'footprints'
            };
            return icons[type] || 'activity';
        };

        const getTypeIconClass = (type) => {
            const classes = {
                'Run': 'bg-orange-50 text-orange-600 ring-1 ring-orange-100',
                'Ride': 'bg-blue-50 text-blue-600 ring-1 ring-blue-100',
                'Walk': 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100'
            };
            return classes[type] || 'bg-slate-50 text-slate-600 ring-1 ring-slate-100';
        };

        onMounted(loadActivities);

        return { 
            // Data & UI State
            activities, 
            filteredActivities,
            loading, 
            filterType,
            
            // Methods
            loadActivities,
            goToDetail, 
            formatDate, 
            
            // Icon & Style Helpers
            getIconName,
            getTypeIconClass
        };
    }
};
