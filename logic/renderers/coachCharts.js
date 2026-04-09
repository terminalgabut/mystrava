// js/logic/renderers/coachCharts.js

/**
 * COACH CHARTS RENDERER
 * Fokus: Konfigurasi visual Chart.js
 */
export const CoachCharts = {
    renderCorrelation(ctx, trendData) {
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: trendData.labels,
                datasets: [
                    { 
                        label: 'Load', 
                        data: trendData.workloadSeries, 
                        backgroundColor: 'rgba(59, 130, 246, 0.2)', 
                        borderColor: '#3b82f6', 
                        borderWidth: 1, 
                        yAxisID: 'yWorkload', 
                        borderRadius: 4 
                    },
                    { 
                        label: 'Readiness', 
                        data: trendData.readinessSeries, 
                        type: 'line', 
                        borderColor: '#0f172a', 
                        borderWidth: 3, 
                        tension: 0.4, 
                        yAxisID: 'yReadiness',
                        pointRadius: 2
                    }
                ]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                scales: { 
                    yWorkload: { display: false }, 
                    yReadiness: { min: 0, max: 100, display: false } 
                }, 
                plugins: { legend: { display: false } } 
            }
        });
    },

    renderRhr(ctx, trendData) {
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: trendData.labels,
                datasets: [{ 
                    data: trendData.rhrSeries, 
                    borderColor: '#60a5fa', 
                    tension: 0.4, 
                    fill: false, 
                    pointRadius: 4 
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { legend: { display: false } },
                scales: { 
                    y: { beginAtZero: false, grid: { display: false }, ticks: { display: false } },
                    x: { grid: { display: false } }
                }
            }
        });
    }
};
