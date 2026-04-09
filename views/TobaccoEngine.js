// views/TobaccoEngine.js
import { supabase } from '../js/services/supabase.js';
import { stravaService } from '../js/services/stravaService.js'; 
import TobaccoEngineTemplate from './TobaccoView.js';

export default {
    name: 'TobaccoEngine',
    template: TobaccoEngineTemplate,
    data() {
        return {
            isLoading: false,
            viewMode: 'log',
            timeFilter: 'weekly', // New: State untuk filter history
            products: [],
            historicalData: [], // New: Penampung data grafik
            chart: null, // New: Instance Chart.js
            stats: {
                todayTar: 0,
                todayNicotine: 0,
                todaySticks: 0,
                avgPace: '0:00', // Untuk correlation
                pacePenalty: 0,
                recoveryDays: 0
            },
            logForm: {
                product_id: null,
                sticks: 1,
                time: new Date().toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' })
            },
            masterForm: { brand_name: '', tar_mg: 0, nicotine_mg: 0, is_clove: true, is_filter: true }
        };
    },

    computed: {
        toxicStatus() {
            const tar = parseFloat(this.stats.todayTar);
            if (tar === 0) return { label: 'Clean System', color: 'bg-green-500', icon: 'shield-check' };
            if (tar < 100) return { label: 'Low Exposure', color: 'bg-yellow-500', icon: 'alert-circle' };
            if (tar < 300) return { label: 'High Toxic Load', color: 'bg-orange-500', icon: 'zap' };
            return { label: 'Extreme Obstruction', color: 'bg-red-600', icon: 'skull' };
        },
        coachAdvice() {
            const tar = parseFloat(this.stats.todayTar);
            if (tar === 0) return "Sistem pernapasan dalam kondisi optimal untuk lari intensitas tinggi.";
            if (tar > 200) return "Coach Note: Akumulasi Tar sangat tinggi. Kapasitas difusi oksigen terhambat.";
            return "Data tercatat. Pastikan hidrasi ekstra untuk metabolisme residu.";
        },
        coSaturation() {
            const sticks = this.stats.todaySticks;
            return sticks === 0 ? 0 : Math.min((sticks * 1.2), 15).toFixed(1);
        },
        oxygenEfficiency() {
            const tar = parseFloat(this.stats.todayTar);
            const penalty = (tar / 100) * 2.5;
            return tar === 0 ? 100 : Math.max(100 - penalty, 70).toFixed(1);
        },
        deepInsight() {
            const tar = parseFloat(this.stats.todayTar);
            if (tar === 0) return "Sistem bersih. Waktu terbaik untuk Threshold Run.";
            if (tar > 300) return `Peringatan: Tar akumulasi (${tar}mg) zona merah. Darah membawa racun lebih banyak.`;
            return "Beban toksik terdeteksi. Waspada ritme jantung.";
        },
        // NEW: Hitung total gram tar dalam satu periode
        totalPeriodTar() {
            const totalMg = this.historicalData.reduce((acc, curr) => acc + curr.total_tar, 0);
            return (totalMg / 1000).toFixed(2);
        }
    },

    methods: {
        // --- NEW: LOGIC HISTORICAL ---
        async changeTimeFilter(filter) {
            this.timeFilter = filter;
            await this.fetchHistoricalData();
            this.renderHistoricalChart();
        },

        async fetchHistoricalData() {
            try {
                let startDate = new Date();
                if (this.timeFilter === 'weekly') startDate.setDate(startDate.getDate() - 7);
                else if (this.timeFilter === 'monthly') startDate.setMonth(startDate.getMonth() - 1);
                else if (this.timeFilter === 'yearly') startDate.setFullYear(startDate.getFullYear() - 1);
                else startDate = new Date('2020-01-01');

                // Eksekusi Paralel: Ambil Data Rokok (Filtered) & Data Pace (All Time)
                const [tobaccoRes, stravaRes] = await Promise.all([
                    supabase.from('user_smoking_logs')
                        .select(`log_time, sticks_count, tobacco_products (tar_mg)`)
                        .gte('log_time', startDate.toISOString())
                        .order('log_time', { ascending: true }),
                    stravaService.getStats('Run', 'all_time', 'total') 
                ]);

                if (tobaccoRes.error) throw tobaccoRes.error;

                // 1. Masukkan Avg Pace All-Time ke State
                if (stravaRes && stravaRes.avgPace) {
                    this.stats.avgPace = stravaRes.avgPace;
                }

                // 2. Grouping per hari untuk chart
                const grouped = (tobaccoRes.data || []).reduce((acc, curr) => {
                    const date = curr.log_time.split('T')[0];
                    const tarLoad = (curr.tobacco_products?.tar_mg || 0) * curr.sticks_count;
                    acc[date] = (acc[date] || 0) + tarLoad;
                    return acc;
                }, {});

                this.historicalData = Object.keys(grouped).map(date => ({
                    date: date,
                    total_tar: grouped[date]
                }));

                // 3. Update Audit Stats (Penalty & Recovery)
                const totalTarMg = parseFloat(this.totalPeriodTar) * 1000;
                // Formula: Tiap 1 gram Tar = +2 detik penalty
                this.stats.pacePenalty = Math.round((totalTarMg / 1000) * 2); 
                this.stats.recoveryDays = Math.round(totalTarMg / 25);

            } catch (err) {
                console.error("Historical Fetch Error:", err);
            }
        },

        renderHistoricalChart() {
            const ctx = document.getElementById('tobaccoHistoricalChart');
            if (!ctx || !window.Chart) return;
            if (this.chart) this.chart.destroy();

            this.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: this.historicalData.map(d => {
                        const date = new Date(d.date);
                        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                    }),
                    datasets: [{
                        data: this.historicalData.map(d => d.total_tar),
                        borderColor: '#f97316',
                        backgroundColor: 'rgba(249, 115, 22, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true }, x: { grid: { display: false } } }
                }
            });
        },

        // --- EXISTING LOGIC ---
        async fetchProducts() {
            const { data } = await supabase.from('tobacco_products').select('*').order('brand_name');
            this.products = data || [];
            if (this.products.length > 0) this.logForm.product_id = this.products[0].id;
        },

        async fetchTodayStats() {
            const today = new Date().toISOString().split('T')[0];
            const { data } = await supabase.from('user_smoking_logs')
                .select(`sticks_count, tobacco_products (tar_mg, nicotine_mg)`)
                .gte('log_time', today);

            if (data) {
                const totals = data.reduce((acc, curr) => ({
                    tar: acc.tar + (curr.tobacco_products.tar_mg * curr.sticks_count),
                    nic: acc.nic + (curr.tobacco_products.nicotine_mg * curr.sticks_count),
                    sticks: acc.sticks + curr.sticks_count
                }), { tar: 0, nic: 0, sticks: 0 });
                this.stats.todayTar = totals.tar.toFixed(1);
                this.stats.todayNicotine = totals.nic.toFixed(2);
                this.stats.todaySticks = totals.sticks;
            }
        },

        async saveSmokeLog() {
            this.isLoading = true;
            const logTimestamp = new Date().toISOString().split('T')[0] + 'T' + this.logForm.time + ':00';
            await supabase.from('user_smoking_logs').insert([{
                product_id: this.logForm.product_id,
                sticks_count: this.logForm.sticks,
                log_time: logTimestamp
            }]);
            await this.fetchTodayStats();
            await this.fetchHistoricalData(); // Sync history chart
            this.renderHistoricalChart();
            this.isLoading = false;
            this.reinitIcons();
        },

        async saveMasterProduct() {
            await supabase.from('tobacco_products').insert([this.masterForm]);
            await this.fetchProducts();
            this.viewMode = 'log';
        },

        reinitIcons() {
            this.$nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
        }
    },

    async mounted() {
        await this.fetchProducts();
        await this.fetchTodayStats();
        await this.fetchHistoricalData();
        this.renderHistoricalChart();
        this.reinitIcons();
    }
};
