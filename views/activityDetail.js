// activityDetail.js
import detailTemplate from './activityDetailView.js';
import { supabase } from '../js/services/supabase.js';
import { stravaService } from '../js/services/stravaService.js';
import { Logger } from '../js/services/debug.js';
import { getWeatherEngine } from '../js/utils/weatherEngine.js'; 

export default {
    name: 'ActivityDetailView',
    template: detailTemplate,
    setup() {
        const { ref, onMounted, nextTick, computed, watch } = Vue; // Tambahkan watch
        const route = VueRouter.useRoute();
        
        const activity = ref(null);
        const loading = ref(true);
        let mapInstance = null;

        const refreshLucide = () => nextTick(() => {
            if (window.lucide) window.lucide.createIcons();
        });

        // --- CORE LOGIC ---
        const loadActivityDetail = async () => {
            loading.value = true;
            try {
                const { data, error } = await supabase
                    .from('activities')
                    .select('*')
                    .eq('id', route.params.id)
                    .maybeSingle();

                if (error) throw error;
                if (!data) return;

                activity.value = data;

                if (data.summary_polyline) {
                    setTimeout(() => {
                        initMap(data.summary_polyline);
                    }, 100);
                }

                if (!data.location_name && data.start_lat) {
                    getGeoFallback(data.start_lat, data.start_lng).then(fullAddr => {
                        if (fullAddr) {
                            activity.value.location_name = fullAddr;
                            supabase.from('activities').update({ location_name: fullAddr }).eq('id', data.id).then();
                        }
                    });
                }
            } catch (err) {
                Logger.error('Detail_Load_Error', err);
            } finally {
                loading.value = false;
                // Refresh icon setelah data masuk
                refreshLucide();
            }
        };

        // --- MAP LOGIC (Tetap Sama) ---
        const initMap = (polylineStr) => {
            if (mapInstance) {
                mapInstance.off();
                mapInstance.remove();
                mapInstance = null;
            }
            const mapContainer = document.getElementById('map');
            if (!mapContainer || !window.L || !window.polyline) return;
            try {
                const coords = window.polyline.decode(polylineStr); 
                if (!coords || coords.length === 0) return;
                mapInstance = L.map('map', { 
                    zoomControl: false, 
                    attributionControl: false,
                    dragging: !L.Browser.mobile,
                    scrollWheelZoom: false 
                }).setView(coords[0], 13);
                L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(mapInstance);
                const path = L.polyline(coords, { color: '#3b82f6', weight: 5, opacity: 0.8, lineJoin: 'round' }).addTo(mapInstance);
                mapInstance.fitBounds(path.getBounds(), { padding: [30, 30] });
            } catch (e) { Logger.error('Map_Init_Error', e); }
        };

        const getGeoFallback = async (lat, lng) => {
            try {
                const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10`);
                const data = await resp.json();
                const a = data.address;
                return [a.village || a.suburb || '', a.city || a.regency || 'Indonesia'].filter(Boolean).join(', ');
            } catch { return null; }
        };

        // --- NEW WEATHER COMPUTED ---
        // --- NEW WEATHER COMPUTED ---
const weatherInfo = computed(() => {
    // 1. Cek apakah activity sudah ada datanya
    if (!activity.value || activity.value.weather_temp === undefined || activity.value.weather_temp === null) {
        console.warn('Weather Engine: Data activity belum siap');
        return { 
            icon: 'sun', 
            bg: 'bg-slate-50', 
            text: 'text-slate-400', 
            status: 'Loading...' 
        };
    }

    try {
        // 2. Panggil engine
        const engineData = getWeatherEngine(
            activity.value.weather_temp,
            activity.value.weather_humidity,
            activity.value.weather_wind,
            activity.value.start_date
        );

        // 3. DEBUG: Cek isi engineData di console
        console.log('Weather Engine Result:', engineData);

        // Pastikan kita me-return bagian .main (karena engineData punya .main dan .stats)
        return engineData.main;
    } catch (err) {
        console.error('Weather Engine Error:', err);
        return { icon: 'alert-circle', bg: 'bg-red-50', text: 'text-red-500', status: 'Error' };
    }
});

        // Watch weatherInfo untuk trigger Lucide saat data selesai di-calculate
        watch(weatherInfo, () => refreshLucide());

        // --- OTHER COMPUTED ---
        const locationName = computed(() => activity.value?.location_name || 'Global Area');
        const performanceValue = computed(() => activity.value ? stravaService.calculatePace(activity.value.average_speed, activity.value.type) : '--:--');
        const performanceUnit = computed(() => activity.value?.type === 'Ride' ? 'km/h' : '/km');
        
        const realSplits = computed(() => {
            const splits = activity.value?.splits_metric;
            if (!splits || !Array.isArray(splits)) return [];
            return splits.map(s => ({
                number: s.split,
                distance: (Number(s.distance || 0) / 1000).toFixed(2),
                pace: stravaService.calculatePace(s.average_speed, activity.value?.type),
                elevation: Math.round(s.elevation_difference || 0)
            }));
        });

        // --- FORMATTERS ---
        const formatTime = (seconds) => {
            const totalSeconds = Number(seconds) || 0;
            const h = Math.floor(totalSeconds / 3600);
            const m = Math.floor((totalSeconds % 3600) / 60);
            const s = Math.floor(totalSeconds % 60);
            return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '...';
            try {
                return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
            } catch { return dateStr; }
        };

        const calculateSteps = (dist) => Math.round((Number(dist) || 0) / 0.762).toLocaleString('id-ID');

        onMounted(loadActivityDetail);

        return { 
            activity, loading, performanceValue, performanceUnit, 
            locationName, weatherInfo, realSplits, // weatherIcon diganti weatherInfo
            calculateSteps, formatTime, formatDate 
        };
    }
};
