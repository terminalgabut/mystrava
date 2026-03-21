import headerView from './headerView.js';

export default {
    ...headerView, // Mengambil template dari headerView.js
    setup() {
        // Taruh logika reaktif di sini jika dibutuhkan nanti
        // Contoh: const user = ref('Mochammad');
        
        return {
            // user
        };
    },
    mounted() {
        // Logika spesifik komponen jika ada
        if (window.lucide) window.lucide.createIcons();
    }
};
