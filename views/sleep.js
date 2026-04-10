// views/sleep.js
import sleepTemplate from './sleepView.js';
import { IntelligenceService } from '../js/services/IntelligenceService.js';
import { Logger } from '../js/services/debug.js';

export default {
    name: 'SleepView',
    template: sleepTemplate,
    setup() {
        const { ref, onMounted } = Vue;

        const sleepMode = ref('night'); // 'night' | 'nap'
        const sleepForm = ref({
            start: '22:30',
            end: '06:30',
            quality: 7,
            latency: 15
        });

        const loadCurrentSleep = async () => {
            const { data } = await IntelligenceService.getTodaySnapshot();
            if (data) {
                // Pre-fill data jika sudah ada di DB agar User tidak ketik ulang
                if (data.sleep_start) sleepForm.value.start = data.sleep_start.substring(0, 5);
                if (data.sleep_end) sleepForm.value.end = data.sleep_end.substring(0, 5);
                if (data.latency_mins) sleepForm.value.latency = data.latency_mins;
                sleepForm.value.quality = data.sleep_quality || 7;
            }
        };

        const saveSleepData = async () => {
            Logger.info(`Syncing ${sleepMode.value}...`, "SLEEP_VIEW");
            
            let payload = { quality: parseInt(sleepForm.value.quality) };

            if (sleepMode.value === 'night') {
                payload.sleepStart = sleepForm.value.start;
                payload.sleepEnd = sleepForm.value.end;
                payload.latency = parseInt(sleepForm.value.latency);
            } else {
                // Kalkulasi menit nap sederhana
                const [h1, m1] = sleepForm.value.start.split(':').map(Number);
                const [h2, m2] = sleepForm.value.end.split(':').map(Number);
                payload.napMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
            }

            const result = await IntelligenceService.syncDailySnapshot(payload);
            if (result.success) {
                Logger.info("Sleep Data Locked", "SUCCESS");
                // Optional: Redirect atau tampilkan notifikasi sukses
            }
        };

        onMounted(loadCurrentSleep);

        return {
            sleepMode,
            sleepForm,
            saveSleepData,
            setMode: (mode) => sleepMode.value = mode
        };
    }
};
