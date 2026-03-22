/**
 * Export Engine V1.8 - Direct Color Injection
 * Solusi untuk komponen tanpa CSS spesifik (mengandalkan base variables)
 */
export const captureElement = async (elementClassOrId, fileName = 'activity-pro') => {
    if (!window.html2canvas) return false;

    const element = document.getElementById(elementClassOrId) || document.querySelector(`.${elementClassOrId}`);
    if (!element) return false;

    // Sembunyikan UI interaktif
    const toHide = document.querySelectorAll('.no-export, .vc-switch, button, .nav-menu');
    toHide.forEach(el => el.style.setProperty('display', 'none', 'important'));

    try {
        const canvas = await window.html2canvas(element, {
            useCORS: true,
            scale: 3, 
            backgroundColor: '#F1F5F9', // Paksa warna --bg-app 
            windowWidth: 600, 
            onclone: (clonedDoc) => {
                const clonedEl = clonedDoc.querySelector(`.${elementClassOrId}`) || clonedDoc.getElementById(elementClassOrId);
                
                if (clonedEl) {
                    // 1. STYLING KONTAINER
                    clonedEl.style.width = "600px";
                    clonedEl.style.padding = "24px";
                    clonedEl.style.backgroundColor = "#F1F5F9"; // --bg-app 

                    // 2. INJEKSI WARNA TEXT (Mencegah Pudar)
                    // Ambil semua elemen teks dan paksa ke warna Slate pekat Anda
                    const allTexts = clonedEl.querySelectorAll('h1, h2, p, span, div, b');
                    
                    allTexts.forEach(el => {
                        // Jika elemen adalah label kecil (label-muted)
                        if (el.classList.contains('label-muted')) {
                            el.style.color = "#64748B"; // --text-muted [cite: 39]
                            el.style.fontWeight = "800"; // [cite: 28]
                        } 
                        // Jika elemen adalah angka statistik (stat-value) atau judul (h1)
                        else if (el.classList.contains('stat-value') || el.tagName === 'H1') {
                            el.style.color = "#0F172A"; // --text-main 
                        }
                        // Default teks lainnya
                        else {
                            el.style.color = "#334155"; // --text-body [cite: 39]
                        }
                        
                        // Pastikan tidak ada transparansi yang terbawa
                        el.style.opacity = "1";
                    });

                    // 3. FIX MAPBOX (Agar tidak transparan)
                    const mapCanvas = clonedEl.querySelector('.mapboxgl-canvas');
                    if (mapCanvas) mapCanvas.style.opacity = "1";
                }
            }
        });

        // Eksekusi Download
        const dataUrl = canvas.toDataURL("image/png", 1.0);
        const link = document.createElement('a');
        link.download = `${fileName.toLowerCase()}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        return true;
    } catch (err) {
        console.error("Export Error:", err);
        return false;
    } finally {
        toHide.forEach(el => el.style.display = '');
    }
};
