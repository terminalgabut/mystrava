/**
 * Weather Engine V8 - Smart Hybrid (Konteks Waktu + Kondisi WMO)
 * Menghasilkan output seperti: "Dini Hari Gerimis", "Subuh Mendung", "Tengah Malam Cerah".
 */

export const getWeatherEngine = (temp, humidity, windSpeed = 0, startDate = null, weatherCode = null) => {
    // 1. Parsing Jam (Data WIB)
    let hour = 12; 
    if (startDate) {
        const timePart = startDate.includes(' ') ? startDate.split(' ')[1] : startDate.split('T')[1];
        hour = parseInt(timePart.split(':')[0]);
    }

    // 2. Threshold 8 Fase Waktu ala Google Fit
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

    // 3. Logika Cuaca (WMO Code)
    let weatherStatus = 'Cerah';
    let finalIcon = timeCtx.icon;
    let finalColor = timeCtx.color;
    let description = `Suasana ${timeCtx.label.toLowerCase()} yang stabil`;

    if (weatherCode !== null) {
        const code = Number(weatherCode);
        
        if (code === 0) {
            weatherStatus = 'Cerah';
            // Gunakan icon & color dari timeCtx
        } 
        else if ([1, 2, 3].includes(code)) {
            weatherStatus = code === 3 ? 'Mendung' : 'Berawan';
            finalIcon = timeCtx.isDark ? 'cloud-moon' : 'cloud-sun';
            finalColor = 'slate';
            description = 'Langit tertutup awan';
        } 
        else if ([45, 48].includes(code)) {
            weatherStatus = 'Berkabut';
            finalIcon = 'cloud-fog';
            finalColor = 'slate';
            description = 'Jarak pandang terbatas';
        } 
        else if ([51, 53, 55, 56, 57].includes(code)) {
            weatherStatus = 'Gerimis';
            finalIcon = 'cloud-drizzle';
            finalColor = 'blue';
            description = 'Hujan rintik tipis';
        } 
        else if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
            weatherStatus = 'Hujan';
            finalIcon = 'cloud-rain';
            finalColor = 'blue';
            description = 'Kondisi jalanan basah';
        } 
        else if ([95, 96, 99].includes(code)) {
            weatherStatus = 'Badai Petir';
            finalIcon = 'cloud-lightning';
            finalColor = 'red';
            description = 'Waspada cuaca ekstrem';
        }
    }

    // 4. Final Mapping (Kombinasi Label)
    return {
        main: {
            temp: `${temp.toFixed(1)}°C`,
            status: `${timeCtx.label} ${weatherStatus}`, // Output: "Dini Hari Gerimis"
            icon: finalIcon,
            bg: `bg-${finalColor}-50`,
            text: `text-${finalColor}-600`,
            border: `border-${finalColor}-100`,
            desc: description
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
