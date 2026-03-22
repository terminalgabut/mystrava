/**
 * Export Engine V1.9 - High-Contrast Precision
 * Refactor untuk menjamin ketajaman (anti-blur) dan warna solid (anti-pudar)
 */
export const captureElement = async (elementClassOrId, fileName = 'activity-pro') => {
    if (!window.html2canvas) return false;

    const element = document.getElementById(elementClassOrId) || document.querySelector(`.${elementClassOrId}`);
    if (!element) return false;

    // Sembunyikan elemen UI agar tidak masuk dalam foto [cite: 12, 13]
    const toHide = document.querySelectorAll('.no-export, .vc-switch, button, .nav-menu');
    toHide.forEach(el => el.style.setProperty('display', 'none', 'important'));

    try {
        const canvas = await window.html2canvas(element, {
            useCORS: true,
            scale: 3,                // Resolusi tinggi untuk mengatasi blur pada Inter 
            backgroundColor: '#F1F5F9', // Paksa warna --bg-app Slate 50 [cite: 37]
            windowWidth: 600,        // Dimensi lebar ideal agar tidak gepeng
            onclone: (clonedDoc) => {
                const clonedEl = clonedDoc.querySelector(`.${elementClassOrId}`) || clonedDoc.getElementById(elementClassOrId);
                
                if (clonedEl) {
                    // 1. TAMBAHKAN CLASS EXPORT
                    // Ini memicu aturan khusus di export.css jika Anda mendaftarkannya
                    clonedEl.classList.add('is-exporting');

                    // 2. MODIFIKASI LAYOUT & WARNA (Override CSS Global)
                    clonedEl.style.width = "600px";
                    clonedEl.style.padding = "32px";
                    clonedEl.style.backgroundColor = "#F1F5F9"; // Hardcoded --bg-app [cite: 37]

                    // 3. OPTIMASI TIPOGRAFI (Anti-Blur & Anti-Pudar)
                    const allTexts = clonedEl.querySelectorAll('h1, h2, p, span, div, b');
                    allTexts.forEach(el => {
                        // Hilangkan letter-spacing negatif saat foto agar tidak terlihat blur 
                        el.style.letterSpacing = "0"; 
                        el.style.opacity = "1";
                        el.style.webkitFontSmoothing = "antialiased"; [cite: 7, 18]

                        // Injeksi warna solid Slate agar tidak pudar mengikuti variabel CSS
                        if (el.classList.contains('label-muted')) {
                            el.style.color = "#475569"; // Slate 600 (Lebih kontras dari Slate 500) [cite: 39]
                            el.style.fontWeight = "900"; // Extra bold untuk label kecil [cite: 28]
                        } 
                        else if (el.classList.contains('stat-value') || el.tagName === 'H1') {
                            el.style.color = "#000000"; // Paksa Hitam Pekat untuk angka & judul 
                            el.style.lineHeight = "1.2"; // Beri sedikit ruang agar tidak terpotong [cite: 21, 25]
                        } 
                        else {
                            el.style.color = "#1E293B"; // Slate 800 untuk teks badan [cite: 39]
                        }
                    });

                    // 4. FIX VISIBILITAS MAP & CANVAS [cite: 11]
                    const mapCanvas = clonedEl.querySelector('.mapboxgl-canvas');
                    if (mapCanvas) {
                        mapCanvas.style.opacity = "1";
                        mapCanvas.style.borderRadius = "16px"; // Paksa --radius-xl [cite: 44]
                    }
                }
            }
        });

        // Eksekusi Download sebagai PNG (PNG lebih tajam untuk teks daripada JPG)
        const dataUrl = canvas.toDataURL("image/png", 1.0);
        const link = document.createElement('a');
        link.download = `${fileName.replace(/\s+/g, '-').toLowerCase()}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        return true;
    } catch (err) {
        console.error("Export Error:", err);
        return false;
    } finally {
        // Kembalikan tampilan aplikasi asli ke kondisi normal
        toHide.forEach(el => el.style.display = '');
    }
};
