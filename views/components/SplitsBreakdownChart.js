// views/components/SplitsBreakdownChart.js
export default {
    name: 'SplitsBreakdownChart',
    props: {
        splits: { type: Array, required: true }
    },
    template: `
        <div class="w-full h-[220px] relative">
            <canvas id="splitsBreakdownCanvas"></canvas>
        </div>
    `,
    setup(props) {
        const { watch, onUnmounted, onMounted } = Vue;
        let chartInstance = null;

        // Helper untuk konversi speed m/s ke format string pace (MM:SS)
        const msToPaceString = (speedMs) => {
            if (!speedMs || speedMs === 0) return '00:00';
            const paceMinPerKm = 16.6666666667 / speedMs;
            const minutes = Math.floor(paceMinPerKm);
            const seconds = Math.floor((paceMinPerKm - minutes) * 60);
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        };

        // Helper untuk konversi speed m/s ke nominal decimal menit (untuk visualisasi tinggi batang chart)
        const msToPaceDecimal = (speedMs) => {
            if (!speedMs || speedMs === 0) return 0;
            return 16.6666666667 / speedMs;
        };

        const renderChart = () => {
            const ctx = document.getElementById('splitsBreakdownCanvas');
            if (!ctx || !props.splits || props.splits.length === 0) return;

            if (chartInstance) {
                chartInstance.destroy();
            }

            const labels = props.splits.map(s => `KM ${s.split_number}`);
            const paceValues = props.splits.map(s => msToPaceDecimal(s.split_avg_speed));

            chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        data: paceValues,
                        backgroundColor: '#e2e8f0', // slate-200 default
                        hoverBackgroundColor: '#3b82f6', // blue-500 saat hover
                        borderRadius: 6,
                        borderSkipped: false,
                        barPercentage: 0.5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    const rawMs = props.splits[context.dataIndex].split_avg_speed;
                                    return ` Pace: ${msToPaceString(rawMs)} /km`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: { grid: { display: false }, ticks: { font: { size: 9 }, color: '#94a3b8' } },
                        y: {
                            grid: { borderDash: [4, 4], color: '#f1f5f9' },
                            reverse: true, // Pace lari terbalik: makin kecil angka menitnya, lari makin cepat (tinggi ke atas)
                            ticks: {
                                font: { size: 9 },
                                color: '#94a3b8',
                                callback: (value) => {
                                    const min = Math.floor(value);
                                    const sec = Math.floor((value - min) * 60);
                                    return sec === 0 ? `${min}:00` : `${min}:${sec.toString().padStart(2, '0')}`;
                                }
                            }
                        }
                    }
                }
            });
        };

        watch(() => props.splits, renderChart, { deep: true });
        
        onMounted(renderChart);
        onUnmounted(() => { if (chartInstance) chartInstance.destroy(); });

        return {};
    }
};
