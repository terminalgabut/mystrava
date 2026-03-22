/**
 * Weather Engine Profesional (Refactored)
 * Memperbaiki masalah konversi timezone UTC ke Lokal agar jam sore tetap sore.
 */

export const getWeatherEngine = (temp, humidity, windSpeed = 0, startDate = null) => {
    // 1. Parsing Jam secara "Raw" (Abaikan Offset Timezone Browser)
    // Jika startDate "2026-03-06 15:00:00+00", kita ambil angka 15 secara mentah.
    let hour = 12; 
    if (startDate) {
        const timePart = startDate.includes(' ') ? startDate.split(' ')[1] : startDate.split('T')[1];
        hour = parseInt(timePart.split(':')[0]);
    }

    // Tentukan waktu (Malam: 18:30 - 04:30, tapi untuk simplifikasi kita pakai jam 19 - 04)
    const isNight = hour >= 19 || hour <= 4;
    const isMorning = hour > 4 && hour <= 9;

    // 2. State Awal (Default: Cerah)
    let config = {
        status: isNight ? 'Malam Cerah' : 'Cerah',
        icon: isNight ? 'moon' : 'sun',
        color: isNight ? 'indigo' : 'amber',
        desc: isNight ? 'Suasana malam tenang' : 'Cuaca cerah stabil'
    };

    // 3. Logika Berdasarkan Suhu & Waktu
    if (temp <= 22) {
        config.status = isNight ? 'Malam Dingin' : 'Dingin';
        config.icon = isNight ? 'moon-star' : 'thermometer-snowflake';
        config.color = 'blue';
    } 
    else if (temp <= 25) {
        config.status = isNight ? 'Malam Sejuk' : 'Sejuk';
        config.icon = isMorning ? 'sunrise' : (isNight ? 'moon' : 'cloud-sun');
        config.color = 'sky';
    } 
    else if (temp > 28 && temp <= 32) {
        config.status = isNight ? 'Malam Gerah' : 'Hangat';
        config.icon = isNight ? 'cloud-moon' : 'cloud-sun';
        config.color = 'orange';
    } 
    else if (temp > 32) {
        config.status = 'Panas Terik';
        config.icon = 'flame';
        config.color = 'red';
        config.desc = 'Suhu ekstrem, jaga hidrasi';
    }

    // 4. Override Kelembapan & Angin
    let humidityLabel = 'Normal';
    if (humidity > 85) {
        humidityLabel = 'Sangat Lembap';
        if (temp < 27) {
            config.icon = isNight ? 'cloud-moon' : 'cloud-fog';
            config.status = isNight ? 'Malam Berembun' : 'Berkabut';
        }
    }

    let windLabel = 'Tenang';
    if (windSpeed > 15) {
        windLabel = 'Berangin';
        if (windSpeed > 25) {
            config.icon = 'wind';
            config.status = 'Angin Kencang';
            config.color = 'indigo';
        }
    }

    // 5. Final Mapping ke UI
    return {
        main: {
            temp: `${temp.toFixed(1)}°C`,
            status: config.status,
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
                sub: humidityLabel,
                icon: 'droplets',
                color: 'text-blue-500'
            },
            {
                label: 'Angin',
                value: `${windSpeed.toFixed(1)}`,
                unit: 'km/h',
                sub: windLabel,
                icon: 'wind',
                color: 'text-slate-500'
            }
        ]
    };
};
