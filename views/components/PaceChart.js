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
            <h3 class="text-card-title !text-xs mb-6 uppercase tracking-wider">{{ title }}</h3>
            <div class="flex-grow relative">
                <canvas :id="chartId"></canvas>
            </div>
        </div>
    `,
    setup(props) {
        const { onMounted, watch, onBeforeUnmount } = Vue;
        let chartInstance = null;

        const initChart = () => {
            const ctx = document.getElementById(props.chartId);
            if (!ctx) return;
            if (chartInstance) chartInstance.destroy();

            chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: props.labels,
                    datasets: props.datasets.map(ds => ({
                        label: ds.label,
                        data: ds.data,
                        borderColor: ds.color || '#f97316',
                        backgroundColor: 'transparent',
                        tension: 0.4,
                        borderWidth: 2.5,
                        pointRadius: 4,
                        pointBackgroundColor: '#fff',
                        pointBorderWidth: 2
                    }))
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { 
                            display: props.datasets.length > 1,
                            position: 'bottom',
                            labels: { usePointStyle: true, boxWidth: 5, font: { size: 10 } }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: '#1e293b',
                            titleFont: { size: 10 },
                            bodyFont: { size: 12 },
                            callbacks: {
                                label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y}${props.unit}`
                            }
                        }
                    },
                    scales: {
                        x: { grid: { display: false }, ticks: { font: { size: 9 }, color: '#94a3b8' } },
                        y: { 
                            grid: { color: '#f1f5f9' },
                            ticks: { font: { size: 9 }, color: '#94a3b8', callback: v => v + props.unit }
                        }
                    }
                }
            });
        };

        onMounted(initChart);
        watch(() => props.datasets, initChart, { deep: true });
        onBeforeUnmount(() => { if (chartInstance) chartInstance.destroy(); });

        return {};
    }
};
