export default {
    name: 'PaceChart',
    props: {
        labels: { type: Array, required: true },
        data: { type: Array, required: true },
        activityType: { type: String, default: 'Run' }
    },
    template: `
        <div class="relative w-full h-[300px]">
            <canvas ref="chartCanvas"></canvas>
        </div>
    `,
    setup(props) {
        const { ref, onMounted, watch, onBeforeUnmount } = Vue;
        const chartCanvas = ref(null);
        let chartInstance = null;

        const renderChart = () => {
            if (chartInstance) chartInstance.destroy(); // Hapus chart lama sebelum render baru

            const ctx = chartCanvas.value.getContext('2d');
            const isRide = props.activityType === 'Ride';

            chartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: props.labels,
                    datasets: [{
                        label: isRide ? 'Avg Speed' : 'Avg Pace',
                        data: props.data,
                        borderColor: '#f97316', // Orange-500
                        backgroundColor: 'rgba(249, 115, 22, 0.1)',
                        fill: true,
                        tension: 0.4, // Membuat garis melengkung (smooth)
                        borderWidth: 3,
                        pointRadius: 4,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#f97316'
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
                                    const unit = isRide ? ' km/h' : ' min/km';
                                    return context.parsed.y + unit;
                                }
                            }
                        }
                    },
                    scales: {
                        x: { grid: { display: false } },
                        y: {
                            beginAtZero: false,
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        }
                    }
                }
            });
        };

        onMounted(renderChart);

        // Re-render jika data atau filter berubah
        watch(() => [props.data, props.activityType], renderChart, { deep: true });

        onBeforeUnmount(() => {
            if (chartInstance) chartInstance.destroy();
        });

        return { chartCanvas };
    }
};
