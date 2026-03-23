export default `
<div id="export-root" class="w-[600px] bg-slate-50 p-6 flex flex-col gap-5 font-sans">

  <!-- HEADER -->
  <div class="flex flex-col gap-1">
    <h1 class="text-xl font-black text-slate-900">
      {{ activity?.name || 'Activity' }}
    </h1>
    <p class="text-xs text-slate-500 font-semibold">
      {{ formatDate(activity?.start_date) }} • 
      {{ activity?.location_name || 'Unknown' }}
    </p>
  </div>

  <!-- MAP -->
  <div class="w-full h-[220px] rounded-2xl overflow-hidden bg-slate-200">
    <div id="export-map" class="w-full h-full"></div>
  </div>

  <!-- HERO -->
  <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center">
    
    <div class="text-4xl font-black text-slate-900">
      {{ ((activity?.distance || 0)/1000).toFixed(2) }}
      <span class="text-lg text-slate-400 font-bold">km</span>
    </div>

    <div class="mt-2 text-sm font-bold text-slate-600">
      {{ performanceValue }} • {{ Math.round(activity?.calories || 0) }} kcal
    </div>

  </div>

  <!-- SPLITS -->
  <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
    
    <div class="flex justify-between mb-2">
      <h3 class="text-sm font-black text-slate-900">Splits</h3>
      <span class="text-xs text-slate-400 font-bold">Pace</span>
    </div>

    <div class="flex flex-col gap-2">
      <div v-for="split in displayedSplits" :key="split.number"
           class="flex justify-between bg-slate-50 px-3 py-2 rounded-xl">
        
        <span class="text-xs font-bold text-slate-700">
          KM {{ split.number }}
        </span>

        <span class="text-xs font-black text-slate-900">
          {{ split.pace }}
        </span>

      </div>
    </div>

    <div v-if="remainingSplits > 0"
         class="mt-2 text-center text-xs text-slate-400 font-bold">
      +{{ remainingSplits }} more
    </div>

  </div>

</div>
`;
