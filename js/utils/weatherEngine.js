/**
 * Weather Engine V7 - Hyper-Detail (Google Fit & Health Style)
 * Membagi waktu menjadi 8 fase transisi langit untuk Indonesia.
 */

export const getWeatherEngine = (temp, humidity, windSpeed = 0, startDate = null, weatherCode = null) => {
    // 1. Parsing Jam (Waktu Lokal/WIB dari DB)
    let hour = 12; 
    if (startDate) {
        const timePart = startDate.includes(' ') ? startDate.split(' ')[1] : startDate.split('T')[1];
        hour = parseInt(timePart.split(':')[0]);
    }

    // 2. Definisi 8 Fase Waktu (Threshold Hyper-Detail)
    let timeCtx = { label: 'Siang', icon: 'sun', color: 'amber', isDark: false };

    if (hour >= 0 && hour < 3) {
        timeCtx = { label: 'Tengah Malam', icon: 'moon-star', color: 'indigo', isDark: true };
    } else if (hour >= 3 && hour < 5) {
        timeCtx = { label: 'Dini Hari', icon: 'wind', color: 'slate', isDark: true };
    } else if (hour >= 5 && hour < 7) {
        timeCtx = { label: 'Subuh', icon: 'sunrise', color: 'sky', isDark: false };
    } else if (hour >= 7 && hour < 11) {
        timeCtx = { label: 'Pagi', icon: 'sun', color: 'amber', isDark: false };
    } else if (hour >= 11 && hour < 15) {
        timeCtx = { label: 'Siang', icon: 'sun', color: 'orange', isDark: false };
    } else if (hour >= 15 && hour < 18) {
        timeCtx = { label: 'Sore', icon: 'sunset', color: 'orange', isDark: false };
    } else if (hour >= 18 && hour < 20) {
        timeCtx = { label: 'Petang', icon: 'cloud-moon', color: 'violet', isDark: true };
    } else {
        timeCtx = { label: 'Malam', icon: 'moon', color: 'indigo', isDark: true };
    }

    // 3. Konfigurasi Dasar Berdasarkan Waktu
    let config = {
        status: 'Cerah',
        icon: timeCtx.icon,
        color: timeCtx.color,
        desc: `Suasana ${timeCtx.label.toLowerCase()} yang stabil`
    };

    // 4. Integrasi Weather Code (WMO) sebagai Penentu Utama
    if (weatherCode !== null) {
        const code = Number(weatherCode);
        
        if (code === 0) {
            config.status = 'Cerah';
        } 
        else if ([1, 2, 3].includes(code)) {
            config.status = code === 3 ? 'Mendung' : 'Berawan';
            config.icon = timeCtx.isDark ? 'cloud-moon' : 'cloud-sun';
            config.color = 'slate';
        } 
        else if ([45, 48].includes(code)) {
            config.status = 'Berkabut';
            config.icon = 'cloud-fog';
            config.color = 'slate';
        } 
        else if ([51, 53, 55, 56, 57].includes(code)) {
            config.status = 'Gerimis';
            config.icon = 'cloud-drizzle';
            config.color = 'blue';
        } 
        else if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
            config.status = 'Hujan';
            config.icon = 'cloud-rain';
            config.color = 'blue';
        } 
        else if ([95, 96, 99].includes(code)) {
            config.status = 'Badai Petir';
            config.icon = 'cloud-lightning';
            config.color = 'red';
        }
    }

    // 5. Final Mapping ke Dashboard
    // Menghasilkan output seperti: "Dini Hari Mendung" atau "Siang Cerah"
    const finalStatus = `${timeCtx.label} ${config.status}`;

    return {
        main: {
            temp: `${temp.toFixed(1)}°C`,
            status: finalStatus,
            icon: config.icon,
            bg: `bg-${config.color}-50`,
            text: `text-${config.color}-600`,
            border: `border-${config.color}-100`,
            desc: `Aktivitas pukul ${hour.toString().padStart(2, '0')}:00 WIB`
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
