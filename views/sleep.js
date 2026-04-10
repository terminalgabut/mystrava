// views/sleep.js

import sleepTemplate from './sleepView.js';
import { IntelligenceService } from '../js/services/IntelligenceService.js';
import { Logger } from '../js/services/debug.js';

export default {
    name: 'SleepView',
    template: sleepTemplate,
    setup() {
        const { ref, onMounted } = Vue;

        const sleepMode = ref('night'); // 'night' | 'nap' [cite: 4, 6]
        
        // State disesuaikan dengan v-model template terbaru
        const sleepForm = ref({
            start: '22:30',
            end: '06:30',
            quality: 7, // Data fisik (Bio)
            cns: 7,     // Data neural (Slider CNS Quality) 
            latency: 15
        });

        const loadCurrentSleep = async () => {
            const { data } = await IntelligenceService.getTodaySnapshot();
            if (data) {
                // Mapping jam dari DB ke UI [cite: 37, 40]
                if (data.sleep_start) sleepForm.value.start = data.sleep_start.substring(0, 5);
                if (data.sleep_end) sleepForm.value.end = data.sleep_end.substring(0, 5);
                if (data.latency_mins) sleepForm.value.latency = data.latency_mins; [cite: 42]
                
                // Pisahkan penarikan data Bio dan CNS
                sleepForm.value.quality = data.sleep_quality || 7;
                sleepForm.value.cns = data.cns_readiness || 7;
            }
        };

        const saveSleepData = async () => {
            Logger.info(`Syncing ${sleepMode.value}...`, "SLEEP_VIEW");
            
            // Siapkan payload dengan key yang dikenali oleh IntelligenceService.syncEverything
            let payload = { 
                quality: parseInt(sleepForm.value.quality),
                cns_score: parseInt(sleepForm.value.cns) // Mengirim nilai slider CNS 
            };

            if (sleepMode.value === 'night') {
                payload.sleep_start = sleepForm.value.start;
                payload.sleep_end = sleepForm.value.end;
                payload.latency_mins = parseInt(sleepForm.value.latency);
            } else {
                // Kalkulasi menit nap untuk mode Power Nap [cite: 6]
                const [h1, m1] = sleepForm.value.start.split(':').map(Number);
                const [h2, m2] = sleepForm.value.end.split(':').map(Number);
                let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
                if (diff < 0) diff += 1440; // Koreksi jika nap melewati tengah malam
                payload.nap_duration_mins = diff;
            }

            // Gunakan syncEverything untuk memproses AASM & Leg Resilience
            const result = await IntelligenceService.syncEverything(payload);
            
            if (result.success) {
                Logger.info("Neural & Sleep Data Locked", "SUCCESS");
                // Redirect otomatis ke Coach Dashboard
                window.location.hash = '#/coach';
            }
        };

        onMounted(loadCurrentSleep);

        return {
            sleepMode,
            sleepForm,
            saveSleepData, // Kunci: Sesuai @click di template 
            setMode: (mode) => sleepMode.value = mode
        };
    }
};
