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

    /**
     * 🔹 PERFORMANCE VALUE (Dynamic Logic)
     * Mengikuti konsep: Run/Walk = Pace (00:00), Ride = Speed (km/h)
     */
    const performanceValue = computed(() => {
      if (!props.activity) return '--:--';
      
      const type = props.activity.type?.toLowerCase();
      const speed = props.activity.average_speed; // m/s dari Strava

      if (type === 'ride') {
        // Konversi m/s ke km/h untuk bersepeda
        const kmh = speed * 3.6;
        return kmh.toFixed(1);
      } else {
        // Gunakan service existing untuk format Pace (min/km)
        return stravaService.calculatePace(speed, props.activity.type);
      }
    });

    // 🔹 DURATION FORMAT (HH:MM:SS)
    const formatTime = (seconds) => {
        const total = Number(seconds) || 0;
        const h = Math.floor(total / 3600);
        const m = Math.floor((total % 3600) / 60);
        const s = Math.floor(total % 60);
        
        if (h > 0) {
            return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    // 🔹 DATE FORMAT
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    };

    /**
     * 🔥 SPLITS DATA REFACTOR
     * Menampilkan semua data KM dengan format yang sesuai tipe aktivitas
     */
    const displayedSplits = computed(() => {
      const splits = props.activity?.splits_metric || [];
      const type = props.activity?.type?.toLowerCase();

      return splits.map(s => {
        let displayPace;
        
        if (type === 'ride') {
            // Untuk sepeda, tampilkan Speed per KM (km/h)
            displayPace = (s.average_speed * 3.6).toFixed(1);
        } else {
            // Untuk lari/jalan, tampilkan Pace (min/km)
            displayPace = stravaService.calculatePace(s.average_speed, props.activity?.type);
        }

        return {
          number: s.split,
          elevation: Math.round(s.elevation_difference || 0),
          pace: displayPace
        };
      });
    });

    // 🔹 INIT MAP (Export Premium)
    onMounted(() => {
      if (!props.activity?.summary_polyline) return;

      nextTick(() => {
        if (mapInstance) {
          mapInstance.remove();
          mapInstance = null;
        }

        // Inisialisasi peta ke ID 'export-map'
        mapInstance = initActivityMap('export-map', props.activity);
        
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
      displayedSplits
    };
  }
};
