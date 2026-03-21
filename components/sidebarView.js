export default {
  name: 'SidebarView',
  template: `
    <aside class="app-sidebar">
        <div class="sidebar-container">
            <div class="sidebar-logo px-6 py-8 hidden md:block">
                <span class="text-2xl font-black italic text-blue-600 tracking-tighter">DS.PRO</span>
            </div>

            <nav class="sidebar-nav px-3 space-y-1">
                <p class="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Main Menu</p>
                
                <router-link to="/" class="sidebar-item group">
                    <i data-lucide="layout-dashboard" class="w-5 h-5"></i>
                    <span>Dashboard</span>
                </router-link>

                <router-link to="/activities" class="sidebar-item group">
                    <i data-lucide="run" class="w-5 h-5"></i>
                    <span>Activities</span>
                </router-link>

                <router-link to="/statistics" class="sidebar-item group">
                    <i data-lucide="bar-chart-big" class="w-5 h-5"></i>
                    <span>Analytics</span>
                </router-link>
            </nav>

            <div class="mt-auto p-4 border-t border-slate-100">
                <div class="bg-blue-50 rounded-2xl p-4">
                    <p class="text-[10px] font-bold text-blue-600 uppercase">Pro Status</p>
                    <p class="text-xs text-blue-400 mt-1">Sync: 100% Active</p>
                </div>
            </div>
        </div>
    </aside>
  `
};
