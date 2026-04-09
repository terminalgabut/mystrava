import sleepTemplate from './sleepView.js';
import { CoachLogic } from '../logic/coachLogic.js';
import { Logger } from '../js/services/debug.js';

export default {
    name: 'SleepView',
    template: sleepTemplate,
    setup() {
        const { ref, onMounted, nextTick, watch } = Vue;

        const sleepMode = ref('night'); 
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
                    form.value = {
                        ...form.value,
                        // Konversi UTC dari DB ke local jam menit untuk UI
                        start: todayData.sleep_start?.split('T')[1]?.substring(0,5) || '22:30',
                        end: todayData.sleep_end?.split('T')[1]?.substring(0,5) || '06:30',
                        latency: todayData.sleep_latency_mins || 15,
                        nap: todayData.nap_duration_mins || 0,
                        quality: todayData.sleep_quality || 7
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
                // Jalur Dinamis: Gunakan check_in_date lokal (WIB) sebagai anchor di DB
                const todayLocal = new Date().toLocaleDateString('en-CA'); // Format YYYY-MM-DD
                let payload = {
                    check_in_date: todayLocal
                };

                if (sleepMode.value === 'night') {
                    // MODE MALAM: Sinkronkan dengan kolom DB asli
                    payload = {
                        ...payload,
                        // Kirim string ISO UTC agar DB tidak bingung
                        sleep_start: `${todayLocal}T${form.value.start}:00Z`, 
                        sleep_end: `${todayLocal}T${form.value.end}:00Z`,
                        sleep_quality: parseInt(form.value.quality),
                        sleep_latency_mins: parseInt(form.value.latency),
                        is_overnight_complete: true,
                        nap_duration_mins: undefined // Pakai undefined agar data Nap lama di DB aman
                    };
                    
                    // Koreksi jika bangun di hari berikutnya
                    if (form.value.end < form.value.start) {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        payload.sleep_end = `${tomorrow.toLocaleDateString('en-CA')}T${form.value.end}:00Z`;
                    }
                } else {
                    // MODE NAP: Hitung durasi dan amankan jam malam
                    const startTime = new Date(`2026-01-01T${form.value.start}:00`);
                    let endTime = new Date(`2026-01-01T${form.value.end}:00`);
                    if (endTime < startTime) endTime.setDate(endTime.getDate() + 1);
                    const diffMins = Math.round((endTime - startTime) / (1000 * 60));

                    payload = {
                        ...payload,
                        nap_duration_mins: diffMins,
                        // Field Night diset undefined agar Jam Malam di DB tidak tertimpa NULL
                        sleep_start: undefined,
                        sleep_end: undefined,
                        sleep_quality: undefined,
                        is_overnight_complete: false
                    };
                }
                
                // Kirim ke CoachLogic yang sudah kita mapping ke kolom DB asli
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
