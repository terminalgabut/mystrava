// activityDetail.js
import detailTemplate from './activityDetailView.js';
import { supabase } from '../js/services/supabase.js';
import { stravaService } from '../js/services/stravaService.js';
import { Logger } from '../js/services/debug.js';
import { getWeatherEngine } from '../js/utils/weatherEngine.js'; 
import { initActivityMap } from '../js/utils/mapEngine.js';
import { captureElement } from '../js/utils/exportEngine.js';
import ActivityExportComponent from '../components/activityExportComponent.js';

export default {
    name: 'ActivityDetailView',
    template: detailTemplate,
    setup() {
        const { ref, onMounted, onUnmounted, nextTick, computed, watch } = Vue;
        const route = VueRouter.useRoute();
        
        const activity = ref(null);
        const loading = ref(true);
        let mapInstance = null;

        // --- UI HELPERS ---
        const refreshLucide = () => nextTick(() => {
            if (window.lucide) window.lucide.createIcons();
        });

        // --- DATA LOADING ---
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

                // INISIALISASI MAPBOX via Engine
                if (data.summary_polyline) {
                    nextTick(() => {
                        // Bersihkan map lama jika ada (Safety check)
                        if (mapInstance) {
                            mapInstance.remove();
                            mapInstance = null;
                        }
                        // Panggil Engine: ID kontainer di template harus 'map'
                        mapInstance = initActivityMap('map', data);
                    });
                }

                // Fallback Nama Lokasi jika kosong
                if (!data.location_name && data.start_lat) {
                    fetchReverseGeocode(data.start_lat, data.start_lng);
                }

            } catch (err) {
                Logger.error('Detail_Load_Error', err);
            } finally {
                loading.value = false;
                refreshLucide();
            }
        };

        const fetchReverseGeocode = async (lat, lng) => {
            try {
                const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10`);
                const geo = await resp.json();
                const addr = geo.address;
                const location = [addr.village || addr.suburb || '', addr.city || addr.regency || 'Indonesia'].filter(Boolean).join(', ');
                
                if (location) {
                    activity.value.location_name = location;
                    await supabase.from('activities').update({ location_name: location }).eq('id', activity.value.id);
                }
            } catch (e) { return null; }
        };

        // --- WEATHER ENGINE COMPUTED ---
        const weatherInfo = computed(() => {
            if (!activity.value || activity.value.weather_temp === null) {
                return { icon: 'cloud', bg: 'bg-slate-50', text: 'text-slate-400', status: 'N/A' };
            }

            // Panggil Engine V8 (Support Konteks Waktu + WMO Code)
            const engine = getWeatherEngine(
                activity.value.weather_temp,
                activity.value.weather_humidity,
                activity.value.weather_wind,
                activity.value.start_date,
                activity.value.weather_code // Gunakan weather_code dari DB
            );

            return engine.main;
        });

        // Watch weatherInfo untuk update icon Lucide secara reaktif
        watch(weatherInfo, () => refreshLucide());

        // --- PERFORMANCE COMPUTED ---
        const performanceValue = computed(() => 
            activity.value ? stravaService.calculatePace(activity.value.average_speed, activity.value.type) : '--:--'
        );

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
            const total = Number(seconds) || 0;
            const h = Math.floor(total / 3600);
            const m = Math.floor((total % 3600) / 60);
            const s = Math.floor(total % 60);
            return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '...';
            return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        };

        const downloadSnapshot = async () => {
    console.log("🚀 Export mode terpisah...");

    const container = document.getElementById('export-mount');
    if (!container) {
        console.error("❌ export-mount tidak ditemukan");
        return;
    }

    // 🔥 Buat Vue instance khusus export
    const app = Vue.createApp({
        components: { ActivityExportComponent },
        template: `<ActivityExportComponent :activity="activity" />`,
        setup() {
            return {
                activity
            };
        }
    });

    // 🔹 mount ke hidden DOM
    const vm = app.mount(container);

    await nextTick(); // tunggu render selesai

    // 🔥 capture export view
    const success = await captureElement(
        'export-root',
        `Activity-${activity.value?.name || 'Export'}`
    );

    // 🔥 cleanup
    app.unmount();
    container.innerHTML = "";

    if (success) {
        console.log("✅ Export berhasil!");
    }
};
        onMounted(loadActivityDetail);

        onUnmounted(() => {
            if (mapInstance) {
                mapInstance.remove();
                mapInstance = null;
            }
        });

        return { 
            activity, loading, performanceValue, 
            weatherInfo, realSplits,
            formatTime, formatDate, downloadSnapshot
        };
    }
};
