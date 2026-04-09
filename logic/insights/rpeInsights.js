// js/logic/insights/rpeInsights.js

/**
 * RPE INSIGHTS
 * Fokus: Memberikan pesan feedback setelah evaluasi
 */
export const RpeInsights = {
    getFeedback(evaluation) {
        const feedbackMap = {
            'High Efficiency': {
                title: 'Engine Primed',
                message: 'Efisiensi Bos luar biasa. Power besar terasa ringan hari ini.',
                type: 'success'
            },
            'System Fatigue': {
                title: 'Heavy Nervous System',
                message: 'Beban ringan terasa berat. Saraf Bos mungkin butuh istirahat ekstra.',
                type: 'warning'
            },
            'Balanced': {
                title: 'Solid Session',
                message: 'Input Bos sinkron dengan data beban fisik.',
                type: 'neutral'
            }
        };
        return feedbackMap[evaluation] || feedbackMap['Balanced'];
    }
};
