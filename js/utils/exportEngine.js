/**
 * Export Engine V1 - High Definition Snapshot
 * Menangani pengambilan gambar elemen HTML ke PNG/JPG
 */

export const captureElement = async (elementId, fileName = 'activity-snapshot') => {
    const element = document.getElementById(elementId) || document.querySelector(`.${elementId}`);
    
    if (!element) {
        console.error("Export Engine: Element tidak ditemukan!");
        return;
    }

    // 1. Identifikasi elemen yang harus disembunyikan (Tombol, vConsole, dll)
    const selectorsToHide = [
        '.no-export', 
        '.vc-switch', 
        'button', 
        '.nav-menu',
        '#download-btn'
    ];
    
    const hiddenElements = [];
    selectorsToHide.forEach(selector => {
        const els = document.querySelectorAll(selector);
        els.forEach(el => {
            if (el.style.display !== 'none') {
                hiddenElements.push({ el, originalDisplay: el.style.display });
                el.style.setProperty('display', 'none', 'important');
            }
        });
    });

    try {
        // 2. Render ke Canvas menggunakan html2canvas
        const canvas = await window.html2canvas(element, {
            useCORS: true,           // Penting untuk Mapbox & Image luar
            scale: 3,                // Resolusi 3x lipat (Ultra HD)
            backgroundColor: '#f8fafc', // Warna Slate-50 agar bersih
            logging: false,
            scrollX: 0,
            scrollY: -window.scrollY, // Fix posisi jika user sedang scroll
            onclone: (clonedDoc) => {
                // Opsional: Modifikasi elemen di versi kloningan sebelum difoto
                // Contoh: Tambahkan watermark "Created with MyStrava Pro"
            }
        });

        // 3. Trigger Download
        const image = canvas.toDataURL("image/png", 1.0);
        const link = document.createElement('a');
        link.download = `${fileName}.png`;
        link.href = image;
        link.click();

        return true;
    } catch (err) {
        console.error("Export Engine Error:", err);
        return false;
    } finally {
        // 4. KEMBALIKAN ELEMEN YANG DISEMBUNYIKAN
        hiddenElements.forEach(({ el, originalDisplay }) => {
            el.style.display = originalDisplay;
        });
    }
};
