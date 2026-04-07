import sleepTemplate from './sleepView.js';
import { CoachLogic } from '../logic/coachLogic.js';
import { Logger } from '../js/services/debug.js';

export default {
    name: 'SleepView',
    template: sleepTemplate,
    setup() {
        const { ref, onMounted, nextTick } = Vue;

        const form = ref({
            start: '22:30',
            end: '06:30',
            latency: 15,
            nap: 0,
            consistency: 85,
            isComplete: true
        });

        const refreshIcons = () => {
            nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
        };

        const loadExistingData = async () => {
            const todayData = await CoachLogic.getTodayRecovery();
            if (todayData) {
                form.value = {
                    start: todayData.sleep_start?.split('T')[1]?.substring(0,5) || '22:30',
                    end: todayData.sleep_end?.split('T')[1]?.substring(0,5) || '06:30',
                    latency: todayData.sleep_latency_mins || 15,
                    nap: todayData.nap_duration_mins || 0,
                    consistency: Math.round(todayData.sleep_consistency_score * 100) || 85,
                    isComplete: todayData.is_overnight_complete ?? true
                };
            }
            refreshIcons();
        };

        const saveSleepData = async () => {
            try {
                // Konversi kembali ke format yang diharapkan CoachLogic
                const payload = {
                    start: form.value.start,
                    end: form.value.end,
                    quality: form.value.isComplete ? 9 : 5, // Mapping sederhana kualitas dari isComplete
                    rhr: 60, // Placeholder jika tidak diinput di sini
                    latency: form.value.latency,
                    nap: form.value.nap,
                    consistency: form.value.consistency / 100,
                    isComplete: form.value.isComplete
                };
                
                // Gunakan CoachLogic untuk menyimpan ke tabel daily_recovery
                const success = await CoachLogic.saveDailyRecovery(payload);
                if (success) {
                    window.location.hash = '#/coach'; // Kembali ke coach dashboard
                }
            } catch (err) {
                Logger.error("SleepView_Save_Error", err);
            }
        };

        onMounted(() => {
            loadExistingData();
        });

        return {
            form,
            goBack: () => window.location.hash = '#/coach',
            saveSleepData
        };
    }
};
