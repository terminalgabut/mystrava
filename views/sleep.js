// views/sleep.js

import sleepTemplate from './sleepView.js';
import { CoachLogic } from '../logic/coachLogic.js';
import { Logger } from '../js/services/debug.js';

export default {
    name: 'SleepView',
    template: sleepTemplate,
    setup() {
        const { ref, onMounted, nextTick, watch } = Vue;

        const sleepMode = ref('night'); // 'night' atau 'nap'
        const isLoading = ref(false);
        
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

        const loadExistingData = async () => {
            try {
                const todayData = await CoachLogic.getTodayRecovery();
                if (todayData) {
                    // Mapping balik dari nama kolom DB asli ke form UI
                    form.value = {
                        ...form.value,
                        start: todayData.sleep_start?.split('T')[1]?.substring(0,5) || '22:30',
                        end: todayData.sleep_end?.split('T')[1]?.substring(0,5) || '06:30',
                        latency: todayData.sleep_latency_mins || 15,
                        nap: todayData.nap_duration_mins || 0,
                        quality: todayData.sleep_quality || 7,
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
            isLoading.value = true;
            try {
                let payload = {};

                if (sleepMode.value === 'night') {
                    /**
                     * MODE NIGHT
                     * Menggunakan KEY LAMA agar diterima oleh CoachLogic.saveDailyRecovery
                     * CoachLogic akan mengubah:
                     * start -> sleep_start
                     * end -> sleep_end
                     * quality -> sleep_quality
                     */
                    payload = {
                        start: form.value.start,
                        end: form.value.end,
                        quality: parseInt(form.value.quality),
                        isComplete: true,
                        // Catatan: latency tidak di-map oleh CoachLogic saat ini, 
                        // tapi kita kirim saja untuk persiapan masa depan
                        latency: parseInt(form.value.latency)
                    };
                } else {
                    /**
                     * MODE NAP
                     * Menghitung durasi menit untuk dikirim sebagai 'nap'
                     */
                    const startTime = new Date(`2026-01-01T${form.value.start}:00`);
                    let endTime = new Date(`2026-01-01T${form.value.end}:00`);
                    
                    if (endTime < startTime) endTime.setDate(endTime.getDate() + 1);
                    const diffMins = Math.round((endTime - startTime) / (1000 * 60));

                    payload = {
                        start: undefined, // undefined agar CoachLogic tidak memproses start/end
                        end: undefined,
                        nap: diffMins,
                        isComplete: false
                    };
                }
                
                /**
                 * EKSEKUSI
                 * Karena CoachLogic sudah pakai 'upsert' dengan 'onConflict: check_in_date',
                 * maka data RHR atau Soreness yang sudah ada di DB TIDAK AKAN tertimpa
                 * selama kita tidak mengirim key 'rhr' atau 'soreness' dalam payload ini.
                 */
                const success = await CoachLogic.saveDailyRecovery(payload);
                
                if (success) {
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
