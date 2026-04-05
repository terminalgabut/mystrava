// coach.js
import coachTemplate from './coachView.js';
import { supabase } from '../js/services/supabase.js';
import { Logger } from '../js/services/debug.js';

export default {
    name: 'CoachView',
    template: coachTemplate,
    setup() {
        const { ref, onMounted, nextTick, computed } = Vue;

        // --- STATE ---
        const isLoading = ref(true);
        const isModalOpen = ref(false);
        const rpeValue = ref(5);
        
        const coachBrief = ref({
            recommendation: 'Analyzing...',
            breathing_tip: 'Calculating your aerobic base...'
        });
        
        const readinessScore = ref(0);
        const readinessStatus = ref('Neutral');
        const pendingActivity = ref(null);

        // Data dummy untuk UI Log & Insights (Nanti bisa ditarik dari DB)
        const coachHistory = ref([
            { id: 1, type: 'Success', date: 'Yesterday', message: 'Target Pace tercapai dengan napas stabil.' },
            { id: 2, type: 'Warning', date: '2 days ago', message: 'Efisiensi menurun saat menanjak.' }
        ]);

        const efficiencyInsights = ref([
            { label: 'Aerobic Power', value: '75%', percentage: 75 },
            { label: 'Leg Resilience', value: '60%', percentage: 60 }
        ]);

        // --- HELPERS ---
        const refreshIcons = () => {
            nextTick(() => { if (window.lucide) window.lucide.createIcons(); });
        };

        const getStatusColor = (val) => {
            if (val < 40) return '#ef4444'; // Rose-500
            if (val < 75) return '#f59e0b'; // Amber-500
            return '#3b82f6'; // Blue-500
        };

        const getRpeLabel = (val) => {
            const labels = {
                1: 'Rest', 2: 'Easy', 3: 'Easy', 
                4: 'Moderate', 5: 'Moderate', 6: 'Steady',
                7: 'Hard', 8: 'Hard', 9: 'Extreme', 10: 'Max Effort'
            };
            return labels[val] || 'Moderate';
        };

        const getRpeDescription = (val) => {
            if (val <= 3) return 'Bisa ngobrol lancar';
            if (val <= 6) return 'Napas mulai teratur';
            if (val <= 8) return 'Napas tersengal';
            return 'Usaha maksimal!';
        };

        // --- CORE LOGIC ---
        const loadCoachData = async () => {
            isLoading.value = true;
            try {
                // 1. Ambil dari SQL View (Coach Brief)
                const { data: brief } = await supabase.from('coach_daily_brief').select('*').single();
                if (brief) coachBrief.value = brief;

                // 2. Ambil Aktivitas tanpa RPE (Pending)
                const { data: pending } = await supabase
                    .from('activities')
                    .select('id, name, type, start_date')
                    .is('user_rpe', null)
                    .order('start_date', { ascending: false })
                    .limit(1);
                
                if (pending && pending.length > 0) {
                    pendingActivity.value = pending[0];
                }

                // 3. Hitung Readiness (Sederhana: kJ 7 hari terakhir)
                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
                const { data: weeklyData } = await supabase
                    .from('activities')
                    .select('kilojoules')
                    .gt('start_date', sevenDaysAgo);

                const totalKj = weeklyData?.reduce((acc, curr) => acc + (curr.kilojoules || 0), 0) || 0;
                
                // Kalkulasi skor (Base 2500 kJ = 0% fresh)
                let score = 100 - Math.min(100, (totalKj / 2500) * 100);
                readinessScore.value = Math.round(score);
                
                if (score > 80) readinessStatus.value = 'PRIMED';
                else if (score > 50) readinessStatus.value = 'STABLE';
                else readinessStatus.value = 'FATIGUED';

            } catch (err) {
                Logger.error("Coach_Load_Error", err);
            } finally {
                isLoading.value = false;
                refreshIcons();
            }
        };

        const saveRpe = async () => {
            if (!pendingActivity.value) return;
            
            try {
                const { error } = await supabase
                    .from('activities')
                    .update({ user_rpe: parseInt(rpeValue.value) })
                    .eq('id', pendingActivity.value.id);

                if (error) throw error;
                
                isModalOpen.value = false;
                pendingActivity.value = null; // Clear pending after save
                await loadCoachData(); // Refresh insights
                
            } catch (err) {
                Logger.error("Save_RPE_Error", err);
            }
        };

        const openRpeModal = () => { isModalOpen.value = true; };

        // --- LIFECYCLE ---
        onMounted(loadCoachData);

        return {
            isLoading,
            coachBrief,
            readinessScore,
            readinessStatus,
            pendingActivity,
            coachHistory,
            efficiencyInsights,
            isModalOpen,
            rpeValue,
            getStatusColor,
            getRpeLabel,
            getRpeDescription,
            openRpeModal,
            saveRpe
        };
    }
};
