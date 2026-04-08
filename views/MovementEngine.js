// views/MovementEngine.js
import { supabase } from '../js/services/supabase.js';
import MovementEngineTemplate from './MovementEngineView.js';

export default {
    name: 'MovementEngine',
    template: MovementEngineTemplate,
    data() {
        return {
            isLoading: false,
            charts: {
                matrix: null,
                trend: null
            },
            // Mapping data murni dari database
            moveForm: {
                cadence: 0,
                stride: 0,
                step_density: 0,
                propulsion_score: 0,
                activity_id: null,
                activity_name: '',
                distance: 0,
                start_date: null,
                activity_type: ''
            },
            historyData: [] // Menampung 10 sesi terakhir untuk Charting
        };
    },
    computed: {
    impactLabel() {
        if (this.moveForm.activity_type === 'Walk') return 'Low Power Steady';
        
        // Logika Khusus RUN
        if (this.moveForm.cadence >= 170) return 'Elite Cadence (Efficient)';
        if (this.moveForm.cadence >= 160) return 'Safe Zone';
        return 'High Impact (Heel Strike Risk)';
    },
    
    impactColor() {
        if (this.moveForm.activity_type === 'Walk') return 'bg-blue-500';
        
        // Warna Khusus RUN
        if (this.moveForm.cadence >= 170) return 'bg-green-500';
        if (this.moveForm.cadence >= 160) return 'bg-emerald-400';
        return 'bg-rose-500';
    },

    coachAdvice() {
        const { activity_type, cadence, propulsion_score } = this.moveForm;

        // JALUR ANALISA: WALK
        if (activity_type === 'Walk') {
            if (cadence < 80) return "Sesi jalan santai. Fokus pada pernapasan perut dan postur tulang belakang yang tegak.";
            return "Power walk terdeteksi. Bagus untuk menjaga mobilitas tanpa membebani sendi terlalu berat.";
        }

        // JALUR ANALISA: RUN
        if (activity_type === 'Run') {
            if (cadence > 0 && cadence < 165) {
                return "Coach Note: Cadence Anda rendah (Under 165). Ini menandakan 'Overstriding'. Coba perpendek langkah untuk melindungi lutut.";
            }
            if (propulsion_score > 75) {
                return "Efisiensi luar biasa! Dorongan kaki Anda sangat sinkron. Pertahankan form ini untuk lari jarak jauh.";
            }
            return "Analisis lari aktif. Fokus pada pendaratan di mid-foot untuk menjaga momentum.";
        }

        return "Menunggu data biomekanika untuk memberikan insight...";
    }
},
        
    methods: {

        formatDistance(meters) {
        if (!meters) return '0.00 KM';
        return (meters / 1000).toFixed(2) + ' KM';
    },

    // Fungsi untuk mempercantik tampilan tanggal
    formatDate(dateStr) {
        if (!dateStr) return '---';
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('id-ID', { 
            day: 'numeric', 
            month: 'short' 
        }).format(date);
    },
        
        async fetchLatestMovementData() {
            this.isLoading = true;
            try {
                // Mengambil 10 data terbaru yang sudah dikalkulasi di DB
                const { data, error } = await supabase
                    .from('activities')
                    .select('id, name, type, distance, cadence, stride_length, step_density, propulsion_score, start_date')
                    .in('type', ['Run', 'Walk']) 
                    .gt('steps', 0)
                    .not('cadence', 'is', null)
                    .order('start_date', { ascending: false })
                    .limit(10);

                if (error) throw error;

                if (data && data.length > 0) {
                    this.historyData = [...data].reverse(); // Urutan kronologis untuk Chart
                    const latest = data[0];
                    
                    this.moveForm = {
                        cadence: Math.round(latest.cadence || 0),
                        stride: Math.round(latest.stride_length || 0),
                        step_density: Math.round(latest.step_density || 0),
                        propulsion_score: Math.round(latest.propulsion_score || 0),
                        activity_id: latest.id,
                        activity_name: latest.name,
                        activity_type: latest.type,
                        distance: latest.distance, 
                        start_date: latest.start_date
                    };

                    // Render chart setelah DOM siap
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
            if (!ctx || !window.Chart) return;
            if (this.charts.matrix) this.charts.matrix.destroy();

            this.charts.matrix = new Chart(ctx, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'Biomechanics Position',
                        data: this.historyData.map(d => ({ x: d.cadence, y: d.stride_length })),
                        backgroundColor: '#10b981',
                        pointRadius: 8,
                        pointHoverRadius: 10
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { title: { display: true, text: 'Cadence (SPM)', font: { weight: 'bold', size: 10 } } },
                        y: { title: { display: true, text: 'Stride (CM)', font: { weight: 'bold', size: 10 } } }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        },

        initTrendChart() {
            const ctx = document.getElementById('propulsionTrendChart');
            if (!ctx || !window.Chart) return;
            if (this.charts.trend) this.charts.trend.destroy();

            this.charts.trend = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: this.historyData.map(d => d.name.substring(0, 10)),
                    datasets: [{
                        label: 'Propulsion Score',
                        data: this.historyData.map(d => d.propulsion_score),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, max: 100, ticks: { font: { size: 9 } } },
                        x: { ticks: { display: false } }
                    }
                }
            });
        },

        async saveMovementData() {
            // Re-calibrate: Memaksa DB Trigger untuk menghitung ulang
            this.isLoading = true;
            try {
                const { error } = await supabase
                    .from('activities')
                    .update({ updated_at: new Date() }) 
                    .eq('id', this.moveForm.activity_id);

                if (error) throw error;
                await this.fetchLatestMovementData();
            } catch (err) {
                console.error("Recalibration Error:", err.message);
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
    }
};
