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

        // Konversi m/s ke format string pace lari tradisional (MM:SS)
        const msToPaceString = (speedMs) => {
            if (!speedMs || speedMs === 0) return '00:00';
            const paceMinPerKm = 16.6666666667 / speedMs;
            const minutes = Math.floor(paceMinPerKm);
            const seconds = Math.floor((paceMinPerKm - minutes) * 60);
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        };

        // Konversi m/s ke angka desimal menit untuk menghitung proporsi tinggi grafik batang
        const msToPaceDecimal = (speedMs) => {
            if (!speedMs || speedMs === 0) return 0;
            return 16.6666666667 / speedMs;
        };

        const renderChart = () => {
            const ctx = document.getElementById('splitsBreakdownCanvas');
            if (!ctx) return;

            if (chartInstance) {
                chartInstance.destroy();
            }

            if (!props.splits || props.splits.length === 0) return;

            chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: props.splits.map(s => `KM ${s.split_number}`),
                    datasets: [{
                        label: 'Pace',
                        data: props.splits.map(s => msToPaceDecimal(s.split_avg_speed)),
                        backgroundColor: 'rgba(59, 130, 246, 0.85)',
                        hoverBackgroundColor: '#3b82f6',
                        borderRadius: 4,
                        borderWidth: 0,
                        barPercentage: 0.6
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
                        x: { 
                            grid: { display: false }, 
                            ticks: { font: { size: 9 }, color: '#94a3b8' } 
                        },
                        y: {
                            grid: { borderDash: [4, 4], color: '#f1f5f9' },
                            reverse: true, // KUNCI UTAMA: Makin cepat lari (angka menit makin kecil), posisi balok makin melesat ke atas
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
