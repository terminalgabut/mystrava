import sleepTemplate from './sleepView.js';
import { CoachLogic } from '../logic/coachLogic.js';
import { Logger } from '../js/services/debug.js';

export default {
    name: 'SleepView',
    template: sleepTemplate,
    setup() {
        const { ref, onMounted, nextTick, watch } = Vue;

        // 1. State Utama
        const sleepMode = ref('night'); // 'night' atau 'nap'
        const isLoading = ref(false);
        
        // 2. Form Data (Konsisten dengan template)
        const form = ref({
            start: '22:30',
            end: '06:30',
            latency: 15,
            nap: 0,
            consistency: 85,
            isComplete: true,
            quality: 7
        });

        const refreshIcons = () => {
            nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
        };

        // 3. Load Data Awal
        const loadExistingData = async () => {
            try {
                const todayData = await CoachLogic.getTodayRecovery();
                if (todayData) {
                    form.value = {
                        ...form.value, // Keep defaults for missing fields
                        start: todayData.sleep_start?.split('T')[1]?.substring(0,5) || '22:30',
                        end: todayData.sleep_end?.split('T')[1]?.substring(0,5) || '06:30',
                        latency: todayData.sleep_latency_mins || 15,
                        nap: todayData.nap_duration_mins || 0,
                        consistency: Math.round((todayData.sleep_consistency_score || 0.85) * 100),
                        isComplete: todayData.is_overnight_complete ?? true,
                        quality: todayData.sleep_quality || 7
                    };
                }
            } catch (err) {
                Logger.error("SleepView_Load_Error", err);
            } finally {
                refreshIcons();
            }
        };

        // 4. Save Logic dengan Proteksi Double Input
        const saveSleepData = async () => {
            isLoading.value = true;
            try {
                let payload = {};

                if (sleepMode.value === 'night') {
                    // MODE MALAM: Simpan jam tidur utama
                    payload = {
                        start: form.value.start,
                        end: form.value.end,
                        latency: parseInt(form.value.latency),
                        quality: parseInt(form.value.quality),
                        isComplete: form.value.isComplete,
                        // Set undefined agar Nap yang sudah ada di DB tidak terhapus
                        nap: undefined 
                    };
                } else {
                    // MODE NAP: Kalkulasi durasi menit dari input jam
                    const startTime = new Date(`2026-01-01T${form.value.start}:00`);
                    let endTime = new Date(`2026-01-01T${form.value.end}:00`);
                    
                    if (endTime < startTime) endTime.setDate(endTime.getDate() + 1);
                    const diffMins = Math.round((endTime - startTime) / (1000 * 60));

                    payload = {
                        start: "", // Kosongkan agar jam malam di DB AMAN (tidak tertimpa)
                        end: "",
                        nap: diffMins,
                        // Field lain biarkan undefined agar tetap pakai data lama
                        latency: undefined,
                        quality: undefined,
                        isComplete: undefined
                    };
                }
                
                const success = await CoachLogic.saveDailyRecovery(payload);
                if (success) {
                    // Jika berhasil, kembali ke dashboard
                    window.location.hash = '#/coach'; 
                }
            } catch (err) {
                Logger.error("SleepView_Save_Error", err);
            } finally {
                isLoading.value = false;
            }
        };

        // Otomatis refresh icon saat toggle mode
        watch(sleepMode, () => refreshIcons());

        onMounted(loadExistingData);

        return {
            sleepMode,
            isLoading,
            sleepForm: form, 
            goBack: () => window.location.hash = '#/coach',
            saveSleepData,
            refreshIcons
        };
    }
};
