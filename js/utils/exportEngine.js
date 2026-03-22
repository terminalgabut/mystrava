// js/utils/exportEngine.js

/**
 * Export Engine V1.2 - ULTRA HD Pro Snapshot
 * Memperbaiki masalah buram, teks pecah, dan warna pudar
 */
export const captureElement = async (elementClassOrId, fileName = 'activity-pro-snapshot') => {
    // 1. Validasi Library
    if (!window.html2canvas) {
        console.error("❌ Export Engine: Library html2canvas tidak ditemukan!");
        return false;
    }

    // 2. Cari Element
    const element = document.getElementById(elementClassOrId) || document.querySelector(`.${elementClassOrId}`);
    if (!element) {
        console.error(`❌ Export Engine: Element [${elementClassOrId}] tidak ditemukan!`);
        return false;
    }

    console.log("🚀 Export Engine: Memulai High-Res Capture...");

    // 3. Sembunyikan elemen pengganggu (UI & vConsole)
    const selectorsToHide = ['.no-export', '.vc-switch', 'button', '.nav-menu'];
    const hiddenElements = [];
    selectorsToHide.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            if (el.style.display !== 'none') {
                hiddenElements.push({ el, originalDisplay: el.style.display });
                el.style.setProperty('display', 'none', 'important');
            }
        });
    });

    try {
        // 4. Render dengan Skala Ultra HD
        const canvas = await window.html2canvas(element, {
            useCORS: true,           // Penting untuk Mapbox
            allowTaint: false,      // Keamanan CORS
            logging: false,         // Matikan log internal html2canvas
            
            // --- INI PERBAIKAN UTAMA AGAR TAJAM & KONTRAS ---
            scale: 4,               // Naikkan ke skala 4 (Ultra HD/HD+)
            backgroundColor: '#f8fafc', // WARNA LATAR Slate-50: Teks akan kontras
            imageTimeout: 15000,    // Tunggu gambar map ter-load penuh
            removeContainer: true,  // Bersihkan container setelah foto
            // ----------------------------------------------
            
            // Konfigurasi viewport (Abaikan scroll HP)
            scrollX: 0,
            scrollY: -window.scrollY, 
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight
        });

        // 5. Trigger Download PNG (PNG lebih tajam daripada JPG untuk teks)
        const image = canvas.toDataURL("image/png", 1.0);
        const link = document.createElement('a');
        link.download = `${fileName.replace(/\s+/g, '-').toLowerCase()}.png`;
        link.href = image;
        link.click();

        console.log("✅ Export Engine: Download Ultra-HD berhasil.");
        return true;
    } catch (err) {
        console.error("❌ Export Engine Error:", err);
        return false;
    } finally {
        // 6. Kembalikan UI
        hiddenElements.forEach(({ el, originalDisplay }) => {
            el.style.display = originalDisplay;
        });
        console.log("🔄 Export Engine: UI direstore.");
    }
};
