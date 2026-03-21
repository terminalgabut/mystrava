import sidebarView from './sidebarView.js';

export default {
    ...sidebarView,
    setup() {
        // Logika state sidebar (misal: isCollapsed) bisa di sini
        return {};
    },
    mounted() {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
};
