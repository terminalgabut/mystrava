// views/components/WeeklyPerformanceChart.js
export default {
    name: 'WeeklyPerformanceChart',
    props: {
        labels: { type: Array, required: true },
        workloadDataset: { type: Array, required: true },
        vo2maxDataset: { type: Array, required: true }
    },
    template: `
        <div class="w-full">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h3 class="text-sm font-black text-slate-800">Load vs Fitness Correlation</h3>
                    <p class="text-[10px] text-slate-400 mt-0.5">Analisis hubungan beban akumulatif mingguan dengan kapasitas VO2 Max</p>
                </div>
            </div>
            <div class="relative w-full h-[180px]">
                <canvas id="weeklyPerformanceCanvas"></canvas>
            </div>
        </div>
    `,
    setup(props) {
        const { watch, onUnmounted, onMounted } = Vue;
        let chartInstance = null;

        const renderChart = () => {
            const ctx = document.getElementById('weeklyPerformanceCanvas');
            if (!ctx) return;

            if (chartInstance) {
                chartInstance.destroy();
            }

            if (!props.labels || props.labels.length === 0) return;

            chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: props.labels,
                    datasets: [
                        {
                            label: 'Weekly Load',
                            type: 'bar',
                            data: props.workloadDataset,
                            backgroundColor: 'rgba(59, 130, 246, 0.75)',
                            hoverBackgroundColor: '#3b82f6',
                            borderRadius: 3,
                            yAxisID: 'yLoad',
                            barPercentage: 0.5
                        },
                        {
                            label: 'Avg VO2 Max',
                            type: 'line',
                            data: props.vo2maxDataset,
                            borderColor: '#ef4444',
                            borderWidth: 2,
                            pointRadius: 2,
                            backgroundColor: 'transparent',
                            tension: 0.2,
                            yAxisID: 'yVo2'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: { mode: 'index', intersect: false, padding: 8 }
                    },
                    scales: {
                        x: { grid: { display: false }, ticks: { font: { size: 9 }, color: '#94a3b8' } },
                        yLoad: {
                            type: 'linear',
                            position: 'left',
                            grid: { borderDash: [4, 4], color: '#f1f5f9' },
                            ticks: { font: { size: 9 }, color: '#3b82f6' },
                            title: { display: true, text: 'Load Score', font: { size: 8, weight: 'bold' }, color: '#3b82f6' }
                        },
                        yVo2: {
                            type: 'linear',
                            position: 'right',
                            grid: { display: false },
                            ticks: { font: { size: 9 }, color: '#ef4444' },
                            title: { display: true, text: 'mL/kg/min', font: { size: 8, weight: 'bold' }, color: '#ef4444' }
                        }
                    }
                }
            });
        };

        watch(() => [props.labels, props.workloadDataset, props.vo2maxDataset], renderChart, { deep: true });
        
        onMounted(renderChart);
        onUnmounted(() => { if (chartInstance) chartInstance.destroy(); });

        return {};
    }
};
