import template from './activityExportView.js';

export default {
  props: ['activity'],
  template,

  setup(props) {
    const displayedSplits = computed(() => {
      const splits = props.activity?.splits_metric || [];
      return splits.slice(0, 5);
    });

    const remainingSplits = computed(() => {
      const splits = props.activity?.splits_metric || [];
      return Math.max(0, splits.length - 5);
    });

    return {
      displayedSplits,
      remainingSplits
    };
  }
};
