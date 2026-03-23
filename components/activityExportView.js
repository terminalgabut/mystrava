// root/components/activityExportView.js

export default `
<div id="export-root" class="export-container">
  
  <!-- HEADER -->
  <div class="export-header">
    <h1>{{ activity?.name || 'Activity' }}</h1>
    <p>
      {{ formatDate(activity?.start_date) }} • 
      {{ activity?.location_name || 'Unknown' }}
    </p>
  </div>

  <!-- MAP -->
  <div class="export-map">
    <div id="export-map" style="width:100%; height:100%;"></div>
  </div>

  <!-- HERO -->
  <div class="export-hero">
    <div class="distance">
      {{ ((activity?.distance || 0)/1000).toFixed(2) }}
      <span>km</span>
    </div>
    <div class="meta">
      {{ performanceValue }} • {{ Math.round(activity?.calories || 0) }} kcal
    </div>
  </div>

  <!-- SPLITS -->
  <div class="export-splits">
    <div v-for="split in displayedSplits" :key="split.number" class="split-row">
      <span>KM {{ split.number }}</span>
      <span>{{ split.pace }}</span>
    </div>

    <div v-if="remainingSplits > 0" class="more">
      +{{ remainingSplits }} more
    </div>
  </div>

</div>
`;
