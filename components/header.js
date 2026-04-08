

import headerView from './headerView.js';

export default {
    ...headerView,
    emits: ['toggle-sidebar'], // Deklarasikan event
    mounted() {
        if (window.lucide) window.lucide.createIcons();
    }
};
