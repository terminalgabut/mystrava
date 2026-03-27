/**
 * PerformanceLogic.js
 * Pusat logika untuk klasifikasi zona intensitas lari (Pace) dan sepeda (Power).
 */

export const PerformanceLogic = {
    // 1. Logika Utama: Menentukan Zona Lari (6 Zona Strava)
    getRunZone(currentPaceSec, thresholdPaceSec) {
        if (!currentPaceSec || !thresholdPaceSec || currentPaceSec <= 0) return 1;
        
        // Ratio = Pace saat ini / Threshold Pace
        // Semakin kecil angka detik (semakin kencang), ratio semakin kecil
        const ratio = currentPaceSec / thresholdPaceSec;

        if (ratio <= 0.81) return 6; // Neuromuscular (Sprint)
        if (ratio <= 0.90) return 5; // Anaerobic
        if (ratio <= 0.95) return 4; // Ambang Batas (Threshold)
        if (ratio <= 1.00) return 3; // Tempo
        if (ratio <= 1.15) return 2; // Endurance (Easy)
        return 1;                    // Active Recovery
    },

    // 2. Logika Utama: Menentukan Zona Sepeda (7 Zona Power Umum)
    getPowerZone(currentWatts, ftp) {
        if (!currentWatts || !ftp || ftp <= 0) return 1;
        
        const pct = (currentWatts / ftp);

        if (pct >= 1.50) return 7; // Neuromuscular Power
        if (pct >= 1.21) return 6; // Anaerobic Capacity
        if (pct >= 1.06) return 5; // VO2 Max
        if (pct >= 0.91) return 4; // Lactate Threshold
        if (pct >= 0.76) return 3; // Tempo
        if (pct >= 0.56) return 2; // Endurance
        return 1;                  // Active Recovery
    },

    // 3. Konfigurasi Visual & Label (Mengacu pada variables.css & typography.css)
    getZoneSettings(zone, type = 'Run') {
        const settings = {
            Run: {
                6: { label: 'Z6 Neuromuscular', color: '#0F172A', desc: 'Sprint Maksimal' }, // Slate 900 [cite: 5]
                5: { label: 'Z5 Anaerobic', color: '#EF4444', desc: 'Sangat Keras' },
                4: { label: 'Z4 Ambang Batas', color: '#0052FF', desc: 'Target Performa' }, // Brand Primary 
                3: { label: 'Z3 Tempo', color: '#EAB308', desc: 'Cukup Keras' },
                2: { label: 'Z2 Endurance', color: '#22C55E', desc: 'Lari Santai' },
                1: { label: 'Z1 Recovery', color: '#64748B', desc: 'Pemulihan' } // Slate 500 [cite: 6]
            },
            Ride: {
                // ... (Bisa disesuaikan untuk zona power sepeda)
            }
        };
        
        return (settings[type] && settings[type][zone]) || settings['Run'][1];
    },

    // 4. Helper: Konversi m/s ke Detik/KM (Pace)
    speedToPaceSeconds(metersPerSecond) {
        if (!metersPerSecond || metersPerSecond <= 0) return 0;
        return Math.round(1000 / metersPerSecond);
    }
};
