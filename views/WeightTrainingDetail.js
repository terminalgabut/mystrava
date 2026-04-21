// root/views/WeightTrainingDetail.js

import { Logger } from '../js/services/debug.js';
import { supabase } from '../js/services/supabase.js';
import template from './WeightTrainingDetailView.js';

export default {
    props: ['id'],
    template,
    setup(props) {
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

            // Validasi format file sederhana
            if (!file.name.endsWith('.csv')) {
                alert('⚠️ Mohon unggah file format .csv');
                return;
            }

            uploading.value = true;
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const text = e.target.result;
                    // Split baris dengan handle kemungkinan \r\n (Windows)
                    const lines = text.trim().split(/\r?\n/).slice(1);

                    if (lines.length === 0) {
                        throw new Error('File CSV kosong atau tidak memiliki data.');
                    }

                    const payload = lines.map(line => {
                        const v = line.split(',').map(item => item.replace(/"/g, '').trim());
                        
                        // Menyesuaikan dengan struktur Lyfta CSV:
                        // Index 3: Exercise, Index 5: Weight, Index 6: Reps, Index 9: Set Type
                        return {
                            activity_id: props.id,
                            exercise_name: v[3] || 'Unknown Exercise',
                            // Handle kolom kosong/null agar tidak NaN di DB
                            weight: parseFloat(v[5]) || 0, 
                            reps: parseInt(v[6]) || 0,
                            set_type: v[9] || 'NORMAL_SET'
                        };
                    });

                    Logger.info('WeightDetail: Attempting to insert payload', payload);

                    const { error } = await supabase.from('workout_details').insert(payload);
                    if (error) throw error;

                    // Berhasil
                    await fetchWorkoutDetails();
                    alert(`✅ Sukses! ${payload.length} set latihan berhasil diimpor.`);
                    Logger.info('WeightDetail: Upload success');

                } catch (err) {
                    Logger.error('WeightDetail: Upload failed', err);
                    alert(`❌ Gagal Mengimpor: ${err.message || 'Terjadi kesalahan pada struktur file'}`);
                } finally {
                    uploading.value = false;
                    // Reset input agar bisa re-upload file yang sama jika diperlukan
                    event.target.value = '';
                }
            };

            reader.onerror = () => {
                alert('❌ Gagal membaca file.');
                uploading.value = false;
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
