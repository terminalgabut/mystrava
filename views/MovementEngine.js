// logic/MovementEngine.js
import { supabase } from '../js/services/supabase.js';
import MovementEngineTemplate from './MovementEngineView.js';

export default {
    name: 'MovementEngine',
    template: MovementEngineTemplate,
    data() {
        return {
            moveMode: 'dynamic',
            isLoading: false,
            // Menampung data murni hasil hitungan DB
            moveForm: {
                cadence: 0,
                stride: 0,
                step_density: 0,
                propulsion_score: 0,
                activity_id: null,
                activity_name: ''
            }
        };
    },
    computed: {
        // Status dampak mekanis berdasarkan Cadence (SPM) dari DB
        impactLabel() {
            if (this.moveForm.cadence >= 165) return 'Low Impact (Safe)';
            if (this.moveForm.cadence >= 155) return 'Medium Impact';
            return 'High Impact (Stress)';
        },
        // Warna indikator sesuai standar efisiensi lari Anda
        impactColor() {
            if (this.moveForm.cadence >= 165) return 'bg-green-500';
            if (this.moveForm.cadence >= 155) return 'bg-amber-500';
            return 'bg-red-500';
        }
    },
    methods: {
        async fetchLatestMovementData() {
            this.isLoading = true;
            try {
                // Mengambil kolom-kolom yang tadi kita buat & update di DB
                const { data, error } = await supabase
                    .from('activities')
                    .select('id, name, cadence, stride_length, step_density, propulsion_score')
                    .not('cadence', 'is', null) // Pastikan data sudah terhitung
                    .order('start_date', { ascending: false })
                    .limit(1)
                    .single();

                if (error) throw error;

                if (data) {
                    this.moveForm = {
                        cadence: data.cadence,
                        stride: data.stride_length,
                        step_density: data.step_density,
                        propulsion_score: data.propulsion_score,
                        activity_id: data.id,
                        activity_name: data.name
                    };
                }
            } catch (err) {
                console.error("Movement Engine Fetch Error:", err.message);
            } finally {
                this.isLoading = false;
                this.reinitIcons();
            }
        },

        async saveMovementData() {
            // Jika Anda ingin melakukan "Force Recalculate" dari UI
            this.isLoading = true;
            try {
                // Trigger akan otomatis jalan di DB saat kita update record ini
                const { error } = await supabase
                    .from('activities')
                    .update({ updated_at: new Date() }) 
                    .eq('id', this.moveForm.activity_id);

                if (error) throw error;
                await this.fetchLatestMovementData();
            } catch (err) {
                console.error("Sync Error:", err.message);
            } finally {
                this.isLoading = false;
            }
        },

        reinitIcons() {
            this.$nextTick(() => {
                if (window.lucide) window.lucide.createIcons();
            });
        }
    },
    mounted() {
        this.fetchLatestMovementData();
    },
    watch: {
        // Render ulang icon Lucide saat pindah mode
        moveMode() {
            this.reinitIcons();
        }
    }
};
