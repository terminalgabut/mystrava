/**
 * Weather Engine Profesional
 * Menangani logika Cuaca, Suhu, Angin, Kelembapan, dan Waktu (Siang/Malam)
 */

export const getWeatherEngine = (temp, humidity, windSpeed = 0, startDate = null) => {
    // 1. Deteksi Waktu (Malam vs Siang)
    // Jam 18:30 ke atas atau 04:30 ke bawah dianggap malam
    const runDate = startDate ? new Date(startDate) : new Date();
    const hour = runDate.getHours();
    const minutes = runDate.getMinutes();
    const currentTimeValue = hour + minutes / 60;
    const isNight = currentTimeValue >= 18.5 || currentTimeValue <= 4.5;

    // 2. Dasar Konfigurasi (Default: Cerah)
    let config = {
        status: isNight ? 'Malam Cerah' : 'Cerah',
        icon: isNight ? 'moon' : 'sun',
        colorClass: isNight ? 'indigo' : 'amber', 
        description: isNight ? 'Suasana malam yang tenang' : 'Cuaca cerah dan stabil',
    };

    // 3. Logika Berdasarkan Suhu
    if (temp <= 22) {
        config.status = isNight ? 'Malam Dingin' : 'Dingin';
        config.icon = isNight ? 'moon-star' : 'thermometer-snowflake';
        config.colorClass = 'blue';
        config.description = 'Udara cukup dingin, tetap hangat';
    } else if (temp <= 25) {
        config.status = isNight ? 'Malam Sejuk' : 'Sejuk';
        // Sunrise hanya untuk pagi, jika malam gunakan moon/cloud-moon
        config.icon = isNight ? 'moon' : 'sunrise'; 
        config.colorClass = 'sky';
        config.description = isNight ? 'Udara malam yang segar' : 'Udara pagi yang segar';
    } else if (temp > 28 && temp <= 32) {
        config.status = isNight ? 'Malam Gerah' : 'Hangat';
        config.icon = isNight ? 'cloud-moon' : 'cloud-sun';
        config.colorClass = 'orange';
        config.description = isNight ? 'Malam terasa sedikit lembap' : 'Mulai terasa terik';
    } else if (temp > 32) {
        config.status = 'Panas Terik';
        config.icon = 'flame';
        config.colorClass = 'red';
        config.description = 'Suhu ekstrem, hidrasi maksimal';
    }

    // 4. Logika Berdasarkan Kelembapan (Humidity)
    let humidityLabel = 'Normal';
    if (humidity > 85) {
        humidityLabel = 'Sangat Lembap';
        if (temp < 27) {
            config.icon = isNight ? 'cloud-moon' : 'cloud-fog'; 
            config.status = isNight ? 'Malam Berembun' : 'Berkabut';
        }
    }

    // 5. Logika Berdasarkan Angin (Wind Speed)
    let windLabel = 'Tenang';
    if (windSpeed > 15) {
        windLabel = 'Berangin';
        if (windSpeed > 25) {
            config.icon = 'wind';
            config.status = 'Angin Kencang';
            config.colorClass = 'indigo';
        }
    }

    // 6. Output Objek Lengkap
    return {
        main: {
            temp: `${temp.toFixed(1)}°C`,
            status: config.status,
            icon: config.icon,
            bg: `bg-${config.colorClass}-50`,
            text: `text-${config.colorClass}-600`,
            border: `border-${config.colorClass}-100`,
            desc: config.description
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
