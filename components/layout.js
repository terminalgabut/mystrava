import layoutView from './layoutView.js';
import Header from './header.js';
import Sidebar from './sidebar.js';

export default {
    ...layoutView, // Mengambil struktur HTML dari layoutView.js
    components: {
        'header-component': Header,
        'sidebar-component': Sidebar
    },
    setup() {
        const { ref, onMounted } = Vue;
        
        // State untuk kontrol Sidebar di Mobile (Android)
        const isSidebarOpen = ref(false);

        const toggleSidebar = () => {
            isSidebarOpen.value = !isSidebarOpen.value;
            // Update class di body untuk mencegah scroll saat menu buka (optional)
            document.body.style.overflow = isSidebarOpen.value ? 'hidden' : '';
        };

        return {
            isSidebarOpen,
            toggleSidebar
        };
    },
    watch: {
        // Setiap kali route berubah, pastikan sidebar tertutup (untuk mobile)
        '$route'() {
            this.isSidebarOpen = false;
            document.body.style.overflow = '';
            
            // Refresh Lucide Icons secara global setiap pindah halaman
            Vue.nextTick(() => {
                if (window.lucide) window.lucide.createIcons();
            });
        }
    },
    mounted() {
        // Inisialisasi awal ikon saat pertama kali load
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
};
