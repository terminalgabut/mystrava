/**
 * Export Engine V2.0 - Production Stabilized
 * Optimal dengan Internal CSS di index.html untuk mencegah pudar & blur.
 */
export const captureElement = async (elementClassOrId, fileName = 'activity-pro') => {
    if (!window.html2canvas) {
        console.error("❌ html2canvas tidak ditemukan!");
        return false;
    }

    const element = document.getElementById(elementClassOrId) || document.querySelector(`.${elementClassOrId}`);
    if (!element) return false;

    // Sembunyikan elemen UI asli sesaat
    const toHide = document.querySelectorAll('.no-export, .vc-switch, button, .nav-menu');
    toHide.forEach(el => el.style.setProperty('display', 'none', 'important'));

    try {
        console.log("📸 Memulai capture (Resolusi 3x)...");

        const canvas = await window.html2canvas(element, {
            useCORS: true,
            allowTaint: false,
            scale: 3,                 // High-res untuk teks tajam
            backgroundColor: '#F1F5F9', // Paksa Slate 50 (bg-app)
            logging: false,
            windowWidth: 600,         // Lebar kanvas bayangan 600px
            scrollX: 0,
            scrollY: -window.scrollY,
            onclone: (clonedDoc) => {
                const clonedEl = clonedDoc.querySelector(`.${elementClassOrId}`) || clonedDoc.getElementById(elementClassOrId);
                
                if (clonedEl) {
                    /**
                     * 1. AKTIFKAN MODE EXPORT
                     * Menghubungkan ke <style> di index.html
                     */
                    clonedEl.classList.add('is-exporting');

                    /**
                     * 2. FORCE STYLING (Brute Force untuk Anti-Pudar)
                     * Memastikan elemen kloning tidak mewarisi opacity rendah.
                     */
                    clonedEl.style.opacity = "1";
                    clonedEl.style.display = "block";
                    clonedEl.style.visibility = "visible";

                    // Injeksi warna langsung untuk elemen kritis jika CSS internal terhambat
                    const stats = clonedEl.querySelectorAll('.stat-value, h1');
                    stats.forEach(s => {
                        s.style.color = "#0F172A"; // Slate 900
                        s.style.letterSpacing = "0"; // Anti-blur
                    });

                    const labels = clonedEl.querySelectorAll('.label-muted');
                    labels.forEach(l => {
                        l.style.color = "#475569"; // Slate 600
                        l.style.fontWeight = "900";
                    });

                    const mapCanvas = clonedEl.querySelector('.mapboxgl-canvas');
                    if (mapCanvas) mapCanvas.style.opacity = "1";
                }
            }
        });

        // 3. PROSES DOWNLOAD
        const dataUrl = canvas.toDataURL("image/png", 1.0);
        const link = document.createElement('a');
        link.download = `${fileName.replace(/\s+/g, '-').toLowerCase()}.png`;
        link.href = dataUrl;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log("✅ Export Berhasil!");
        return true;

    } catch (err) {
        console.error("❌ Export Error:", err);
        return false;
    } finally {
        // Kembalikan UI ke kondisi semula
        toHide.forEach(el => el.style.display = '');
    }
};
