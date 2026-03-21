import detailTemplate from './activityDetailView.js';
import { supabase } from '../js/services/supabase.js';
import { stravaService } from '../js/services/stravaService.js';
import { Logger } from '../js/services/debug.js';

export default {
    name: 'ActivityDetailView',
    template: detailTemplate,
    setup() {
        const { ref, onMounted, nextTick, computed } = Vue;
        const route = VueRouter.useRoute();
        const activity = ref(null);
        const loading = ref(true);
        const hasRoute = ref(false);
        let map = null;

        const loadActivityDetail = async () => {
            loading.value = true;
            try {
                const { data, error } = await supabase
                    .from('activities')
                    .select('*')
                    .eq('id', route.params.id)
                    .single();

                if (error) throw error;
                activity.value = data;

                if (data.summary_polyline) {
                    hasRoute.value = true;
                    nextTick(() => initMap(data.summary_polyline));
                }
            } catch (err) {
                Logger.error('Detail_Load_Error', err);
            } finally {
                loading.value = false;
                nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
            }
        };

        const initMap = (polylineStr) => {
            if (map) map.remove();
            
            // Dekode polyline (membutuhkan library L.Polyline.fromEncoded atau sejenisnya)
            // Untuk demo ini, kita asumsikan koordinat sudah didekode atau menggunakan plugin
            const coordinates = polyline.decode(polylineStr); 

            map = L.map('map', { zoomControl: false }).setView(coordinates[0], 13);
            
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '©OpenStreetMap'
            }).addTo(map);

            const path = L.polyline(coordinates, {
                color: '#2563eb',
                weight: 5,
                opacity: 0.8,
                lineJoin: 'round'
            }).addTo(map);

            map.fitBounds(path.getBounds(), { padding: [30, 30] });
        };

        const performanceValue = computed(() => {
            if (!activity.value) return '--:--';
            return stravaService.calculatePace(activity.value.average_speed, activity.value.type);
        });

        const calculateSteps = (dist) => stravaService.calculateSteps(dist);

        const formatTime = (seconds) => {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = seconds % 60;
            return h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            return new Date(dateStr).toLocaleDateString('id-ID', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            });
        };

        onMounted(loadActivityDetail);

        return { 
            activity, loading, hasRoute, performanceValue, 
            calculateSteps, formatTime, formatDate 
        };
    }
};
