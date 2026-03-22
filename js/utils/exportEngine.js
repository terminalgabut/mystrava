export const captureElement = async (elementClassOrId, fileName = 'activity-pro') => {
    if (!window.html2canvas) return false;

    // Cari elemen berdasarkan ID atau Class
    const element = document.getElementById(elementClassOrId) || document.querySelector(`.${elementClassOrId}`);
    if (!element) return false;

    // Sembunyikan UI & vConsole (Targeting vConsole lebih spesifik)
    const toHide = document.querySelectorAll('.no-export, .vc-switch, button, .nav-menu, .vc-panel, .vc-mask, .vconsole-setup, #__vconsole');
    toHide.forEach(el => el.style.setProperty('display', 'none', 'important'));

    try {
        console.log("🚀 Memulai Deep-Solidify Capture...");

        const canvas = await window.html2canvas(element, {
            useCORS: true,
            allowTaint: true,
            scale: 3,                 
            backgroundColor: '#F1F5F9', 
            windowWidth: 600,
            // Penting: Netralkan posisi scroll agar tidak terpotong putih
            scrollX: 0,
            scrollY: -window.scrollY,
            logging: true, // Lihat prosesnya di vConsole
            onclone: (clonedDoc) => {
                const clonedEl = clonedDoc.querySelector(`.${elementClassOrId}`) || clonedDoc.getElementById(elementClassOrId);
                
                if (clonedEl) {
                    clonedEl.classList.add('is-exporting');
                    clonedEl.style.width = "600px"; // Kunci lebar agar tidak gepeng

                    const allElements = clonedEl.querySelectorAll('*');
                    allElements.forEach(el => {
                        // Reset Filter & Opacity
                        el.style.filter = "none";
                        el.style.backdropFilter = "none";
                        el.style.webkitBackdropFilter = "none";
                        el.style.opacity = "1";

                        // DETEKSI KARTU GELAP (Time Analysis)
                        // Menggunakan pengecekan class yang lebih kompatibel
                        const isDark = el.classList.contains('bg-slate-900') || 
                                       el.classList.contains('card-dark') || 
                                       (el.parentElement && el.parentElement.classList.contains('bg-slate-900'));

                        if (isDark) {
                            el.style.setProperty('background-color', '#0F172A', 'important');
                            el.style.setProperty('color', '#FFFFFF', 'important');
                        }

                        // TEKS UTAMA
                        if (el.classList.contains('stat-value') || el.tagName === 'H1') {
                            el.style.setProperty('color', '#0F172A', 'important');
                            el.style.setProperty('font-weight', '800', 'important');
                            el.style.letterSpacing = "0";
                        }

                        // LABEL (Distance, Pace, Elevation)
                        if (el.classList.contains('label-muted') || el.classList.contains('text-slate-400')) {
                            el.style.setProperty('color', '#475569', 'important'); 
                        }
                    });

                    // Fix Mapbox
                    const mapCanvas = clonedEl.querySelector('.mapboxgl-canvas');
                    if (mapCanvas) mapCanvas.style.opacity = "1";
                }
            }
        });

        // Download PNG
        const dataUrl = canvas.toDataURL("image/png", 1.0);
        const link = document.createElement('a');
        link.download = `${fileName.replace(/\s+/g, '-').toLowerCase()}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        return true;
    } catch (err) {
        console.error("❌ Export Error:", err);
        return false;
    } finally {
        // Kembalikan UI
        toHide.forEach(el => el.style.display = '');
    }
};
