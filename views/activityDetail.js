// activityDetail.js
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
        let mapInstance = null; // Gunakan nama berbeda agar tidak bentrok dengan id="map"

        const refreshLucide = () => nextTick(() => window.lucide?.createIcons());

        // --- CORE LOGIC ---
        const loadActivityDetail = async () => {
            loading.value = true;
            try {
                const { data, error } = await supabase
                    .from('activities')
                    .select('*')
                    .eq('id', route.params.id)
                    .maybeSingle(); // Lebih aman daripada .single()

                if (error) throw error;
                if (!data) return;

                activity.value = data;

                // Handle Map: Tunggu loading=false agar elemen #map dirender oleh Vue
                if (data.summary_polyline) {
                    setTimeout(() => {
                        initMap(data.summary_polyline);
                    }, 100); // Beri jeda sedikit lebih lama dari nextTick untuk render DOM
                }

                // Background enrichment untuk lokasi jika kosong
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
                refreshLucide();
            }
        };

        const initMap = (polylineStr) => {
            // Bersihkan instance lama jika ada
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
                    dragging: !L.Browser.mobile, // Disable drag di mobile agar scroll enak
                    scrollWheelZoom: false 
                }).setView(coords[0], 13);

                L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(mapInstance);
                
                const path = L.polyline(coords, { 
                    color: '#3b82f6', 
                    weight: 5, 
                    opacity: 0.8, 
                    lineJoin: 'round' 
                }).addTo(mapInstance);

                mapInstance.fitBounds(path.getBounds(), { padding: [30, 30] });
            } catch (e) {
                Logger.error('Map_Init_Error', e);
            }
        };

        const getGeoFallback = async (lat, lng) => {
            try {
                const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10`);
                const data = await resp.json();
                const a = data.address;
                return [a.village || a.suburb || '', a.city || a.regency || 'Indonesia'].filter(Boolean).join(', ');
            } catch { return null; }
        };

        // --- COMPUTED (Diberi Guard agar tidak crash saat data null) ---
        const locationName = computed(() => activity.value?.location_name || 'Global Area');
        
        const performanceValue = computed(() => {
            if (!activity.value) return '--:--';
            return stravaService.calculatePace(activity.value.average_speed, activity.value.type);
        });

        const performanceUnit = computed(() => activity.value?.type === 'Ride' ? 'km/h' : '/km');

        const weatherIcon = computed(() => {
            const type = activity.value?.type;
            return type === 'Ride' ? 'zap' : (type === 'Run' ? 'sun' : 'cloud');
        });
        
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

        // --- FORMATTERS (Null-Safe) ---
        const formatTime = (seconds) => {
            const totalSeconds = Number(seconds) || 0;
            const h = Math.floor(totalSeconds / 3600);
            const m = Math.floor((totalSeconds % 3600) / 60);
            const s = Math.floor(totalSeconds % 60);
            return h > 0 
                ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
                : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '...';
            try {
                return new Date(dateStr).toLocaleDateString('id-ID', { 
                    day: 'numeric', month: 'short', year: 'numeric' 
                });
            } catch { return dateStr; }
        };

        const calculateSteps = (dist) => {
            const d = Number(dist) || 0;
            return Math.round(d / 0.762).toLocaleString('id-ID'); // Gunakan faktor konversi standar service
        };

        onMounted(loadActivityDetail);

        return { 
            activity, loading, performanceValue, performanceUnit, 
            locationName, weatherIcon, realSplits,
            calculateSteps, formatTime, formatDate 
        };
    }
};
