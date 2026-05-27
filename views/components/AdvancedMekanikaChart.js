// views/components/AdvancedMekanikaChart.js
export default {
    name: 'AdvancedMekanikaChart',
    props: {
        chartId: { type: String, default: 'biomechanicsChart' },
        title: { type: String, default: 'Running Dynamics' },
        labels: { type: Array, required: true },
        cadenceDataset: { type: Array, required: true },
        strideDataset: { type: Array, required: true }
    },
    template: `
        <div class="bento-card p-6">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-card-title">{{ title }}</h3>
                <div class="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
                    <div class="flex items-center gap-1.5">
                        <span class="w-2 h-2 bg-emerald-500 rounded-full"></span>
                        <span class="text-slate-600">Cadence (SPM)</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span class="text-slate-600">Stride Length (cm)</span>
                    </div>
                </div>
            </div>
            <div class="relative w-full h-[280px]">
                <canvas :id="chartId"></canvas>
            </div>
        </div>
    `,
    setup(props) {
        const { watch, onUnmounted, onMounted } = Vue;
        let chartInstance = null;

        const renderChart = () => {
            const ctx = document.getElementById(props.chartId);
            if (!ctx) return;

            if (chartInstance) {
                chartInstance.destroy();
            }

            // Gunakan global Chart.js dari window instance
            chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: props.labels,
                    datasets: [
                        {
                            label: 'Cadence',
                            data: props.cadenceDataset,
                            borderColor: '#10b981', // emerald-500
                            backgroundColor: 'transparent',
                            borderWidth: 2.5,
                            tension: 0.3,
                            pointRadius: 2,
                            pointHoverRadius: 5,
                            yAxisID: 'yCadence'
                        },
                        {
                            label: 'Stride Length',
                            data: props.strideDataset,
                            borderColor: '#3b82f6', // blue-500
                            backgroundColor: 'transparent',
                            borderWidth: 2.5,
                            tension: 0.3,
                            pointRadius: 2,
                            pointHoverRadius: 5,
                            yAxisID: 'yStride'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { font: { size: 9 }, color: '#94a3b8' }
                        },
                        yCadence: {
                            type: 'linear',
                            position: 'left',
                            grid: { borderDash: [4, 4], color: '#f1f5f9' },
                            ticks: { font: { size: 9 }, color: '#10b981' },
                            title: { display: true, text: 'Steps Per Minute', font: { size: 9, weight: 'bold' } }
                        },
                        yStride: {
                            type: 'linear',
                            position: 'right',
                            grid: { display: false }, // Biar grid baris tidak tabrakan
                            ticks: { font: { size: 9 }, color: '#3b82f6' },
                            title: { display: true, text: 'Centimeters (cm)', font: { size: 9, weight: 'bold' } }
                        }
                    }
                }
            });
        };

        watch(() => [props.labels, props.cadenceDataset, props.strideDataset], renderChart, { deep: true });
        
        onMounted(renderChart);
        onUnmounted(() => { if (chartInstance) chartInstance.destroy(); });

        return {};
    }
};
