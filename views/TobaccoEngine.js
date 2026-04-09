// views/TobaccoEngine.js
import { supabase } from '../js/services/supabase.js';
import TobaccoEngineTemplate from './TobaccoView.js';

export default {
    name: 'TobaccoEngine',
    template: TobaccoEngineTemplate,
    data() {
        return {
            isLoading: false,
            viewMode: 'log', // 'log' atau 'master'
            products: [],
            stats: {
                todayTar: 0,
                todayNicotine: 0,
                todaySticks: 0
            },
            logForm: {
                product_id: null,
                sticks: 1,
                time: new Date().toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' })
            },
            masterForm: {
                brand_name: '',
                tar_mg: 0,
                nicotine_mg: 0,
                is_clove: true,
                is_filter: true
            }
        };
    },

    computed: {
        // Analisis tingkat bahaya berdasarkan akumulasi Tar harian
        toxicStatus() {
            const tar = parseFloat(this.stats.todayTar);
            if (tar === 0) return { label: 'Clean System', color: 'bg-green-500', icon: 'shield-check' };
            if (tar < 100) return { label: 'Low Exposure', color: 'bg-yellow-500', icon: 'alert-circle' };
            if (tar < 300) return { label: 'High Toxic Load', color: 'bg-orange-500', icon: 'zap' };
            return { label: 'Extreme Obstruction', color: 'bg-red-600', icon: 'skull' };
        },

        coachAdvice() {
            const tar = parseFloat(this.stats.todayTar);
            const sticks = this.stats.todaySticks;

            if (sticks === 0) return "Sistem pernapasan dalam kondisi optimal untuk lari intensitas tinggi. Manfaatkan hari ini!";
            
            if (tar > 200) {
                return "Coach Note: Akumulasi Tar sangat tinggi. Kapasitas difusi oksigen Anda terhambat. Hindari lari di Zona 4-5 hari ini untuk mencegah sesak dada.";
            }

            if (this.logForm.sticks >= 2) {
                return "Sesi beruntun terdeteksi. Nikotin menyebabkan penyempitan pembuluh darah. Detak jantung istirahat (RHR) Anda mungkin akan lebih tinggi dari biasanya.";
            }

            return "Data tercatat. Pastikan hidrasi ekstra untuk membantu ginjal memproses residu metabolisme.";
        }
    },

    methods: {
        async fetchProducts() {
            try {
                const { data, error } = await supabase
                    .from('tobacco_products')
                    .select('*')
                    .order('brand_name', { ascending: true });
                
                if (error) throw error;
                this.products = data;
                if (data.length > 0 && !this.logForm.product_id) {
                    this.logForm.product_id = data[0].id;
                }
            } catch (err) {
                console.error("Error fetching products:", err.message);
            }
        },

        async fetchTodayStats() {
            const today = new Date().toISOString().split('T')[0];
            try {
                const { data, error } = await supabase
                    .from('user_smoking_logs')
                    .select(`
                        sticks_count,
                        tobacco_products (tar_mg, nicotine_mg)
                    `)
                    .gte('log_time', today);

                if (error) throw error;

                const totals = data.reduce((acc, curr) => ({
                    tar: acc.tar + (parseFloat(curr.tobacco_products?.tar_mg || 0) * curr.sticks_count),
                    nic: acc.nic + (parseFloat(curr.tobacco_products?.nicotine_mg || 0) * curr.sticks_count),
                    sticks: acc.sticks + curr.sticks_count
                }), { tar: 0, nic: 0, sticks: 0 });

                this.stats.todayTar = totals.tar.toFixed(1);
                this.stats.todayNicotine = totals.nic.toFixed(2);
                this.stats.todaySticks = totals.sticks;
            } catch (err) {
                console.error("Error fetching stats:", err.message);
            }
        },

        async saveSmokeLog() {
            this.isLoading = true;
            try {
                // 1. Cari aktivitas lari terakhir (2 jam terakhir) untuk auto-link
                const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
                const { data: recentActivity } = await supabase
                    .from('activities')
                    .select('id')
                    .gte('start_date', twoHoursAgo)
                    .order('start_date', { ascending: false })
                    .limit(1)
                    .single();

                // 2. Insert Log
                const logTimestamp = new Date().toISOString().split('T')[0] + 'T' + this.logForm.time + ':00';
                const { error } = await supabase
                    .from('user_smoking_logs')
                    .insert([{
                        product_id: this.logForm.product_id,
                        sticks_count: this.logForm.sticks,
                        activity_id: recentActivity ? recentActivity.id : null,
                        log_time: logTimestamp
                    }]);

                if (error) throw error;
                
                await this.fetchTodayStats();
                this.logForm.sticks = 1; // Reset count
                alert('Toxic Load Updated!');
            } catch (err) {
                console.error("Save Log Error:", err.message);
            } finally {
                this.isLoading = false;
                this.reinitIcons();
            }
        },

        async saveMasterProduct() {
            this.isLoading = true;
            try {
                const { error } = await supabase
                    .from('tobacco_products')
                    .insert([this.masterForm]);

                if (error) throw error;
                
                await this.fetchProducts();
                this.viewMode = 'log';
                // Reset form master
                this.masterForm = { brand_name: '', tar_mg: 0, nicotine_mg: 0, is_clove: true, is_filter: true };
            } catch (err) {
                console.error("Save Master Error:", err.message);
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
        this.fetchProducts();
        this.fetchTodayStats();
        this.reinitIcons();
    }
};
