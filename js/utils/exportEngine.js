/**
 * Export Engine V1.5 - Stabilized High-Res
 * Perbaikan error pada baris 59 (Blob/Download Logic)
 */
export const captureElement = async (elementClassOrId, fileName = 'activity-pro') => {
    if (!window.html2canvas) {
        console.error("❌ Export Engine: html2canvas tidak ditemukan!");
        return false;
    }

    const element = document.getElementById(elementClassOrId) || document.querySelector(`.${elementClassOrId}`);
    if (!element) return false;

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
            scale: 3, 
            backgroundColor: '#F1F5F9', // Menggunakan --bg-app [cite: 37]
            logging: false,
            windowWidth: 600, 
            scrollX: 0,
            scrollY: -window.scrollY,
            onclone: (clonedDoc) => {
                const clonedEl = clonedDoc.querySelector(`.${elementClassOrId}`) || clonedDoc.getElementById(elementClassOrId);
                if (clonedEl) {
                    clonedEl.style.width = "600px";
                    clonedEl.style.padding = "24px";
                    clonedEl.style.margin = "0 auto";

                    clonedEl.querySelectorAll('.text-slate-400, .label-muted, .text-muted').forEach(text => {
                        text.style.color = "#334155"; // Menggunakan --text-body [cite: 39]
                        text.style.opacity = "1";
                        text.style.fontWeight = "700"; // Kontras untuk label kecil [cite: 29]
                    });

                    clonedEl.querySelectorAll('h1, .stat-value, p').forEach(text => {
                        text.style.color = "#0F172A"; // Menggunakan --text-main [cite: 38]
                        text.style.webkitFontSmoothing = "antialiased"; 
                    });

                    const mapCanvas = clonedEl.querySelector('.mapboxgl-canvas');
                    if (mapCanvas) mapCanvas.style.opacity = "1";
                }
            }
        });

        // PERBAIKAN LINE 59: Menggunakan DataURL untuk kompatibilitas lebih luas
        const dataUrl = canvas.toDataURL("image/png", 1.0);
        const link = document.createElement('a');
        link.download = `${fileName.replace(/\s+/g, '-').toLowerCase()}.png`;
        link.href = dataUrl;
        
        // Trigger download secara aman
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log("✅ Ultra-HD Snapshot Berhasil!");
        return true;

    } catch (err) {
        console.error("❌ Export Engine Error:", err);
        return false;
    } finally {
        hiddenElements.forEach(({ el, originalDisplay }) => {
            el.style.display = originalDisplay;
        });
    }
};
