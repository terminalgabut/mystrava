export default {
  name: 'LayoutView',
  template: `
    <div class="app-layout">
        <sidebar-component></sidebar-component>

        <div class="app-viewport">
            
            <header-component></header-component>
            
            <main class="app-content">
                <router-view v-slot="{ Component }">
                    <transition name="fade" mode="out-in">
                        <component :is="Component" />
                    </transition>
                </router-view>
            </main>

            <footer class="px-8 py-6 text-center md:text-left border-t border-slate-100/50">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    &copy; 2026 Dashstrav Pro &bull; Professional Analytics Dashboard
                </p>
            </footer>
        </div>
    </div>
  `
};
