/**
 * PerformanceLogic.js
 * Pusat logika untuk klasifikasi zona intensitas lari (Pace) dan sepeda (Power).
 */

export const PerformanceLogic = {
    // 1. Logika Utama: Menentukan Zona Lari (6 Zona Strava)
    getRunZone(currentPaceSec, thresholdPaceSec) {
        if (!currentPaceSec || !thresholdPaceSec || currentPaceSec <= 0) return 1;
        
        // Ratio = Pace saat ini / Threshold Pace
        // Contoh: Threshold 300s (5:00/km), Lari 240s (4:00/km) -> Ratio 0.8 (Kencang)
        const ratio = currentPaceSec / thresholdPaceSec;

        if (ratio < 0.81) return 6;  // Neuromuscular
        if (ratio < 0.90) return 5;  // Anaerobic
        if (ratio < 0.96) return 4;  // Ambang Batas
        if (ratio < 1.01) return 3;  // Tempo
        if (ratio < 1.15) return 2;  // Endurance
        return 1;                    // Recovery
    },

    /**
     * Baru: Mendapatkan Rentang Pace untuk Tampilan (Mirip Strava)
     * @param {number} threshold - Threshold Pace dalam detik
     */
    getZoneRanges(threshold) {
        const format = (sec) => {
            if (!sec || sec <= 0) return '0:00';
            const m = Math.floor(sec / 60);
            const s = Math.floor(sec % 60);
            return `${m}:${s.toString().padStart(2, '0')}`;
        };

        // Perhitungan ratio dibalik untuk display (Threshold / Ratio)
        // Strava biasanya menggunakan persentase dari Pace Threshold
        return {
            1: { display: `> ${format(threshold * 1.15)}` },
            2: { display: `${format(threshold * 1.15)} - ${format(threshold * 1.01)}` },
            3: { display: `${format(threshold * 1.01)} - ${format(threshold * 0.96)}` },
            4: { display: `${format(threshold * 0.96)} - ${format(threshold * 0.90)}` },
            5: { display: `${format(threshold * 0.90)} - ${format(threshold * 0.81)}` },
            6: { display: `< ${format(threshold * 0.81)}` }
        };
    },

    // 2. Logika Utama: Menentukan Zona Sepeda (7 Zona Power)
    getPowerZone(currentWatts, ftp) {
        if (!currentWatts || !ftp || ftp <= 0) return 1;
        const pct = (currentWatts / ftp);

        if (pct >= 1.50) return 7;
        if (pct >= 1.21) return 6;
        if (pct >= 1.06) return 5;
        if (pct >= 0.91) return 4;
        if (pct >= 0.76) return 3;
        if (pct >= 0.56) return 2;
        return 1;
    },

    // 3. Konfigurasi Visual
    getZoneSettings(zone, type = 'Run') {
        const settings = {
            Run: {
                6: { label: 'Neuromuscular', color: '#0F172A', desc: 'Sprint' },
                5: { label: 'Anaerobic', color: '#EF4444', desc: 'Sangat Keras' },
                4: { label: 'Ambang Batas', color: '#0052FF', desc: 'Threshold' },
                3: { label: 'Tempo', color: '#EAB308', desc: 'Cukup Keras' },
                2: { label: 'Endurance', color: '#22C55E', desc: 'Lari Santai' },
                1: { label: 'Recovery', color: '#64748B', desc: 'Pemulihan' }
            }
        };
        return (settings[type] && settings[type][zone]) || settings['Run'][1];
    },

    // 4. Helper: m/s ke Pace Seconds
    speedToPaceSeconds(metersPerSecond) {
        if (!metersPerSecond || metersPerSecond <= 0) return 0;
        return Math.round(1000 / metersPerSecond);
    }
};
