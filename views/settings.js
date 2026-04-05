// views/settings.js
import settingsTemplate from './settingsView.js';
import { supabase } from '../js/services/supabase.js';
import { Logger } from '../js/services/debug.js';

export default {
    name: 'SettingsView',
    template: settingsTemplate,
    setup() {
        const { ref, onMounted, computed, nextTick } = Vue;

        const profileId = '206838124'; 
        const isLoading = ref(true);
        const isSaving = ref(false);
        const statusMsg = ref('');
        const statusClass = ref('');

        // Gunakan nilai null sebagai inisial agar logika pengecekan lebih aman
        const profile = ref({
            weight: null,
            ftp_watts: null,
            running_threshold_pace_seconds: null,
            max_heartrate_setting: null
        });

        // --- HELPERS ---
        const refreshIcons = () => {
            nextTick(() => { 
                if (window.lucide) window.lucide.createIcons(); 
            });
        };

        const showStatus = (msg, type = 'success') => {
            statusMsg.value = msg;
            statusClass.value = type === 'success' ? 'text-emerald-500' : 'text-rose-500';
            setTimeout(() => { statusMsg.value = ''; }, 3000);
        };

        // --- CORE LOGIC ---
        const loadProfile = async () => {
            isLoading.value = true;
            try {
                const { data, error } = await supabase
                    .from('profile')
                    .select('weight, ftp_watts, running_threshold_pace_seconds, max_heartrate_setting')
                    .eq('id', profileId)
                    .single();

                if (error) throw error;
                
                if (data) {
                    // Mapping data agar reaktifitas Vue tetap terjaga
                    profile.value = {
                        weight: data.weight || 0,
                        ftp_watts: data.ftp_watts || 0,
                        running_threshold_pace_seconds: data.running_threshold_pace_seconds || 0,
                        max_heartrate_setting: data.max_heartrate_setting || 0
                    };
                }
                
            } catch (err) {
                Logger.error("Settings_Load_Error", err);
                showStatus('Gagal mengambil data profil.', 'error');
            } finally {
                // Beri sedikit delay agar transisi loading smooth
                setTimeout(() => { isLoading.value = false; }, 300);
                refreshIcons();
            }
        };

        const saveProfile = async () => {
            // PENGAMAN: Jangan simpan jika data sedang loading (menghindari simpan angka 0 default)
            if (isLoading.value || isSaving.value) return;
            
            // Validasi sederhana: Berat badan tidak boleh 0
            if (!profile.value.weight || profile.value.weight <= 0) {
                showStatus('Weight must be valid!', 'error');
                return;
            }

            isSaving.value = true;
            try {
                const { error } = await supabase
                    .from('profile')
                    .update({
                        weight: parseFloat(profile.value.weight),
                        ftp_watts: parseInt(profile.value.ftp_watts),
                        running_threshold_pace_seconds: parseInt(profile.value.running_threshold_pace_seconds),
                        max_heartrate_setting: parseInt(profile.value.max_heartrate_setting),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', profileId);

                if (error) throw error;
                showStatus('Changes saved successfully!');
                
            } catch (err) {
                Logger.error("Settings_Save_Error", err);
                showStatus('Failed to save changes.', 'error');
            } finally {
                isSaving.value = false;
            }
        };

        // --- COMPUTED ---
        const calculatePWR = computed(() => {
            const w = parseFloat(profile.value.weight);
            const p = parseFloat(profile.value.ftp_watts);
            if (!w || !p || w === 0) return '0.00';
            return (p / w).toFixed(2);
        });

        const formattedPace = computed(() => {
            const totalSec = parseInt(profile.value.running_threshold_pace_seconds);
            if (!totalSec) return '0:00';
            const m = Math.floor(totalSec / 60);
            const s = (totalSec % 60).toString().padStart(2, '0');
            return `${m}:${s}/km`;
        });

        onMounted(loadProfile);

        return {
            profile,
            isLoading,
            isSaving,
            statusMsg,
            statusClass,
            calculatePWR,
            formattedPace,
            saveProfile
        };
    }
};
