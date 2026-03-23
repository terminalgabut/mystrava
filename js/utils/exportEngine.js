export const captureElement = async (elementId, fileName = 'activity-pro') => {
    if (!window.html2canvas) return false;

    const element = document.getElementById(elementId);
    if (!element) {
        console.error("❌ Element tidak ditemukan:", elementId);
        return false;
    }

    try {
        console.log("📸 Memulai capture (clean export mode)...");

        const height = element.scrollHeight;

        const canvas = await window.html2canvas(element, {
            useCORS: true,
            allowTaint: true,

            // 🔥 kualitas optimal (tajam tapi tidak berat)
            scale: Math.min(2, window.devicePixelRatio * 1.5),

            backgroundColor: '#F8FAFC',

            // 🔒 kunci layout export
            width: 600,
            height,
            windowWidth: 600,
            windowHeight: height,

            scrollX: 0,
            scrollY: 0,

            onclone: (clonedDoc) => {
                const clonedEl = clonedDoc.getElementById(elementId);
                if (!clonedEl) return;

                // 🔥 1. Copy semua style (FIX CSS HILANG)
                const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
                styles.forEach(style => {
                    clonedDoc.head.appendChild(style.cloneNode(true));
                });

                // 🔥 2. Paksa layout stabil
                clonedEl.style.height = 'auto';
                clonedEl.style.minHeight = height + 'px';
                clonedEl.style.boxSizing = 'border-box';

                // 🔥 3. Fix efek yang bikin glitch
                const all = clonedEl.querySelectorAll('*');
                all.forEach(el => {
                    const style = clonedDoc.defaultView.getComputedStyle(el);

                    if (style.backdropFilter !== 'none') {
                        el.style.backdropFilter = 'none';
                    }

                    if (style.filter !== 'none') {
                        el.style.filter = 'none';
                    }

                    // 🔥 anti blur text mobile
                    el.style.webkitFontSmoothing = 'antialiased';
                });
            }
        });

        // 🔥 export ke file
        const dataUrl = canvas.toDataURL("image/png", 0.95);

        const link = document.createElement('a');
        link.download = `${fileName.replace(/\s+/g, '-').toLowerCase()}.png`;
        link.href = dataUrl;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log("✅ Export selesai");
        return true;

    } catch (err) {
        console.error("❌ Export Error:", err);
        return false;
    }
};
