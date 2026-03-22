/**
 * Export Engine V1.6 - Production Ready
 * Memperbaiki Syntax Error (Cite Tags) yang menyebabkan Build Cancelled
 */
export const captureElement = async (elementClassOrId, fileName = 'activity-pro') => {
    if (!window.html2canvas) {
        console.error("❌ Export Engine: html2canvas tidak ditemukan!");
        return false;
    }

    const element = document.getElementById(elementClassOrId) || document.querySelector(`.${elementClassOrId}`);
    if (!element) return false;

    // Sembunyikan elemen UI
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
            backgroundColor: '#F1F5F9', 
            logging: false,
            windowWidth: 600, 
            scrollX: 0,
            scrollY: -window.scrollY,
            onclone: (clonedDoc) => {
                const clonedEl = clonedDoc.querySelector(`.${elementClassOrId}`) || clonedDoc.getElementById(elementClassOrId);
                if (clonedEl) {
                    // Paksa Lebar agar tidak gepeng
                    clonedEl.style.width = "600px";
                    clonedEl.style.padding = "24px";
                    clonedEl.style.margin = "0 auto";

                    // Perkuat Kontras Teks Muted
                    clonedEl.querySelectorAll('.text-slate-400, .label-muted, .text-muted').forEach(text => {
                        text.style.color = "#334155"; 
                        text.style.opacity = "1";
                        text.style.fontWeight = "700"; 
                    });

                    // Perkuat Teks Utama
                    clonedEl.querySelectorAll('h1, .stat-value, p').forEach(text => {
                        text.style.color = "#0F172A"; 
                        text.style.webkitFontSmoothing = "antialiased"; 
                    });

                    const mapCanvas = clonedEl.querySelector('.mapboxgl-canvas');
                    if (mapCanvas) mapCanvas.style.opacity = "1";
                }
            }
        });

        // Konversi ke Image
        const dataUrl = canvas.toDataURL("image/png", 1.0);
        const link = document.createElement('a');
        link.download = `${fileName.replace(/\s+/g, '-').toLowerCase()}.png`;
        link.href = dataUrl;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log("✅ Ultra-HD Snapshot Berhasil!");
        return true;

    } catch (err) {
        console.error("❌ Export Engine Error:", err);
        return false;
    } finally {
        // Kembalikan UI
        hiddenElements.forEach(({ el, originalDisplay }) => {
            el.style.display = originalDisplay;
        });
    }
};
