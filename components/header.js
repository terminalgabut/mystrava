import headerView from './headerView.js';

export default {
    ...headerView,
    // Emits dihapus karena tidak ada sidebar
    mounted() {
        // Inisialisasi icon saat komponen muncul
        if (window.lucide) {
            window.lucide.createIcons();
        }
    },
    // Tambahkan watch route agar icon tidak hilang saat pindah halaman
    watch: {
        '$route'() {
            this.$nextTick(() => {
                if (window.lucide) window.lucide.createIcons();
            });
        }
    }
};
