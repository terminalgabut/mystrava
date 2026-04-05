export default {
  name: 'SidebarView',
  template: `
    <aside class="app-sidebar">
        <div class="sidebar-container flex flex-col h-full bg-white border-r border-slate-100">
            <div class="sidebar-logo px-8 py-10">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
                        <i data-lucide="zap" class="w-5 h-5 text-white"></i>
                    </div>
                    <span class="text-xl font-black italic text-slate-900 tracking-tighter">NGANGGUR.PRO</span>
                </div>
            </div>

            <nav class="sidebar-nav px-4 space-y-1.5 flex-grow">
                <p class="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Main Menu</p>
                
                <router-link to="/" class="sidebar-item group" active-class="is-active">
                    <div class="sidebar-icon-box">
                        <i data-lucide="layout-grid" class="w-5 h-5"></i>
                    </div>
                    <span class="font-semibold text-sm">Dashboard</span>
                    <div class="active-indicator"></div>
                </router-link>

                <router-link to="/activities" class="sidebar-item group" active-class="is-active">
                    <div class="sidebar-icon-box">
                        <i data-lucide="activity" class="w-5 h-5"></i>
                    </div>
                    <span class="font-semibold text-sm">Activities</span>
                    <div class="active-indicator"></div>
                </router-link>

                <router-link to="/coach" class="sidebar-item group" active-class="is-active">
                    <div class="sidebar-icon-box">
                        <i data-lucide="sparkles" class="w-5 h-5 text-blue-500"></i>
                    </div>
                    <span class="font-semibold text-sm text-blue-600">AI Coach</span>
                    <div class="active-indicator"></div>
                </router-link>

                <router-link to="/analysis" class="sidebar-item group" active-class="is-active">
                    <div class="sidebar-icon-box">
                        <i data-lucide="trending-up" class="w-5 h-5"></i>
                    </div>
                    <span class="font-semibold text-sm">Analytics</span>
                    <div class="active-indicator"></div>
                </router-link>

                <router-link to="/training-log" class="sidebar-item group" active-class="is-active">
                    <div class="sidebar-icon-box">
                        <i data-lucide="calendar-days" class="w-5 h-5"></i>
                    </div>
                    <span class="font-semibold text-sm">Training Log</span>
                    <div class="active-indicator"></div>
                </router-link>

                <router-link to="/performance-settings" class="sidebar-item group" active-class="is-active">
                <div class="sidebar-icon-box">
                <i data-lucide="settings" class="w-5 h-5"></i>
                </div>
                <span class="font-semibold text-sm">Settings</span>
                <div class="active-indicator"></div>
                </router-link>
            </nav>

            <div class="mt-auto p-4 px-6 border-t border-slate-50">
                <div class="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div class="flex items-center justify-between mb-2">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                        <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    </div>
                    <p class="text-xs font-bold text-slate-900 leading-none">Sync: 100% Active</p>
                    <p class="text-[10px] text-slate-400 mt-1">Last update: Just now</p>
                </div>
            </div>
        </div>
    </aside>
  `,
  mounted() {
    // Inisialisasi ulang ikon saat sidebar dimuat
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
};
