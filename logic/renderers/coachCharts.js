// js/logic/renderers/coachCharts.js

/** 
 * COACH CHARTS RENDERER - VINTAGE STYLE
 * Mengembalikan visualisasi chart lama dengan fitur Baseline dan Grid.
 */
export const CoachCharts = {
    renderCorrelation(ctx, trendData) {
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: trendData.labels,
                datasets: [
                    {
                        label: 'Daily Load',
                        data: trendData.workloadSeries,
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: '#3b82f6',
                        borderWidth: 1,
                        yAxisID: 'yWorkload',
                        borderRadius: 8
                    },
                    {
                        label: 'Readiness',
                        data: trendData.readinessSeries,
                        type: 'line',
                        borderColor: '#0f172a',
                        borderWidth: 3,
                        pointBackgroundColor: '#0f172a',
                        tension: 0.4,
                        yAxisID: 'yReadiness',
                        pointRadius: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    yWorkload: { 
                        type: 'linear', 
                        position: 'left', 
                        grid: { display: false },
                        ticks: { display: false } // Agar tetap bersih tapi logic axis tetap ada
                    },
                    yReadiness: { 
                        type: 'linear', 
                        position: 'right', 
                        min: 0, 
                        max: 100, 
                        grid: { borderDash: [5, 5], color: 'rgba(0,0,0,0.05)' } 
                    }
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
                    label: 'Morning RHR',
                    data: trendData.rhrSeries,
                    borderColor: '#60a5fa',
                    backgroundColor: 'rgba(96, 165, 250, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    annotation: {
                        annotations: {
                            line1: {
                                type: 'line',
                                yMin: trendData.baselineRhr || 62,
                                yMax: trendData.baselineRhr || 62,
                                borderColor: 'rgba(15, 23, 42, 0.3)', // Disesuaikan agar terlihat di bg terang/gelap
                                borderWidth: 2,
                                borderDash: [6, 6],
                                label: {
                                    display: true,
                                    content: `Baseline (${trendData.baselineRhr || 62} BPM)`,
                                    position: 'end',
                                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                                    color: '#fff',
                                    font: { size: 10, italic: true }
                                }
                            }
                        }
                    }
                },
                scales: {
                    y: { 
                        beginAtZero: false,
                        grid: { color: 'rgba(0, 0, 0, 0.05)' }, 
                        ticks: { color: '#64748b', font: { size: 10 } } 
                    },
                    x: { 
                        grid: { display: false },
                        ticks: { color: '#64748b', font: { size: 10 } } 
                    }
                }
            }
        });
    }
};
