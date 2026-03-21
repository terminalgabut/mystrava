export default {
  name: 'HeaderView',
  template: `
    <header class="app-header px-4 md:px-6">
        <div class="flex items-center gap-3 w-full">
            <button @click="$emit('toggle-sidebar')" class="nav-icon active:scale-95 transition-transform" title="Menu">
                <i data-lucide="menu" class="w-6 h-6 text-slate-600"></i>
            </button>

            <router-link to="/" class="header-logo ml-2">
                Dashboard Training
            </router-link>
            
            <div class="header-nav ml-auto flex gap-2">
                <router-link to="/statistics" class="nav-icon" title="Statistik">
                    <i data-lucide="bar-chart-3" class="w-5 h-5"></i>
                </router-link>
            </div>
        </div>
    </header>
  `
};
