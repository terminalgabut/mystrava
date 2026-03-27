// activityDetail.js
import detailTemplate from './activityDetailView.js';
import { supabase } from '../js/services/supabase.js';
import { stravaService } from '../js/services/stravaService.js';
import { Logger } from '../js/services/debug.js';
import { getWeatherEngine } from '../js/utils/weatherEngine.js'; 
import { initActivityMap } from '../js/utils/mapEngine.js';
import { captureElement } from '../js/utils/exportEngine.js';
import ActivityExportComponent from '../components/activityExportComponent.js';
import { PerformanceLogic } from '../js/utils/performanceLogic.js';
import PaceZoneChart from '../js/utils/PaceZoneChart.js';

export default {
    name: 'ActivityDetailView',
    template: detailTemplate,
    components: { ActivityExportComponent, PaceZoneChart },
    setup() {
        const { ref, onMounted, onUnmounted, nextTick, computed, watch, createApp } = Vue;
        const route = VueRouter.useRoute();
        
        const activity = ref(null);
        const loading = ref(true);
        const isExportReady = ref(false); // Status kesiapan peta ekspor
        let mapInstance = null;
        let exportApp = null; // Instance Vue untuk ekspor

        // --- UI HELPERS ---
        const refreshLucide = () => nextTick(() => {
            if (window.lucide) window.lucide.createIcons();
        });

        // --- PRE-RENDER EXPORT ENGINE ---
        // Fungsi ini menyiapkan komponen ekspor di latar belakang
        const prepareExportComponent = () => {
            const container = document.getElementById('export-mount');
            if (!container || !activity.value) return;

            console.log("⏳ Menyiapkan peta ekspor di latar belakang...");

            // Hapus instance lama jika ada
            if (exportApp) {
                exportApp.unmount();
                container.innerHTML = "";
            }

            exportApp = createApp({
                components: { ActivityExportComponent },
                template: `<ActivityExportComponent :activity="activity" />`,
                setup() {
                    return { activity: activity.value };
                }
            });

            exportApp.mount(container);

            // Beri waktu Mapbox untuk loading tiles (3-4 detik cukup aman)
            setTimeout(() => {
                isExportReady.value = true;
                console.log("✅ Peta ekspor siap digunakan.");
            }, 4000);
        };

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

                // INISIALISASI MAP UTAMA (View)
                if (data.summary_polyline) {
                    nextTick(() => {
                        if (mapInstance) {
                            mapInstance.remove();
                            mapInstance = null;
                        }
                        mapInstance = initActivityMap('map', data);
                        
                        // 🔥 TRIGGER PRE-RENDER EKSPOR
                        prepareExportComponent();
                    });
                }

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

        const threshold = computed(() => 
            activity.value?.athlete_pace_threshold_snapshot || 455
        );

        // --- WEATHER & STATS COMPUTED ---
        const weatherInfo = computed(() => {
            if (!activity.value || activity.value.weather_temp === null) {
                return { icon: 'cloud', bg: 'bg-slate-50', text: 'text-slate-400', status: 'N/A' };
            }
            const engine = getWeatherEngine(
                activity.value.weather_temp,
                activity.value.weather_humidity,
                activity.value.weather_wind,
                activity.value.start_date,
                activity.value.weather_code
            );
            return engine.main;
        });

        watch(weatherInfo, () => refreshLucide());

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

        // --- DOWNLOAD ACTION ---
        const downloadSnapshot = async () => {
            if (!isExportReady.value) {
                alert("Sedang menyiapkan peta ekspor, tunggu beberapa detik...");
                return;
            }

            console.log("📸 Memulai ekspor dari pre-rendered component...");
            
            // captureElement mengambil 'export-root' yang sudah di-mount oleh prepareExportComponent
            const success = await captureElement(
                'export-root',
                `Activity-${activity.value?.name || 'Export'}`
            );

            if (success) {
                console.log("✅ Export berhasil!");
            }
        };
        
        onMounted(loadActivityDetail);

        onUnmounted(() => {
            if (mapInstance) mapInstance.remove();
            if (exportApp) exportApp.unmount();
        });

        return { 
            activity, loading, performanceValue, 
            weatherInfo, realSplits, isExportReady,threshold,
            formatTime, formatDate, downloadSnapshot
        };
    }
};
