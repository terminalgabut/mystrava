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
        const dynamicLocation = ref(''); // State untuk menampung nama area dari API
        let map = null;

        /**
 * Mengambil alamat lengkap (Desa, Kec, Kab/Kota, Prov, ID) dari koordinat
 */
const fetchGeoLocation = async (lat, lng) => {
    try {
        // Gunakan zoom 18 untuk detail maksimal (sampai level desa/jalan)
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
            headers: { 'Accept-Language': 'id' } // Paksa bahasa Indonesia
        });
        const data = await response.json();
        
        // DEBUG: Cek di console browser untuk melihat isi objek address
        console.log("Full Address Object:", data.address);

        const addr = data.address;
        if (!addr) return 'Lokasi tidak dikenal';

        // Mapping yang lebih teliti untuk wilayah Indonesia
        const desa = addr.village || addr.suburb || addr.hamlet || addr.neighbourhood || addr.village_district || '';
        const kecamatan = addr.city_district || addr.district || addr.town || addr.municipality || '';
        const kabupaten = addr.city || addr.county || addr.regency || '';
        const provinsi = addr.state || 'Jawa Timur';
        const kodeNegara = (addr.country_code || 'id').toUpperCase();

        // Gabungkan hanya yang ada isinya (mengurangi koma kosong)
        const parts = [desa, kecamatan, kabupaten, provinsi, kodeNegara].filter(p => p && p.length > 0);
        
        // Jika masih gagal (hanya ada provinsi), tampilkan koordinat sebagai cadangan
        if (parts.length <= 2) {
            return `${lat.toFixed(4)}, ${lng.toFixed(4)}, ${provinsi}, ${kodeNegara}`;
        }

        return parts.join(', ');
    } catch (err) {
        console.error("Geocoding Error:", err);
        return `${lat.toFixed(3)}, ${lng.toFixed(3)}, ID`;
    }
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
                
                // 1. Normalisasi Data (PENTING: Memastikan elapsed_time terbaca sebagai angka)
                activity.value = {
                    ...data,
                    moving_time: Number(data.moving_time || 0),
                    elapsed_time: Number(data.elapsed_time || 0)
                };

                // 2. Logic Lokasi Akurat
                if (data.location_city) {
                    dynamicLocation.value = data.location_city;
                } else if (data.start_latlng && Array.isArray(data.start_latlng)) {
                    // Jika data kota kosong, kita cari nama areanya lewat koordinat
                    dynamicLocation.value = await fetchGeoLocation(data.start_latlng[0], data.start_latlng[1]);
                } else {
                    dynamicLocation.value = 'Jawa Timur, ID';
                }

                // 3. Render Map
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
                const path = L.polyline(coordinates, { color: '#2563eb', weight: 6, opacity: 0.9 }).addTo(map);
                map.fitBounds(path.getBounds(), { padding: [40, 40] });
            } catch (e) {
                Logger.error('Map_Init_Error', e);
            }
        };

        // --- COMPUTED PROPERTIES ---
        const locationName = computed(() => dynamicLocation.value || 'Memuat lokasi...');

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
