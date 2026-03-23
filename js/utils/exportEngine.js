export const captureElement = async (elementId, fileName = 'activity-pro') => {
    if (!window.html2canvas) return false;

    const element = document.getElementById(elementId);
    if (!element) return false;

    try {
        console.log("📸 Memulai capture (clean export mode)...");

        const canvas = await window.html2canvas(element, {
            useCORS: true,
            allowTaint: true,

            // 🔥 kualitas tajam (lebih adaptif)
            scale: window.devicePixelRatio * 1.5,

            backgroundColor: '#F8FAFC',

            // 🔒 kunci layout export
            width: 600,
            windowWidth: 600,

            scrollX: 0,
            scrollY: 0,

            onclone: (clonedDoc) => {
                const clonedEl = clonedDoc.getElementById(elementId);
                if (!clonedEl) return;

                // 🔥 minimal fix (jangan overkill)
                const all = clonedEl.querySelectorAll('*');

                all.forEach(el => {
                    const style = clonedDoc.defaultView.getComputedStyle(el);

                    // hanya hapus efek yang bermasalah
                    if (style.backdropFilter && style.backdropFilter !== 'none') {
                        el.style.backdropFilter = 'none';
                    }

                    if (style.filter && style.filter !== 'none') {
                        el.style.filter = 'none';
                    }
                });
            }
        });

        const dataUrl = canvas.toDataURL("image/png", 0.95);

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
    }
};
