// components/headerView.js

export default {
  name: 'HeaderView',
  template: `
    <nav class="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-[100] border-b border-slate-100">
        <div class="max-w-5xl mx-auto px-4 flex justify-between items-center h-16">
            <router-link to="/" class="font-black italic text-2xl text-orange-600 tracking-tighter hover:opacity-80 transition-opacity">
                DASHSTRAV
            </router-link>
            
            <div class="flex gap-2 md:gap-4 items-center">
                <router-link to="/statistics" class="nav-icon group" title="Statistik">
                    <i data-lucide="bar-chart-3" class="w-5 h-5 transition-all"></i>
                </router-link>
                
                <router-link to="/activities" class="nav-icon group" title="Aktivitas">
                    <i data-lucide="activity" class="w-5 h-5 transition-all"></i>
                </router-link>
            </div>
        </div>
    </nav>
  `
};
