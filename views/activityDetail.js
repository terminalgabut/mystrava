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
        const dynamicLocation = ref(''); 
        let map = null;

        /**
         * Mengambil alamat lengkap & akurat (Desa, Kec, Kab, Prov, ID)
         */
        const fetchGeoLocation = async (lat, lng) => {
            if (!lat || !lng) return 'Lokasi tidak tersedia';
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
                    headers: { 'Accept-Language': 'id' }
                });
                const data = await response.json();
                const addr = data.address;
                if (!addr) return 'Area Terdeteksi';

                const parts = [
                    addr.village || addr.suburb || addr.hamlet || addr.neighbourhood || '', // Desa
                    addr.city_district || addr.district || addr.town || '',               // Kecamatan
                    addr.city || addr.county || addr.regency || '',                       // Kab/Kota
                    addr.state || 'Jawa Timur',                                           // Provinsi
                    (addr.country_code || 'id').toUpperCase()                             // ID
                ].filter(p => p && p.length > 0);

                return parts.join(', ');
            } catch (err) {
                return `${lat.toFixed(3)}, ${lng.toFixed(3)}`;
            }
        };

        /**
         * Mengambil data cuaca (Bisa dikembangkan dengan API OpenWeather)
         */
        const getWeatherData = async (lat, lng) => {
            // Simulasi data cuaca yang realistis (Atau panggil API cuaca di sini)
            return {
                temp: 28 + Math.floor(Math.random() * 4), // 28-32 C
                wind: 10 + Math.floor(Math.random() * 5), // 10-15 km/h
                hum: 60 + Math.floor(Math.random() * 10)  // 60-70 %
            };
        };

        const loadActivityDetail = async () => {
            loading.value = true;
            try {
                const { data, error } = await supabase
                    .from('activities')
                    .select('*')
                    .eq('id', route.params.id)
                    .single();

                if (error) throw error;
                
                activity.value = {
                    ...data,
                    moving_time: Number(data.moving_time || 0),
                    elapsed_time: Number(data.elapsed_time || 0)
                };

                // --- DATA ENRICHMENT (FETCH & SAVE TO DB) ---
                // Jika kolom location_name atau weather_temp masih kosong di DB
                if (!data.location_name || !data.weather_temp) {
                    const [lat, lng] = data.start_latlng || [0, 0];
                    
                    const [fullAddr, weather] = await Promise.all([
                        fetchGeoLocation(lat, lng),
                        getWeatherData(lat, lng)
                    ]);

                    // Update Supabase agar permanen
                    const { error: updateError } = await supabase
                        .from('activities')
                        .update({ 
                            location_name: fullAddr,
                            weather_temp: weather.temp,
                            weather_wind: weather.wind,
                            weather_humidity: weather.hum
                        })
                        .eq('id', data.id);

                    if (!updateError) {
                        dynamicLocation.value = fullAddr;
                        activity.value.weather_temp = weather.temp;
                        activity.value.weather_wind = weather.wind;
                        activity.value.weather_humidity = weather.hum;
                    }
                } else {
                    // Jika sudah ada di DB, langsung pakai
                    dynamicLocation.value = data.location_name;
                }

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
            try {
                const coordinates = polyline.decode(polylineStr); 
                map = L.map('map', { zoomControl: false, attributionControl: false }).setView(coordinates[0], 13);
                L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);
                const path = L.polyline(coordinates, { color: '#2563eb', weight: 6, opacity: 0.9, lineJoin: 'round' }).addTo(map);
                map.fitBounds(path.getBounds(), { padding: [40, 40] });
            } catch (e) {
                Logger.error('Map_Init_Error', e);
            }
        };

        // --- COMPUTED ---
        const locationName = computed(() => dynamicLocation.value || 'Memuat lokasi...');
        const performanceValue = computed(() => activity.value ? stravaService.calculatePace(activity.value.average_speed, activity.value.type) : '--:--');
        const performanceUnit = computed(() => activity.value?.type === 'Ride' ? 'km/h' : '/km');
        const weatherIcon = computed(() => activity.value?.type === 'Ride' ? 'cloud-lightning' : 'sun');
        
        const realSplits = computed(() => {
            if (!activity.value?.splits_metric) return [];
            return activity.value.splits_metric.map(s => ({
                number: s.split,
                distance: (s.distance / 1000).toFixed(1),
                pace: stravaService.calculatePace(s.average_speed, activity.value.type),
                elevation: Math.round(s.elevation_difference || 0)
            }));
        });

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
            return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
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
