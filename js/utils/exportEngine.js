/**
 * Export Engine V1.6 - CSS Driven HD
 * Menggunakan .is-exporting class untuk kontrol gaya yang lebih presisi
 */
export const captureElement = async (elementClassOrId, fileName = 'activity-pro') => {
    // 1. Validasi awal
    if (!window.html2canvas) {
        console.error("❌ Export Engine: html2canvas tidak ditemukan!");
        return false;
    }

    const element = document.getElementById(elementClassOrId) || document.querySelector(`.${elementClassOrId}`);
    if (!element) {
        console.error(`❌ Export Engine: Element ${elementClassOrId} tidak ditemukan!`);
        return false;
    }

    // 2. Sembunyikan elemen UI (tombol, nav, debug) secara manual sebelum cloning
    const toHide = document.querySelectorAll('.no-export, .vc-switch, button, .nav-menu');
    const hiddenElements = [];
    toHide.forEach(el => {
        if (el.style.display !== 'none') {
            hiddenElements.push({ el, originalDisplay: el.style.display });
            el.style.setProperty('display', 'none', 'important');
        }
    });

    try {
        console.log("🚀 Memulai High-Res Capture (600px Viewport)...");

        const canvas = await window.html2canvas(element, {
            useCORS: true,
            allowTaint: false,
            scale: 3,                 // Resolusi HD
            backgroundColor: '#F1F5F9', // Sesuai --bg-app
            logging: false,
            windowWidth: 600,         // Paksa lebar viewport virtual ke 600px
            scrollX: 0,
            scrollY: -window.scrollY,
            onclone: (clonedDoc) => {
                // Cari elemen utama di dokumen hasil clone
                const clonedEl = clonedDoc.querySelector(`.${elementClassOrId}`) || clonedDoc.getElementById(elementClassOrId);
                if (clonedEl) {
                    /**
                     * AKTIFKAN MODE EXPORT
                     * Menghubungkan ke aturan di base/export.css
                     */
                    clonedEl.classList.add('is-exporting');
                }
            }
        });

        // 3. Eksekusi Download (DataURL lebih stabil untuk Mobile)
        const dataUrl = canvas.toDataURL("image/png", 1.0);
        const link = document.createElement('a');
        link.download = `${fileName.replace(/\s+/g, '-').toLowerCase()}.png`;
        link.href = dataUrl;
        
        // Append ke body sesaat agar browser mobile memproses download dengan benar
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log("✅ Snapshot Berhasil di-export!");
        return true;

    } catch (err) {
        console.error("❌ Export Engine Error:", err);
        return false;
    } finally {
        // 4. Kembalikan UI ke kondisi semula
        hiddenElements.forEach(({ el, originalDisplay }) => {
            el.style.display = originalDisplay;
        });
    }
};
