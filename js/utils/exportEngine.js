/**
 * Export Engine V2.1 - The "Solid Color" Force
 * Fokus: Memperbaiki warna pudar pada Card Dark & Mapbox
 */
export const captureElement = async (elementClassOrId, fileName = 'activity-pro') => {
    if (!window.html2canvas) return false;

    const element = document.getElementById(elementClassOrId) || document.querySelector(`.${elementClassOrId}`);
    if (!element) return false;

    // Sembunyikan UI dan elemen vConsole
    const toHide = document.querySelectorAll('.no-export, .vc-switch, button, .nav-menu, .v-console, .v-panel');
    toHide.forEach(el => el.style.setProperty('display', 'none', 'important'));

    try {
        console.log("📸 Memulai capture high-contrast...");

        const canvas = await window.html2canvas(element, {
            useCORS: true,
            allowTaint: true,
            scale: 3,                 // 3x Density agar teks Inter tajam
            backgroundColor: '#F1F5F9', // Paksa latar Slate 50
            windowWidth: 600,         
            onclone: (clonedDoc) => {
                const clonedEl = clonedDoc.querySelector(`.${elementClassOrId}`) || clonedDoc.getElementById(elementClassOrId);
                
                if (clonedEl) {
                    clonedEl.classList.add('is-exporting');

                    // 1. FORCE BACKGROUND UTAMA
                    clonedEl.style.backgroundColor = "#F1F5F9";
                    clonedEl.style.opacity = "1";

                    // 2. FIX CARD GELAP (Time Analysis) - Solusi agar tidak abu-abu pudar
                    // Cari semua elemen yang seharusnya berwarna gelap pekat
                    const darkCards = clonedEl.querySelectorAll('[class*="card-dark"], [class*="time-analysis"], .analysis-card');
                    darkCards.forEach(card => {
                        card.style.setProperty('background-color', '#0F172A', 'important'); // Slate 900
                        card.style.setProperty('color', '#FFFFFF', 'important');
                        card.style.opacity = "1";
                    });

                    // 3. FIX TEKS STATISTIK (Agar Hitam Pekat)
                    const mainTexts = clonedEl.querySelectorAll('h1, .stat-value, .text-main');
                    mainTexts.forEach(t => {
                        t.style.setProperty('color', '#0F172A', 'important');
                        t.style.setProperty('opacity', '1', 'important');
                        t.style.letterSpacing = "0"; // Anti-blur
                    });

                    // 4. FIX MAPBOX (Agar Peta Terlihat Jelas)
                    const mapCanvas = clonedEl.querySelector('.mapboxgl-canvas');
                    if (mapCanvas) {
                        mapCanvas.style.setProperty('opacity', '1', 'important');
                        mapCanvas.style.setProperty('visibility', 'visible', 'important');
                    }

                    // 5. FIX SPLITS & MUTED TEXT
                    const mutedTexts = clonedEl.querySelectorAll('.label-muted, .text-muted');
                    mutedTexts.forEach(m => {
                        m.style.setProperty('color', '#475569', 'important'); // Slate 600
                        m.style.setProperty('font-weight', '900', 'important');
                    });
                }
            }
        });

        // Generate PNG (PNG jauh lebih tajam untuk dashboard daripada JPG)
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
        // Kembalikan UI normal
        toHide.forEach(el => el.style.display = '');
    }
};
