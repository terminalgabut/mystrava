// root/views/WeightTrainingDetail.js

import { Logger } from '../js/services/debug.js';
import { supabase } from '../js/services/supabase.js';
import template from './WeightTrainingDetailView.js';

export default {
    props: ['id'],
    template,
    setup(props) {
        // Ambil fungsi dari global Vue
        const { ref, onMounted, computed } = Vue;

        const activity = ref(null);
        const workoutDetails = ref([]);
        const loading = ref(true);
        const uploading = ref(false);

        const fetchActivityBase = async () => {
            try {
                const { data, error } = await supabase
                    .from('activities')
                    .select('*')
                    .eq('id', props.id)
                    .single();

                if (error) throw error;
                activity.value = data;
            } catch (err) {
                Logger.error('WeightDetail: Error base activity', err);
            }
        };

        const fetchWorkoutDetails = async () => {
            try {
                const { data, error } = await supabase
                    .from('workout_details')
                    .select('*')
                    .eq('activity_id', props.id)
                    .order('created_at', { ascending: true });

                if (error) throw error;
                workoutDetails.value = data || [];
            } catch (err) {
                Logger.error('WeightDetail: Error details', err);
            }
        };

        const handleLyftaUpload = async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            uploading.value = true;
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const text = e.target.result;
                    const lines = text.trim().split('\n').slice(1);

                    const payload = lines.map(line => {
                        const v = line.split(',').map(item => item.replace(/"/g, '').trim());
                        return {
                            activity_id: props.id,
                            exercise_name: v[3],
                            weight: parseFloat(v[5]) || 0,
                            reps: parseInt(v[6]) || 0,
                            set_type: v[9] || 'NORMAL_SET'
                        };
                    });

                    const { error } = await supabase.from('workout_details').insert(payload);
                    if (error) throw error;

                    await fetchWorkoutDetails();
                } catch (err) {
                    Logger.error('WeightDetail: Upload failed', err);
                } finally {
                    uploading.value = false;
                }
            };
            reader.readAsText(file);
        };

        const totalVolume = computed(() => {
            return workoutDetails.value.reduce((acc, item) => acc + (item.weight * item.reps), 0);
        });

        const totalReps = computed(() => {
            return workoutDetails.value.reduce((acc, item) => acc + (item.reps || 0), 0);
        });

        const formatDate = (date) => {
            if (!date) return '';
            return new Date(date).toLocaleDateString('id-ID', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
        };

        const formatTime = (seconds) => {
            if (!seconds) return '00:00:00';
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = seconds % 60;
            return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
        };

        onMounted(async () => {
            loading.value = true;
            await Promise.all([fetchActivityBase(), fetchWorkoutDetails()]);
            loading.value = false;
            
            setTimeout(() => {
                if (window.lucide) lucide.createIcons();
            }, 100);
        });

        return {
            activity,
            workoutDetails,
            loading,
            uploading,
            totalVolume,
            totalReps,
            handleLyftaUpload,
            formatDate,
            formatTime
        };
    }
};
