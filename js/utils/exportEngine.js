/**
 * Export Engine V1.4 - Ultra Sharp & Wide
 * Solusi anti-buram dan anti-gepeng menggunakan Virtual Viewport
 */
export const captureElement = async (elementClassOrId, fileName = 'activity-pro') => {
    if (!window.html2canvas) {
        console.error("❌ Export Engine: html2canvas tidak ditemukan!");
        return false;
    }

    const element = document.getElementById(elementClassOrId) || document.querySelector(`.${elementClassOrId}`);
    if (!element) return false;

    // Sembunyikan elemen navigasi dan debug
    const toHide = document.querySelectorAll('.no-export, .vc-switch, button, .nav-menu');
    const hiddenElements = [];
    toHide.forEach(el => {
        if (el.style.display !== 'none') {
            hiddenElements.push({ el, originalDisplay: el.style.display });
            el.style.setProperty('display', 'none', 'important');
        }
    });

    try {
        console.log("🚀 Memulai High-Res Capture (600px Width)...");

        const canvas = await window.html2canvas(element, {
            useCORS: true,
            allowTaint: false,
            scale: 3,                // Skala 3x sudah sangat tajam untuk font Inter
            backgroundColor: '#F1F5F9', // Paksa menggunakan --bg-app [cite: 37]
            logging: false,
            
            // SOLUSI LEBAR: Paksa lebar viewport virtual agar tidak mengikuti layar HP yang sempit
            windowWidth: 600, 
            scrollX: 0,
            scrollY: -window.scrollY,

            onclone: (clonedDoc) => {
                const clonedEl = clonedDoc.querySelector(`.${elementClassOrId}`) || clonedDoc.getElementById(elementClassOrId);
                
                if (clonedEl) {
                    // 1. Paksa Lebar & Layout agar tidak gepeng
                    clonedEl.style.width = "600px";
                    clonedEl.style.padding = "24px";
                    clonedEl.style.margin = "0 auto";

                    // 2. Perkuat Kontras Teks (Color Forcing)
                    // Ubah teks muted menjadi lebih gelap agar tidak pudar di hasil foto
                    clonedEl.querySelectorAll('.text-slate-400, .label-muted, .text-muted').forEach(text => {
                        text.style.color = "#334155"; // Gunakan --text-body 
                        text.style.opacity = "1";
                        text.style.fontWeight = "700";
                    });

                    // Pastikan teks utama benar-benar solid
                    clonedEl.querySelectorAll('h1, .stat-value, p').forEach(text => {
                        text.style.color = "#0F172A"; // Gunakan --text-main 
                        text.style.webkitFontSmoothing = "antialiased"; [cite: 7, 18]
                    });

                    // Pastikan Mapbox canvas terlihat 100% solid
                    const mapCanvas = clonedEl.querySelector('.mapboxgl-canvas');
                    if (mapCanvas) mapCanvas.style.opacity = "1";
                }
            }
        });

        // Gunakan Blob untuk menjaga kualitas kompresi PNG
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `${fileName.replace(/\s+/g, '-').toLowerCase()}.png`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        }, 'image/png', 1.0);

        console.log("✅ Ultra-HD Snapshot Berhasil!");
        return true;

    } catch (err) {
        console.error("❌ Export Engine Error:", err);
        return false;
    } finally {
        // Kembalikan UI asli di layar
        hiddenElements.forEach(({ el, originalDisplay }) => {
            el.style.display = originalDisplay;
        });
    }
};
