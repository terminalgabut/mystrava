export const captureElement = async (elementClassOrId, fileName = 'activity-pro') => {
    if (!window.html2canvas) return false;

    const element = document.getElementById(elementClassOrId) || document.querySelector(`.${elementClassOrId}`);
    if (!element) return false;

    // Sembunyikan UI & vConsole agar tidak masuk foto
    const toHide = document.querySelectorAll('.no-export, .vc-switch, button, .nav-menu, #__vconsole, .vc-panel');
    toHide.forEach(el => el.style.setProperty('display', 'none', 'important'));

    try {
        console.log("📸 Memulai capture (WA-Friendly 1200px)...");

        const canvas = await window.html2canvas(element, {
            useCORS: true,
            allowTaint: true,        // Penting untuk kestabilan peta
            scale: 2,                // RESOLUSI IDEAL: Tajam tanpa kena kompresi WA
            backgroundColor: '#F1F5F9',
            windowWidth: 600,        // Dasar kalkulasi layout di index.html
            scrollX: 0,
            scrollY: -window.scrollY, // Cegah bagian atas putih
            onclone: (clonedDoc) => {
                const clonedEl = clonedDoc.querySelector(`.${elementClassOrId}`) || clonedDoc.getElementById(elementClassOrId);
                
                if (clonedEl) {
                    // Masukkan class pemicu CSS di index.html
                    clonedEl.classList.add('is-exporting');

                    // FORCE: Bersihkan filter blur yang bikin pudar di Chrome
                    const all = clonedEl.querySelectorAll('*');
                    all.forEach(el => {
                        el.style.filter = "none";
                        el.style.backdropFilter = "none";
                        el.style.opacity = "1";
                        
                        // Kunci font agar tidak menempel (Anti-Blur)
                        if (el.classList.contains('stat-value')) {
                            el.style.letterSpacing = "0";
                            el.style.lineHeight = "1.2";
                        }
                    });
                }
            }
        });

        // Simpan sebagai PNG (DataURL 0.9 agar size makin optimal)
        const dataUrl = canvas.toDataURL("image/png", 0.9);
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
        toHide.forEach(el => el.style.display = '');
    }
};
