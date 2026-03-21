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

        // --- UTILS (Private) ---
        const refreshLucide = () => nextTick(() => window.lucide?.createIcons());

        const getGeoFallback = async (lat, lng) => {
            try {
                const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18`, {
                    headers: { 'Accept-Language': 'id' }
                });
                const data = await resp.json();
                const a = data.address;
                return [a.village || a.suburb || '', a.district || a.city_district || '', a.city || a.regency || '', 'ID']
                    .filter(Boolean).join(', ');
            } catch {
                return `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
            }
        };

        // --- CORE LOGIC ---
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

                // Lazy Enrichment: Hanya fetch jika data di DB kosong (untuk data lama)
                if (!data.location_name && data.start_lat) {
                    const fullAddr = await getGeoFallback(data.start_lat, data.start_lng);
                    activity.value.location_name = fullAddr;
                    
                    // Update background (non-blocking)
                    supabase.from('activities').update({ location_name: fullAddr }).eq('id', data.id);
                }

                if (data.summary_polyline) {
                    nextTick(() => initMap(data.summary_polyline));
                }
            } catch (err) {
                Logger.error('Detail_Load_Error', err);
            } finally {
                loading.value = false;
                refreshLucide();
            }
        };

        const initMap = (polylineStr) => {
            if (map) map.remove();
            try {
                const coords = polyline.decode(polylineStr); 
                map = L.map('map', { zoomControl: false, attributionControl: false }).setView(coords[0], 13);
                L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);
                const path = L.polyline(coords, { color: '#2563eb', weight: 6, opacity: 0.9, lineJoin: 'round' }).addTo(map);
                map.fitBounds(path.getBounds(), { padding: [40, 40] });
            } catch (e) {
                Logger.error('Map_Init_Error', e);
            }
        };

        // --- COMPUTED PROPERTIES ---
        const locationName = computed(() => activity.value?.location_name || 'Global Area');
        
        const performanceValue = computed(() => 
            activity.value ? stravaService.calculatePace(activity.value.average_speed, activity.value.type) : '--:--'
        );

        const performanceUnit = computed(() => 
            activity.value?.type === 'Ride' ? 'km/h' : '/km'
        );

        const weatherIcon = computed(() => {
            const type = activity.value?.type;
            if (type === 'Ride') return 'zap';
            if (type === 'Run') return 'sun';
            return 'cloud';
        });
        
        const realSplits = computed(() => {
            const splits = activity.value?.splits_metric;
            if (!splits || !Array.isArray(splits)) return [];
            return splits.map(s => ({
                number: s.split,
                distance: (s.distance / 1000).toFixed(1),
                pace: stravaService.calculatePace(s.average_speed, activity.value.type),
                elevation: Math.round(s.elevation_difference || 0)
            }));
        });

        // --- FORMATTERS ---
        const formatTime = (seconds) => {
            // Prioritas: 1. elapsed_time_seconds, 2. moving_time
            const totalSeconds = seconds || activity.value?.moving_time || 0;
            const h = Math.floor(totalSeconds / 3600);
            const m = Math.floor((totalSeconds % 3600) / 60);
            const s = Math.floor(totalSeconds % 60);
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
