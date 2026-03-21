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

        // --- FETCH DATA ---
        const loadActivityDetail = async () => {
            loading.value = true;
            try {
                const { data, error } = await supabase
                    .from('activities')
                    .select('*')
                    .eq('id', route.params.id)
                    .single();

                if (error) throw error;
                
                // Normalisasi data untuk memastikan format angka dan field waktu tersedia
                activity.value = {
                    ...data,
                    moving_time: Number(data.moving_time || 0),
                    elapsed_time: Number(data.elapsed_time || 0)
                };

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

        // --- MAP LOGIC ---
        const initMap = (polylineStr) => {
            if (map) map.remove();
            
            try {
                const coordinates = polyline.decode(polylineStr); 
                map = L.map('map', { zoomControl: false, attributionControl: false }).setView(coordinates[0], 13);
                
                L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);

                const path = L.polyline(coordinates, {
                    color: '#2563eb',
                    weight: 6,
                    opacity: 0.9,
                    lineJoin: 'round'
                }).addTo(map);

                map.fitBounds(path.getBounds(), { padding: [40, 40] });
            } catch (e) {
                Logger.error('Map_Init_Error', e);
            }
        };

        // --- COMPUTED PROPERTIES ---
        const locationName = computed(() => {
            if (!activity.value) return 'Loading...';
            
            // Prioritas 1: Nama Kota dari Strava
            if (activity.value.location_city) return activity.value.location_city;
            
            // Prioritas 2: Koordinat GPS (Format: -7.123, 112.123)
            if (activity.value.start_latlng && Array.isArray(activity.value.start_latlng)) {
                const [lat, lng] = activity.value.start_latlng;
                return `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
            }
            
            return 'Area Terdeteksi';
        });

        const realSplits = computed(() => {
            if (!activity.value?.splits_metric) return [];
            
            return activity.value.splits_metric.map(s => ({
                number: s.split,
                distance: (s.distance / 1000).toFixed(1),
                pace: stravaService.calculatePace(s.average_speed, activity.value.type),
                elevation: s.elevation_difference ? Math.round(s.elevation_difference) : 0
            }));
        });

        const performanceValue = computed(() => {
            if (!activity.value) return '--:--';
            return stravaService.calculatePace(activity.value.average_speed, activity.value.type);
        });

        const performanceUnit = computed(() => activity.value?.type === 'Ride' ? 'km/h' : '/km');
        const weatherIcon = computed(() => activity.value?.type === 'Ride' ? 'cloud-lightning' : 'sun');

        // --- HELPERS ---
        const formatTime = (seconds) => {
            if (!seconds || isNaN(seconds)) return '00:00:00';
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

        const calculateSteps = (dist) => Math.round(dist * 1.31).toLocaleString('id-ID');

        onMounted(loadActivityDetail);

        return { 
            activity, loading, performanceValue, performanceUnit, 
            locationName, weatherIcon, realSplits,
            calculateSteps, formatTime, formatDate 
        };
    }
};
