// root/views/sleep.js
import sleepTemplate from './sleepView.js';
import { CoachLogic } from '../logic/coachLogic.js';
import { Logger } from '../js/services/debug.js';

export default {
    name: 'SleepView',
    template: sleepTemplate,
    setup() {
        const { ref, onMounted, nextTick } = Vue;

        // State awal sesuai standar AASM
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
            try {
                const todayData = await CoachLogic.getTodayRecovery();
                if (todayData) {
                    // Pre-fill data yang sudah ada (misal jam tidur yang sudah diisi di Modal)
                    form.value = {
                        start: todayData.sleep_start?.split('T')[1]?.substring(0,5) || '22:30',
                        end: todayData.sleep_end?.split('T')[1]?.substring(0,5) || '06:30',
                        latency: todayData.sleep_latency_mins || 15,
                        nap: todayData.nap_duration_mins || 0,
                        consistency: Math.round((todayData.sleep_consistency_score || 0.85) * 100),
                        isComplete: todayData.is_overnight_complete ?? true
                    };
                }
            } catch (err) {
                Logger.error("SleepView_Load_Error", err);
            } finally {
                refreshIcons();
            }
        };

        const saveSleepData = async () => {
            try {
                // REFACTOR: Jangan kirim RHR & Quality statis
                // Kirim undefined agar CoachLogic menggunakan data 'existing' di DB
                const payload = {
                    start: form.value.start,
                    end: form.value.end,
                    latency: form.value.latency,
                    nap: form.value.nap,
                    consistency: form.value.consistency / 100,
                    isComplete: form.value.isComplete,
                    
                    // Explicitly undefined agar tidak menimpa Bio-Signal Sync
                    rhr: undefined, 
                    quality: undefined,
                    soreness: undefined
                };
                
                const success = await CoachLogic.saveDailyRecovery(payload);
                if (success) {
                    window.location.hash = '#/coach'; 
                }
            } catch (err) {
                Logger.error("SleepView_Save_Error", err);
            }
        };

        onMounted(loadExistingData);

        return {
            sleepForm: form,
            goBack: () => window.location.hash = '#/coach',
            saveSleepData,
            refreshIcons // Berguna jika ada interaksi dinamis
        };
    }
};
