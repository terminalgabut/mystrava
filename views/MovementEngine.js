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
            charts: {
                matrix: null,
                trend: null
            },
            moveForm: {
                cadence: 0,
                stride: 0,
                step_density: 0,
                propulsion_score: 0,
                activity_id: null,
                activity_name: '',
                activity_type: ''
            },
            historyData: [] // Untuk menyimpan data 10 sesi terakhir
        };
    },
    computed: {
        impactLabel() {
            if (this.moveForm.activity_type === 'Walk') return 'Steady Movement';
            if (this.moveForm.cadence >= 165) return 'Low Impact (Safe)';
            if (this.moveForm.cadence >= 155) return 'Medium Impact';
            return 'High Impact (Stress)';
        },
        impactColor() {
            if (this.moveForm.activity_type === 'Walk') return 'bg-blue-500';
            if (this.moveForm.cadence >= 165) return 'bg-green-500';
            if (this.moveForm.cadence >= 155) return 'bg-amber-500';
            return 'bg-red-500';
        },
        coachAdvice() {
            if (this.moveForm.activity_type === 'Walk') {
                return "Fokus pada postur tegak. Jalan kaki adalah pemulihan aktif yang baik untuk biomekanika Anda.";
            }
            if (this.moveForm.cadence < 160 && this.moveForm.cadence > 0) {
                return "Cadence Anda rendah. Ini meningkatkan beban pada lutut. Coba perpendek langkah dan tingkatkan frekuensi (170+ SPM).";
            }
            if (this.moveForm.propulsion_score > 70) {
                return "Luar biasa! Efisiensi dorongan Anda sangat tinggi. Pertahankan stabilitas core untuk menjaga ritme ini.";
            }
            return "Data sedang dianalisis. Tetap jaga hidrasi dan perhatikan sinyal dari sendi pergelangan kaki.";
        }
    },
    methods: {
        async fetchLatestMovementData() {
            this.isLoading = true;
            try {
                // Ambil 10 data terakhir untuk grafik trend
                const { data, error } = await supabase
                    .from('activities')
                    .select('id, name, type, cadence, stride_length, step_density, propulsion_score, start_date')
                    .not('cadence', 'is', null)
                    .order('start_date', { ascending: false })
                    .limit(10);

                if (error) throw error;

                if (data && data.length > 0) {
                    this.historyData = [...data].reverse(); // Urutkan dari lama ke baru untuk chart
                    const latest = data[0];
                    
                    this.moveForm = {
                        cadence: Number(latest.cadence || 0),
                        stride: Number(latest.stride_length || 0),
                        step_density: Number(latest.step_density || 0),
                        propulsion_score: Number(latest.propulsion_score || 0),
                        activity_id: latest.id,
                        activity_name: latest.name,
                        activity_type: latest.type
                    };

                    this.$nextTick(() => {
                        this.initMatrixChart();
                        this.initTrendChart();
                    });
                }
            } catch (err) {
                console.error("Movement Engine Fetch Error:", err.message);
            } finally {
                this.isLoading = false;
                this.reinitIcons();
            }
        },

        initMatrixChart() {
            const ctx = document.getElementById('efficiencyMatrixChart');
            if (!ctx) return;
            if (this.charts.matrix) this.charts.matrix.destroy();

            this.charts.matrix = new Chart(ctx, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'Your Activities',
                        data: this.historyData.map(d => ({ x: d.cadence, y: d.stride_length })),
                        backgroundColor: '#10b981',
                        pointRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { title: { display: true, text: 'Cadence (SPM)', font: { weight: 'bold' } } },
                        y: { title: { display: true, text: 'Stride (CM)', font: { weight: 'bold' } } }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        },

        initTrendChart() {
            const ctx = document.getElementById('propulsionTrendChart');
            if (!ctx) return;
            if (this.charts.trend) this.charts.trend.destroy();

            this.charts.trend = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: this.historyData.map(d => d.name.substring(0, 10)),
                    datasets: [{
                        label: 'Propulsion Score %',
                        data: this.historyData.map(d => d.propulsion_score),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, max: 100 }
                    }
                }
            });
        },

        async saveMovementData() {
            this.isLoading = true;
            try {
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
        moveMode() {
            this.reinitIcons();
        }
    }
};
