import activitiesTemplate from './activitiesView.js';
import { supabase } from '../js/services/supabase.js';
import { Logger } from '../js/services/debug.js';

export default {
    name: 'ActivitiesView',
    template: activitiesTemplate,
    setup() {
        const { ref, onMounted, nextTick } = Vue;
        const router = VueRouter.useRouter();
        
        const activities = ref([]);
        const loading = ref(true);

        /**
         * Mengambil data aktivitas langsung dari tabel mentah
         */
        const loadActivities = async () => {
            loading.value = true;
            try {
                Logger.info('Activities: Fetching list from Supabase');
                
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
                // Pastikan ikon Lucide dirender ulang setelah data muncul di DOM
                nextTick(() => {
                    if (window.lucide) window.lucide.createIcons();
                });
            }
        };

        const goToDetail = (id) => {
            router.push(`/activity/${id}`);
        };

        /**
         * Formatter tanggal standar (contoh: 21 Mar 2026)
         */
        const formatDate = (dateStr) => {
            if (!dateStr) return '-';
            return new Date(dateStr).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        };

        /**
         * Dinamis class untuk badge tipe aktivitas
         */
        const getTypeBadgeClass = (type) => {
            const classes = {
                'Run': 'bg-orange-50 text-orange-600 border border-orange-100',
                'Ride': 'bg-blue-50 text-blue-600 border border-blue-100',
                'Walk': 'bg-emerald-50 text-emerald-600 border border-emerald-100'
            };
            return classes[type] || 'bg-slate-50 text-slate-600 border border-slate-100';
        };

        onMounted(loadActivities);

        return { 
            activities, 
            loading, 
            goToDetail, 
            formatDate, 
            getTypeBadgeClass, 
            loadActivities 
        };
    }
};
