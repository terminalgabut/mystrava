export const captureElement = async (elementId, fileName = 'activity-pro') => {
    if (!window.html2canvas) return false;

    const element = document.getElementById(elementId);
    if (!element) {
        console.error("❌ Element tidak ditemukan:", elementId);
        return false;
    }

    try {
        console.log("📸 Memulai capture (Premium Dark Mode)...");

        // Paksa scroll ke atas agar koordinat capture tidak meleset
        window.scrollTo(0, 0);

        const canvas = await window.html2canvas(element, {
            useCORS: true,
            allowTaint: false, // Ubah ke false untuk keamanan CORS pada Mapbox

            // 🔥 Kualitas 2x agar tajam di layar Retina/HP High-end
            scale: 2,

            // 🌑 WAJIB GANTI: Agar background dasar foto mengikuti tema Navy Dark
            backgroundColor: '#0F172A', 

            // 🔒 Kunci layout sesuai lebar container desain kita
            width: 600,
            windowWidth: 600,

            // Biarkan html2canvas menghitung tinggi otomatis berdasarkan konten
            scrollX: 0,
            scrollY: -window.scrollY,

            onclone: (clonedDoc) => {
                const clonedEl = clonedDoc.getElementById(elementId);
                if (!clonedEl) return;

                // 🔥 1. Fix CSS: Memastikan font-family dan ikon muncul
                const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
                styles.forEach(style => {
                    clonedDoc.head.appendChild(style.cloneNode(true));
                });

                // 🔥 2. Paksa Warna Teks & BG (Override inline styles jika ada)
                clonedEl.style.backgroundColor = '#0F172A';
                clonedEl.style.width = '600px';
                clonedEl.style.display = 'block';

                // 🔥 3. Fix untuk Mapbox & Font
                const all = clonedEl.querySelectorAll('*');
                all.forEach(el => {
                    // Pastikan teks putih terlihat jelas
                    el.style.webkitFontSmoothing = 'antialiased';
                    
                    // Hilangkan backdrop-filter karena html2canvas belum mendukungnya (bikin kotak hitam)
                    if (getComputedStyle(el).backdropFilter !== 'none') {
                        el.style.backdropFilter = 'none';
                        el.style.backgroundColor = 'rgba(255,255,255,0.05)'; // Fallback glass effect
                    }
                });
            }
        });

        // 🔥 Export ke PNG dengan kualitas tinggi
        const dataUrl = canvas.toDataURL("image/png", 1.0);

        const link = document.createElement('a');
        link.download = `${fileName.replace(/\s+/g, '-').toLowerCase()}.png`;
        link.href = dataUrl;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log("✅ Export Premium Selesai");
        return true;

    } catch (err) {
        console.error("❌ Export Error:", err);
        return false;
    }
};
