import layoutView from './layoutView.js';
import Header from './header.js';
import Sidebar from './sidebarView.js';

export default {
    ...layoutView, // Menggabungkan template HTML dari layoutView.js
    components: {
        'header-component': Header,
        'sidebar-component': Sidebar
    },
    setup() {
        const { ref } = Vue;
        
        // State untuk kontrol Sidebar di Mobile (Android)
        const isSidebarOpen = ref(false);

        const toggleSidebar = () => {
            isSidebarOpen.value = !isSidebarOpen.value;
            document.body.style.overflow = isSidebarOpen.value ? 'hidden' : '';
        };

        return {
            isSidebarOpen,
            toggleSidebar
        };
    },
    watch: {
        // Setiap kali route berubah (pindah halaman)
        '$route'() {
            this.isSidebarOpen = false;
            document.body.style.overflow = '';
            
            // Log perpindahan halaman untuk debug
            if (this.$log) this.$log.info('Route Changed, refreshing icons...');

            Vue.nextTick(() => {
                if (window.lucide) window.lucide.createIcons();
            });
        }
    },
    mounted() {
        if (this.$log) this.$log.info('Master Layout Mounted');

        // Inisialisasi awal ikon
        if (window.lucide) {
            window.lucide.createIcons();
        } else {
            if (this.$log) this.$log.warn('Lucide library not detected!');
        }
    }
};
