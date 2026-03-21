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

                // Render Map jika ada polyline
                if (data.summary_polyline) {
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
            
            // Dekode Polyline menggunakan library google-polyline (pastikan terpasang di index.html)
            const coordinates = polyline.decode(polylineStr); 

            map = L.map('map', { 
                zoomControl: false, 
                attributionControl: false 
            }).setView(coordinates[0], 13);
            
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);

            const path = L.polyline(coordinates, {
                color: '#2563eb',
                weight: 6,
                opacity: 0.9,
                lineJoin: 'round'
            }).addTo(map);

            map.fitBounds(path.getBounds(), { padding: [40, 40] });
        };

        // --- COMPUTED PROPERTIES ---
        const performanceValue = computed(() => {
            if (!activity.value) return '--:--';
            return stravaService.calculatePace(activity.value.average_speed, activity.value.type);
        });

        const performanceUnit = computed(() => {
            return activity.value?.type === 'Ride' ? 'km/h' : '/km';
        });

        const locationName = computed(() => {
            if (!activity.value) return 'Location...';
            // Jika ada titik koordinat lari, tunjukkan (atau ambil dari field location jika ada)
            if (activity.value.start_latlng) {
                const [lat, lng] = activity.value.start_latlng;
                return `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
            }
            return 'Global Area';
        });

        const weatherIcon = computed(() => {
            // Logika sederhana: Jika elevasi tinggi, mungkin berawan/kabut (hanya simulasi)
            return (activity.value?.total_elevation_gain > 50) ? 'cloud' : 'sun';
        });

        // --- HELPERS ---
        const formatTime = (seconds) => {
            if (!seconds) return '00:00:00';
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = Math.floor(seconds % 60);
            return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            return new Date(dateStr).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'short', year: 'numeric'
            });
        };

        const calculateSteps = (dist) => stravaService.calculateSteps(dist);

        onMounted(loadActivityDetail);

        return { 
            activity, loading, performanceValue, performanceUnit, 
            locationName, weatherIcon,
            calculateSteps, formatTime, formatDate 
        };
    }
};
