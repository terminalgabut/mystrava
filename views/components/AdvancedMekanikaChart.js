// views/components/AdvancedMekanikaChart.js
export default {
    name: 'AdvancedMekanikaChart',
    props: {
        chartId: { type: String, default: 'biomechanicsChart' },
        title: { type: String, default: 'Running Dynamics Trends' },
        labels: { type: Array, required: true },
        cadenceDataset: { type: Array, required: true },
        strideDataset: { type: Array, required: true }
    },
    template: `
        <div class="w-full">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h3 class="text-base font-black text-slate-800">{{ title }}</h3>
                    <p class="text-[11px] text-slate-400 mt-0.5">Analisis stabilitas langkah kaki 10 sesi terakhir</p>
                </div>
                <div class="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider">
                    <div class="flex items-center gap-1.5">
                        <span class="w-2 h-2 bg-emerald-500 rounded-full"></span>
                        <span class="text-slate-500">Cadence (SPM)</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span class="text-slate-500">Stride (cm)</span>
                    </div>
                </div>
            </div>
            <div class="relative w-full h-[260px]">
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

            // Jika data kosong, jangan render konfigurasi kosong
            if (!props.labels || props.labels.length === 0) return;

            chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: props.labels,
                    datasets: [
                        {
                            label: 'Cadence (SPM)',
                            data: props.cadenceDataset,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.05)',
                            borderWidth: 2.5,
                            tension: 0.3,
                            pointRadius: 2,
                            pointHoverRadius: 5,
                            yAxisID: 'yCadence'
                        },
                        {
                            label: 'Stride Length (cm)',
                            data: props.strideDataset,
                            borderColor: '#3b82f6',
                            backgroundColor: 'transparent',
                            borderWidth: 2.5,
                            borderDash: [3, 3], // Pembeda visual yang elegan
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
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            padding: 10,
                            bodyFont: { size: 11 }
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { 
                                font: { size: 9 }, 
                                color: '#94a3b8',
                                maxTicksLimit: 6, // KUNCI UTAMA: Batasi jumlah label x agar tidak dempetan
                                maxRotation: 0
                            }
                        },
                        yCadence: {
                            type: 'linear',
                            position: 'left',
                            min: 140, // Rentang bawah lari standar
                            max: 190, // Rentang atas maksimum
                            grid: { borderDash: [4, 4], color: '#f1f5f9' },
                            ticks: { font: { size: 9 }, color: '#10b981', stepSize: 10 },
                            title: { display: true, text: 'SPM', font: { size: 9, weight: 'bold' }, color: '#10b981' }
                        },
                        yStride: {
                            type: 'linear',
                            position: 'right',
                            min: 50,
                            max: 130,
                            grid: { display: false }, // Agar grid line tidak bentrok tabrakan
                            ticks: { font: { size: 9 }, color: '#3b82f6', stepSize: 20 },
                            title: { display: true, text: 'cm', font: { size: 9, weight: 'bold' }, color: '#3b82f6' }
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
