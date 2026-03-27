// views/settings.js
import settingsTemplate from './settingsView.js';
import { supabase } from '../js/services/supabase.js';
import { Logger } from '../js/services/debug.js';

export default {
    name: 'SettingsView',
    template: settingsTemplate,
    setup() {
        const { ref, onMounted, computed, nextTick } = Vue;

        // State Profil (ID disesuaikan dengan profil Anda)
        const profileId = '206838124'; 
        const isLoading = ref(true);
        const isSaving = ref(false);
        const statusMsg = ref('');
        const statusClass = ref('');

        const profile = ref({
            weight: 0,
            ftp_watts: 0,
            running_threshold_pace_seconds: 0,
            max_heartrate_setting: 0
        });

        // --- HELPERS ---
        const refreshIcons = () => {
            nextTick(() => { 
                if (window.lucide) window.lucide.createIcons(); 
            });
        };

        const showStatus = (msg, type = 'success') => {
            statusMsg.value = msg;
            statusClass.value = type === 'success' ? 'text-brand-primary' : 'text-red-500';
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
                if (data) profile.value = data;
                
            } catch (err) {
                Logger.error("Settings_Load_Error", err);
            } finally {
                isLoading.value = false;
                refreshIcons();
            }
        };

        const saveProfile = async () => {
            isSaving.value = true;
            try {
                const { error } = await supabase
                    .from('profile')
                    .update({
                        weight: profile.value.weight,
                        ftp_watts: profile.value.ftp_watts,
                        running_threshold_pace_seconds: profile.value.running_threshold_pace_seconds,
                        max_heartrate_setting: profile.value.max_heartrate_setting,
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
            if (!profile.value.weight || !profile.value.ftp_watts) return '0.00';
            return (profile.value.ftp_watts / profile.value.weight).toFixed(2);
        });

        const formattedPace = computed(() => {
            const totalSec = profile.value.running_threshold_pace_seconds;
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
