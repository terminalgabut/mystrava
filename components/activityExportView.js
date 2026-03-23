export default `
<div id="export-root" class="w-[600px] bg-[#F8FAFC] p-8 flex flex-col gap-6 font-sans relative overflow-hidden">
  
  <div class="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>

  <div class="flex justify-between items-start">
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-[900] text-slate-900 tracking-tight leading-tight uppercase">
        {{ activity?.name || 'Daily Run' }}
      </h1>
      <div class="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
        <span>{{ formatDate(activity?.start_date) }}</span>
        <span class="w-1 h-1 bg-slate-300 rounded-full"></span>
        <span>{{ activity?.location_name || 'Outdoor Track' }}</span>
      </div>
    </div>
    <div class="bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-black italic tracking-tighter">
      MYSTRAVA<span class="text-blue-400">PRO</span>
    </div>
  </div>

  <div class="w-full aspect-square rounded-[48px] overflow-hidden bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-[8px] border-white relative">
    <div id="export-map" class="w-full h-full"></div>
    <div class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
  </div>

  <div class="grid grid-cols-3 gap-4">
    <div class="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 flex flex-col items-center justify-center">
      <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Distance</span>
      <div class="flex items-baseline gap-1">
        <span class="text-2xl font-black text-slate-900">{{ ((activity?.distance || 0)/1000).toFixed(2) }}</span>
        <span class="text-xs font-bold text-slate-500">KM</span>
      </div>
    </div>
    
    <div class="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 flex flex-col items-center justify-center">
      <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Pace</span>
      <span class="text-2xl font-black text-slate-900">{{ performanceValue }}</span>
    </div>

    <div class="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 flex flex-col items-center justify-center">
      <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Elevation</span>
      <div class="flex items-baseline gap-1">
        <span class="text-2xl font-black text-slate-900">{{ Math.round(activity?.total_elevation_gain || 0) }}</span>
        <span class="text-xs font-bold text-slate-500">M</span>
      </div>
    </div>
  </div>

  <div class="flex items-center justify-between px-2">
    <div class="flex items-center gap-4">
       <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
             <i class="fas fa-fire text-orange-500 text-xs"></i>
          </div>
          <span class="text-xs font-bold text-slate-600">{{ Math.round(activity?.calories || 0) }} kcal</span>
       </div>
       <div class="flex items-center gap-2" v-if="activity?.weather_temp">
          <div class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
             <i class="fas fa-cloud-sun text-blue-500 text-xs"></i>
          </div>
          <span class="text-xs font-bold text-slate-600">{{ activity?.weather_temp }}°C</span>
       </div>
    </div>
    <div class="text-[11px] font-bold text-slate-400 uppercase italic">
       Moving Time: {{ formatTime(activity?.moving_time) }}
    </div>
  </div>

  <div class="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm flex flex-col gap-4">
    <div class="flex justify-between items-center px-1">
      <h3 class="text-xs font-[900] text-slate-900 uppercase tracking-[0.2em]">Splits Analysis</h3>
      <div class="h-[1px] flex-1 mx-4 bg-slate-100"></div>
      <span class="text-[10px] font-bold text-slate-400 uppercase">Min/KM</span>
    </div>

    <div class="grid grid-cols-1 gap-2">
      <div v-for="split in displayedSplits" :key="split.number"
           class="flex justify-between items-center bg-slate-50/50 hover:bg-slate-50 px-4 py-3 rounded-2xl transition-colors border border-transparent hover:border-slate-100">
        
        <div class="flex items-center gap-4">
          <span class="w-6 text-[10px] font-black text-slate-300">#{{ split.number }}</span>
          <div class="h-8 w-[2px] bg-blue-500 rounded-full"></div>
          <div class="flex flex-col">
            <span class="text-xs font-black text-slate-900">Kilometer {{ split.number }}</span>
            <span class="text-[9px] font-bold text-emerald-500">{{ split.elevation > 0 ? '+' : '' }}{{ split.elevation }}m gain</span>
          </div>
        </div>

        <div class="text-sm font-black text-slate-900 tabular-nums">
          {{ split.pace }}
        </div>

      </div>
    </div>
  </div>

  <div class="text-center mt-2">
    <p class="text-[10px] font-bold text-slate-300 italic">"Consistency is the key to excellence"</p>
  </div>

</div>
`;
