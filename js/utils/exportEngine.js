/**
 * Export Engine V2.2 - The "Blackout" Edition
 * Fokus: Menghancurkan transparansi & filter yang menyebabkan hasil pudar
 */
export const captureElement = async (elementClassOrId, fileName = 'activity-pro') => {
    if (!window.html2canvas) return false;

    const element = document.getElementById(elementClassOrId) || document.querySelector(`.${elementClassOrId}`);
    if (!element) return false;

    // Sembunyikan UI pengganggu (Termasuk vConsole agar tidak ikut kefoto)
    const toHide = document.querySelectorAll('.no-export, .vc-switch, button, .nav-menu, .vconsole-setup, #__vconsole');
    toHide.forEach(el => el.style.setProperty('display', 'none', 'important'));

    try {
        console.log("🚀 Menjalankan Deep-Solidify Capture...");

        const canvas = await window.html2canvas(element, {
            useCORS: true,
            allowTaint: true,
            scale: 3,                 
            backgroundColor: '#F1F5F9', 
            windowWidth: 600,         
            onclone: (clonedDoc) => {
                const clonedEl = clonedDoc.querySelector(`.${elementClassOrId}`) || clonedDoc.getElementById(elementClassOrId);
                
                if (clonedEl) {
                    clonedEl.classList.add('is-exporting');
                    
                    // BRUTE FORCE: Ambil SEMUA elemen di dalam kloningan
                    const allElements = clonedEl.querySelectorAll('*');
                    
                    allElements.forEach(el => {
                        // 1. Hancurkan semua filter (Blur dari Glassmorphism)
                        el.style.filter = "none";
                        el.style.backdropFilter = "none";
                        el.style.webkitBackdropFilter = "none";
                        
                        // 2. Paksa Opacity menjadi Solid 100%
                        el.style.opacity = "1";

                        // 3. Perbaikan Kartu Gelap (Time Analysis)
                        if (el.classList.contains('bg-slate-900') || el.closest('.bg-slate-900') || el.className.includes('card-dark')) {
                            el.style.setProperty('background-color', '#0F172A', 'important');
                            el.style.setProperty('color', '#FFFFFF', 'important');
                        }

                        // 4. Perbaikan Teks Utama (Anti-Pudar)
                        if (el.classList.contains('stat-value') || el.tagName === 'H1') {
                            el.style.setProperty('color', '#0F172A', 'important');
                            el.style.setProperty('font-weight', '800', 'important');
                            el.style.letterSpacing = "0";
                        }

                        // 5. Perbaikan Label Kecil agar tidak hilang
                        if (el.classList.contains('label-muted') || el.classList.contains('text-slate-400')) {
                            el.style.setProperty('color', '#475569', 'important'); // Slate 600
                        }
                    });

                    // Fix khusus Mapbox agar tidak transparan
                    const mapCanvas = clonedEl.querySelector('.mapboxgl-canvas');
                    if (mapCanvas) {
                        mapCanvas.style.setProperty('opacity', '1', 'important');
                    }
                }
            }
        });

        // Simpan sebagai PNG (PNG mempertahankan ketajaman teks lebih baik dari JPG)
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
        // Munculkan kembali UI
        toHide.forEach(el => el.style.display = '');
    }
};
