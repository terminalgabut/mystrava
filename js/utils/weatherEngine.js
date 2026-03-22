/**
 * Weather Engine Profesional
 * Menangani logika Cuaca, Suhu, Angin, dan Kelembapan
 */

export const getWeatherEngine = (temp, humidity, windSpeed = 0) => {
    // 1. Dasar Konfigurasi (Default: Cerah)
    let config = {
        status: 'Cerah',
        icon: 'sun',
        colorClass: 'amber', // Untuk Tailwind: bg-amber-50, text-amber-600
        description: 'Cuaca cerah dan stabil',
        feeling: 'Nyaman'
    };

    // 2. Logika Berdasarkan Suhu
    if (temp <= 22) {
        config.status = 'Dingin';
        config.icon = 'thermometer-snowflake';
        config.colorClass = 'blue';
        config.description = 'Udara cukup dingin, tetap hangat';
    } else if (temp <= 25) {
        config.status = 'Sejuk';
        config.icon = 'sunrise'; // Cocok untuk subuh
        config.colorClass = 'sky';
        config.description = 'Udara pagi yang segar';
    } else if (temp > 28 && temp <= 32) {
        config.status = 'Hangat';
        config.icon = 'cloud-sun';
        config.colorClass = 'orange';
        config.description = 'Mulai terasa terik';
    } else if (temp > 32) {
        config.status = 'Panas Terik';
        config.icon = 'flame';
        config.colorClass = 'red';
        config.description = 'Suhu ekstrem, hidrasi maksimal';
    }

    // 3. Logika Berdasarkan Kelembapan (Humidity)
    let humidityIcon = 'droplets';
    let humidityLabel = 'Normal';
    if (humidity > 85) {
        humidityLabel = 'Sangat Lembap';
        if (temp < 27) {
            config.icon = 'cloud-fog'; // Indikasi kabut pagi
            config.status = 'Berkabut';
        }
    }

    // 4. Logika Berdasarkan Angin (Wind Speed dalam km/h)
    let windIcon = 'wind';
    let windLabel = 'Tenang';
    if (windSpeed > 15) {
        windLabel = 'Berangin';
        if (windSpeed > 25) {
            config.icon = 'wind';
            config.status = 'Angin Kencang';
            config.colorClass = 'indigo';
        }
    }

    // 5. Output Objek Lengkap
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
                label: 'Kecepatan Angin',
                value: `${windSpeed.toFixed(1)}`,
                unit: 'km/h',
                sub: windLabel,
                icon: 'wind',
                color: 'text-slate-500'
            }
        ]
    };
};
