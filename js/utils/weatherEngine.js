/**
 * Weather Engine V5 - WMO Code Based
 * Menggunakan data riil weather_code dari Open-Meteo
 */

export const getWeatherEngine = (temp, humidity, windSpeed = 0, startDate = null, weatherCode = null) => {
    // 1. Parsing Jam Lokal (Agar jam 15:00 di DB tetap Sore, bukan Malam)
    let hour = 12; 
    if (startDate) {
        // Mengambil string jam langsung (index 11-13) untuk menghindari auto-timezone browser
        const timePart = startDate.includes(' ') ? startDate.split(' ')[1] : startDate.split('T')[1];
        hour = parseInt(timePart.split(':')[0]);
    }

    const isNight = hour >= 19 || hour <= 4;
    const isMorning = hour > 4 && hour <= 9;

    // 2. Default Config (Cerah)
    let config = {
        status: isNight ? 'Malam Cerah' : 'Cerah',
        icon: isNight ? 'moon' : (isMorning ? 'sunrise' : 'sun'),
        color: isNight ? 'indigo' : 'amber',
        desc: 'Cuaca stabil untuk aktivitas'
    };

    // 3. LOGIKA UTAMA: Berdasarkan Weather Code (WMO)
    // Jika weatherCode ada di DB, gunakan ini sebagai prioritas utama
    if (weatherCode !== null) {
        const code = Number(weatherCode);

        if (code === 0) {
            config.status = 'Cerah';
            // Icon & Color sudah didefinisikan di default
        } 
        else if ([1, 2, 3].includes(code)) {
            config.status = code === 3 ? 'Mendung' : 'Berawan';
            config.icon = isNight ? 'cloud-moon' : 'cloud-sun';
            config.color = 'slate';
            config.desc = 'Langit tertutup awan';
        } 
        else if ([45, 48].includes(code)) {
            config.status = 'Berkabut';
            config.icon = 'cloud-fog';
            config.color = 'slate';
            config.desc = 'Jarak pandang terbatas';
        } 
        else if ([51, 53, 55, 56, 57].includes(code)) {
            config.status = 'Gerimis';
            config.icon = 'cloud-drizzle';
            config.color = 'blue';
            config.desc = 'Hujan rintik-rintik';
        } 
        else if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
            config.status = 'Hujan';
            config.icon = 'cloud-rain';
            config.color = 'blue';
            config.desc = 'Kondisi basah dan licin';
        } 
        else if ([95, 96, 99].includes(code)) {
            config.status = 'Badai Petir';
            config.icon = 'cloud-lightning';
            config.color = 'red';
            config.desc = 'Waspada petir dan angin';
        }
    } 
    // 4. FALLBACK: Jika weather_code NULL (Logika lama tetap ada sebagai cadangan)
    else {
        if (temp > 32) {
            config.status = 'Panas Terik';
            config.icon = 'flame';
            config.color = 'red';
        } else if (temp <= 22) {
            config.color = 'blue';
            config.status = isNight ? 'Malam Dingin' : 'Dingin';
        }
    }

    // 5. Final Mapping ke Dashboard UI
    return {
        main: {
            temp: `${temp.toFixed(1)}°C`,
            status: isNight && !config.status.includes('Malam') ? `Malam ${config.status}` : config.status,
            icon: config.icon,
            bg: `bg-${config.color}-50`,
            text: `text-${config.color}-600`,
            border: `border-${config.color}-100`,
            desc: config.desc
        },
        stats: [
            {
                label: 'Kelembapan',
                value: `${humidity}%`,
                sub: humidity > 85 ? 'Sangat Lembap' : 'Normal',
                icon: 'droplets',
                color: 'text-blue-500'
            },
            {
                label: 'Angin',
                value: `${windSpeed.toFixed(1)}`,
                unit: 'km/h',
                sub: windSpeed > 15 ? 'Berangin' : 'Tenang',
                icon: 'wind',
                color: 'text-slate-500'
            }
        ]
    };
};
