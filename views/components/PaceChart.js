// js/components/PaceChart.js
export default {
    name: 'PaceChart',
    props: {
        chartId: { type: String, required: true },
        title: { type: String, default: '' },
        labels: { type: Array, required: true },
        datasets: { type: Array, required: true }, // [{ label, data, color }]
        unit: { type: String, default: '' }
    },
    template: `
        <div class="bento-card p-6 min-h-[320px] flex flex-col">
            <h3 class="text-card-title !text-xs mb-6 uppercase tracking-wider text-slate-400 font-bold">
                {{ title }}
            </h3>
            <div class="flex-grow relative">
                <canvas :id="chartId"></canvas>
            </div>
        </div>
    `,
    setup(props) {
        const { onMounted, watch, onBeforeUnmount } = Vue;
        let chartInstance = null;

        const initChart = () => {
            const canvas = document.getElementById(props.chartId);
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            if (chartInstance) chartInstance.destroy();

            chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: props.labels,
                    datasets: props.datasets.map(ds => ({
                        label: ds.label,
                        data: ds.data,
                        borderColor: ds.color || '#3b82f6',
                        backgroundColor: 'transparent',
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: ds.color || '#3b82f6',
                        pointBorderWidth: 2,
                        spanGaps: true // Menjaga garis tetap tersambung jika ada data kosong
                    }))
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: { 
                            // Sembunyikan legenda jika hanya 1 dataset agar lebih luas
                            display: props.datasets.length > 1,
                            position: 'bottom',
                            labels: { usePointStyle: true, boxWidth: 6, font: { size: 10, weight: '600' } }
                        },
                        tooltip: {
                            backgroundColor: '#1e293b',
                            padding: 12,
                            titleFont: { size: 10 },
                            bodyFont: { size: 13, weight: 'bold' },
                            cornerRadius: 8,
                            callbacks: {
                                label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y}${props.unit}`
                            }
                        }
                    },
                    scales: {
                        x: { 
                            grid: { display: false }, 
                            ticks: { font: { size: 10 }, color: '#94a3b8' } 
                        },
                        y: { 
                            beginAtZero: false, // Biar fluktuasi pace lebih terlihat
                            grid: { color: '#f1f5f9', drawBorder: false },
                            ticks: { 
                                font: { size: 10 }, 
                                color: '#94a3b8', 
                                callback: v => v + props.unit 
                            }
                        }
                    }
                }
            });
        };

        onMounted(initChart);
        
        // Watch labels & datasets agar grafik update saat filter ganti
        watch([() => props.datasets, () => props.labels], initChart, { deep: true });
        
        onBeforeUnmount(() => { 
            if (chartInstance) chartInstance.destroy(); 
        });

        return {};
    }
};
