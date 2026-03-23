export default `
<div id="export-root" class="w-[600px] bg-[#0F172A] p-0 flex flex-col font-sans relative overflow-hidden antialiased">
  
  <div class="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
    <div class="absolute -top-24 -left-24 w-96 h-96 bg-blue-600 rounded-full blur-[120px]"></div>
    <div class="absolute top-1/2 -right-24 w-80 h-80 bg-purple-600 rounded-full blur-[100px]"></div>
  </div>

  <div class="relative z-10 p-8 flex flex-col gap-6">
    
    <div class="flex justify-between items-start">
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
           <span class="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter leading-none flex items-center h-5">
             {{ activity?.type || 'RUN' }}
           </span>
           <span class="text-slate-400 text-[10px] font-bold tracking-[0.2em] uppercase">
             Premium Activity
           </span>
        </div>
        <h1 class="text-3xl font-[900] text-white tracking-tighter leading-none uppercase italic">
          {{ activity?.name || 'Daily Session' }}
        </h1>
        <div class="flex items-center gap-2 text-[11px] font-bold text-slate-300 uppercase tracking-widest mt-1">
          <i class="fas fa-calendar-alt text-blue-500 text-[10px]"></i>
          <span class="leading-none">{{ formatDate(activity?.start_date) }}</span>
          <span class="w-1 h-1 bg-slate-700 rounded-full mx-1"></span>
          <i class="fas fa-map-marker-alt text-blue-500 text-[10px]"></i>
          <span class="leading-none">{{ activity?.location_name || 'Outdoor' }}</span>
        </div>
      </div>
      <div class="flex flex-col items-end">
         <div class="bg-white/10 backdrop-blur-md border border-white/10 text-white px-3 py-1.5 rounded-xl text-[10px] font-black italic tracking-tighter shadow-xl">
           MYSTRAVA<span class="text-blue-400">PRO</span>
         </div>
      </div>
    </div>

    <div class="w-full aspect-square rounded-[40px] overflow-hidden bg-slate-800 shadow-[0_30px_60px_rgba(0,0,0,0.5)] border-[1px] border-white/10 relative">
      <div id="export-map" class="w-full h-full opacity-90"></div>
      <div class="absolute inset-0 pointer-events-none border-[12px] border-black/5 rounded-[40px]"></div>
      <div class="absolute bottom-6 right-6 opacity-40">
         <div class="text-[8px] text-white font-black tracking-widest uppercase bg-black/20 backdrop-blur-md px-2 py-1 rounded">Verified GPS</div>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-3">
      <div class="bg-white/5 backdrop-blur-md border border-white/10 rounded-[28px] p-5 flex flex-col items-center justify-center shadow-2xl h-24">
        <span class="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1 leading-none">Distance</span>
        <div class="flex items-baseline gap-1">
          <span class="text-3xl font-black text-white italic tracking-tighter leading-none">{{ ((activity?.distance || 0)/1000).toFixed(2) }}</span>
          <span class="text-[10px] font-black text-slate-500 uppercase italic leading-none">KM</span>
        </div>
      </div>
      
      <div class="bg-blue-600 rounded-[28px] p-5 flex flex-col items-center justify-center shadow-[0_10px_30px_rgba(37,99,235,0.3)] h-24">
        <span class="text-[9px] font-black text-blue-100 uppercase tracking-[0.2em] mb-1 leading-none">Avg Pace</span>
        <span class="text-3xl font-black text-white italic tracking-tighter leading-none">{{ performanceValue }}</span>
      </div>

      <div class="bg-white/5 backdrop-blur-md border border-white/10 rounded-[28px] p-5 flex flex-col items-center justify-center shadow-2xl h-24">
        <span class="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1 leading-none text-center">Elevation</span>
        <div class="flex items-baseline gap-1">
          <span class="text-3xl font-black text-white italic tracking-tighter leading-none">{{ Math.round(activity?.total_elevation_gain || 0) }}</span>
          <span class="text-[10px] font-black text-slate-500 uppercase italic leading-none">M</span>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between px-5 py-4 bg-white/[0.03] rounded-3xl border border-white/5">
      <div class="flex gap-8">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
            <i class="fas fa-fire text-orange-500 text-xs"></i>
          </div>
          <div class="flex flex-col">
            <span class="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Calories</span>
            <span class="text-xs font-black text-slate-200 leading-none">{{ Math.round(activity?.calories || 0) }} kcal</span>
          </div>
        </div>
        
        <div class="flex items-center gap-3" v-if="activity?.weather_temp">
          <div class="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
            <i class="fas fa-cloud-sun text-blue-400 text-xs"></i>
          </div>
          <div class="flex flex-col">
            <span class="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Weather</span>
            <span class="text-xs font-black text-slate-200 leading-none">{{ activity?.weather_temp }}°C Clear</span>
          </div>
        </div>
      </div>

      <div class="h-8 w-[1px] bg-white/10"></div>

      <div class="flex items-center gap-3">
        <div class="flex flex-col items-end">
          <span class="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Moving Time</span>
          <span class="text-xs font-black text-slate-200 tabular-nums leading-none">{{ formatTime(activity?.moving_time) }}</span>
        </div>
        <div class="w-8 h-8 rounded-full bg-slate-500/10 flex items-center justify-center">
           <i class="fas fa-stopwatch text-slate-400 text-xs"></i>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-3">
      <div class="flex items-center gap-3 px-1">
        <h3 class="text-[10px] font-black text-white uppercase tracking-[0.3em] leading-none">Lap Splits</h3>
        <div class="h-[1px] flex-1 bg-gradient-to-r from-blue-500/50 to-transparent"></div>
      </div>

      <div class="grid grid-cols-4 gap-2">
        <div v-for="split in displayedSplits" :key="split.number"
             class="bg-white/[0.03] border border-white/5 rounded-2xl p-3 flex flex-col items-center justify-center transition-all h-[54px]">
          <span class="text-[8px] font-black text-slate-500 mb-1 uppercase tracking-tighter leading-none">KM {{ split.number }}</span>
          <span class="text-[11px] font-black text-white tabular-nums tracking-tighter leading-none">{{ split.pace }}</span>
          <div class="w-4 h-[1.5px] bg-blue-600/40 mt-1.5 rounded-full"></div>
        </div>
      </div>
    </div>

    <div class="flex justify-center items-center gap-4 mt-1 opacity-20">
       <div class="h-[0.5px] w-12 bg-white"></div>
       <span class="text-[8px] font-bold text-white uppercase tracking-[0.5em] leading-none">No Pain No Gain</span>
       <div class="h-[0.5px] w-12 bg-white"></div>
    </div>

  </div>
</div>
`;
