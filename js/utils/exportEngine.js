/**
 * Export Engine Premium menggunakan html-to-image
 * Lebih akurat dalam merender teks, backdrop-filter, dan Mapbox.
 */
export const captureElement = async (elementId, fileName = 'activity-pro') => {
    const element = document.getElementById(elementId);
    
    // Pastikan library html-to-image sudah terpasang di index.html
    if (!element || !window.htmlToImage) {
        console.error("❌ Element tidak ditemukan atau library html-to-image belum dimuat.");
        return false;
    }

    try {
        console.log("🚀 Memulai Export (High Fidelity Mode)...");

        // Opsi konfigurasi untuk hasil maksimal
        const options = {
            quality: 1.0,
            pixelRatio: 2, // Hasil 2x lebih tajam (Retina/4K Ready)
            backgroundColor: '#0F172A', // Paksa background Navy Dark
            width: 600,
            height: element.offsetHeight,
            style: {
                // Pastikan transformasi CSS bersih saat capture
                transform: 'scale(1)',
                transformOrigin: 'top left',
                // Matikan filter yang berat jika diperlukan, 
                // tapi html-to-image biasanya mendukung backdrop-filter lebih baik
            },
            // Memastikan font eksternal dan gambar CORS termuat
            cacheBust: true,
            // Lewati elemen yang tidak ingin diekspor (jika ada class .no-export)
            filter: (node) => {
                return !node.classList?.contains('no-export');
            }
        };

        // 1. Generate PNG Data URL
        // Kita gunakan toPng untuk hasil terbaik tanpa kompresi pecah
        const dataUrl = await window.htmlToImage.toPng(element, options);

        // 2. Proses Download otomatis
        const link = document.createElement('a');
        const cleanFileName = fileName.replace(/\s+/g, '-').toLowerCase();
        
        link.download = `${cleanFileName}.png`;
        link.href = dataUrl;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log("✅ Export Selesai dengan Presisi Tinggi!");
        return true;

    } catch (err) {
        console.error("❌ Export Error:", err);
        // Fallback jika terjadi error pada font/image loading
        alert("Gagal mengekspor gambar. Pastikan semua aset (peta/ikon) sudah termuat sempurna.");
        return false;
    }
};
