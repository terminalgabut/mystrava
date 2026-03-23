// root/components/activityExportComponent.js

import template from './activityExportView.js';
import { stravaService } from '../js/services/stravaService.js';
import { initActivityMap } from '../js/utils/mapEngine.js';

export default {
  name: 'ActivityExportComponent',
  props: ['activity'],
  template,

  setup(props) {
    const { computed, onMounted, nextTick } = Vue;

    let mapInstance = null;

    // 🔹 Format Pace (Rata-rata)
    const performanceValue = computed(() => {
      if (!props.activity) return '--:--';
      return stravaService.calculatePace(
        props.activity.average_speed,
        props.activity.type
      );
    });

    // 🔹 Format Durasi (HH:MM:SS)
    const formatTime = (seconds) => {
        const total = Number(seconds) || 0;
        const h = Math.floor(total / 3600);
        const m = Math.floor((total % 3600) / 60);
        const s = Math.floor(total % 60);
        return h > 0 
            ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` 
            : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    // 🔹 Format Tanggal
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    };

    // 🔥 SPLITS FULL (Refactor untuk tampilan Profesional)
    // Menghapus .slice(0, 5) agar memuat SEMUA data pace
    const displayedSplits = computed(() => {
      const splits = props.activity?.splits_metric || [];

      return splits.map(s => ({
        number: s.split,
        // Tambahkan elevasi agar data di ekspor seakurat screenshot manual
        elevation: Math.round(s.elevation_difference || 0),
        pace: stravaService.calculatePace(
          s.average_speed,
          props.activity?.type
        )
      }));
    });

    // Tetap pertahankan ini sebagai fallback jika template membutuhkan
    const remainingSplits = computed(() => {
      return 0; // Set 0 karena semua sudah ditampilkan di atas
    });

    // 🔥 INIT MAP (WAJIB untuk export premium)
    onMounted(() => {
      if (!props.activity?.summary_polyline) return;

      nextTick(() => {
        // cleanup dulu (safety)
        if (mapInstance) {
          mapInstance.remove();
          mapInstance = null;
        }

        // Inisialisasi peta ke ID 'export-map' yang ada di view
        mapInstance = initActivityMap('export-map', props.activity);
        
        // Pastikan map menyesuaikan ukuran container square yang baru
        if (mapInstance) {
            setTimeout(() => {
                mapInstance.resize();
            }, 500);
        }
      });
    });

    return {
      performanceValue,
      formatTime,
      formatDate,
      displayedSplits,
      remainingSplits
    };
  }
};
