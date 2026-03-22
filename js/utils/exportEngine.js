/**
 * Export Engine V1.1 - Pro Snapshot
 * Menangani capture elemen ke image dengan proteksi vConsole & UI
 */
export const captureElement = async (elementClassOrId, fileName = 'activity-snapshot') => {
    // 1. Validasi Library
    if (!window.html2canvas) {
        console.error("❌ Export Engine: html2canvas tidak ditemukan di window!");
        return false;
    }

    // 2. Cari Element (Coba ID dulu, lalu Class)
    const element = document.getElementById(elementClassOrId) || document.querySelector(`.${elementClassOrId}`);
    
    if (!element) {
        console.error(`❌ Export Engine: Element [${elementClassOrId}] tidak ditemukan!`);
        return false;
    }

    console.log("🚀 Export Engine: Memulai proses capture...");

    // 3. Sembunyikan elemen pengganggu (vConsole, Tombol, Navigasi)
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
        // 4. Render dengan html2canvas
        const canvas = await window.html2canvas(element, {
            useCORS: true,
            scale: window.devicePixelRatio > 1 ? 2 : 3, // Adaptif agar HP tidak crash
            backgroundColor: '#f8fafc',
            logging: false,
            // Penting: Abaikan posisi scroll agar capture tidak bergeser
            scrollX: 0,
            scrollY: -window.scrollY, 
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight
        });

        // 5. Trigger Download
        const image = canvas.toDataURL("image/png", 1.0);
        const link = document.createElement('a');
        link.download = `${fileName.replace(/\s+/g, '-').toLowerCase()}.png`;
        link.href = image;
        link.click();

        console.log("✅ Export Engine: Download berhasil dipicu.");
        return true;
    } catch (err) {
        console.error("❌ Export Engine Error:", err);
        return false;
    } finally {
        // 6. Kembalikan UI seperti semula
        hiddenElements.forEach(({ el, originalDisplay }) => {
            el.style.display = originalDisplay;
        });
        console.log("🔄 Export Engine: UI direstore.");
    }
};
