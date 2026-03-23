// root/components/activityExportComponent.js

import template from './activityExportView.js';
import { stravaService } from '../js/services/stravaService.js';

export default {
  name: 'ActivityExportComponent',
  props: ['activity'],
  template,

  setup(props) {
    const { computed } = Vue;

    // 🔹 Pace / speed
    const performanceValue = computed(() => {
      if (!props.activity) return '--:--';
      return stravaService.calculatePace(
        props.activity.average_speed,
        props.activity.type
      );
    });

    // 🔹 Format tanggal
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    };

    // 🔥 SPLITS (LIMITED)
    const displayedSplits = computed(() => {
      const splits = props.activity?.splits_metric || [];

      return splits.slice(0, 5).map(s => ({
        number: s.split,
        pace: stravaService.calculatePace(
          s.average_speed,
          props.activity?.type
        )
      }));
    });

    const remainingSplits = computed(() => {
      const splits = props.activity?.splits_metric || [];
      return Math.max(0, splits.length - 5);
    });

    return {
      performanceValue,
      formatDate,
      displayedSplits,
      remainingSplits
    };
  }
};
