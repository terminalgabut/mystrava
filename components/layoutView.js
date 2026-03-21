export default {
  name: 'LayoutView',
  template: `
    <div class="app-layout" :class="{ 'sidebar-open': isSidebarOpen }">
        <div v-if="isSidebarOpen" @click="toggleSidebar" class="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[80] md:hidden"></div>

        <sidebar-component :is-open="isSidebarOpen"></sidebar-component>

        <div class="app-viewport">
            <header-component @toggle-sidebar="toggleSidebar"></header-component>
            
            <main class="app-content">
                <router-view></router-view>
            </main>
        </div>
    </div>
  `
};
