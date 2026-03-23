// js/utils/mapEngine.js

// 1. Mapbox Token
const MAPBOX_TOKEN = 'pk.eyJ1IjoiaG1teiIsImEiOiJjbW4xbGxqc3QwdzUzMzFvcWxzb2Y2N3MxIn0.1qI1EQRdNTj5JYyP9T8QGw';

export const initActivityMap = (containerId, activity) => {
    if (typeof window.mapboxgl === 'undefined') {
        console.error('Library Mapbox belum termuat di window!');
        return null;
    }

    const mapboxgl = window.mapboxgl;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    if (!activity?.summary_polyline) return null;

    try {
        // 🔥 LOGIKA DETEKSI EKSPOR
        const isExportMode = containerId === 'export-map';

        // Pilih Style: Dark untuk ekspor, Outdoors untuk dashboard biasa
        const mapStyle = isExportMode 
            ? 'mapbox://styles/mapbox/dark-v11' 
            : 'mapbox://styles/mapbox/outdoors-v12';

        // Pilih Warna Rute: Cyan Neon untuk Dark Mode, Strava Orange untuk Light Mode
        const routeColor = isExportMode ? '#00f2ff' : '#fc4c02';
        const lineWidth = isExportMode ? 5 : 4;

        const map = new mapboxgl.Map({
            container: containerId,
            style: mapStyle,
            center: [activity.start_lng || 0, activity.start_lat || 0], 
            zoom: 14,
            attributionControl: false,
            // 🚨 PENTING: Wajib true agar html2canvas bisa membaca buffer gambar Mapbox
            preserveDrawingBuffer: true,
            // Nonaktifkan interaksi jika untuk ekspor agar lebih ringan
            interactive: !isExportMode 
        });

        map.on('load', () => {
            const coordinates = decodePolyline(activity.summary_polyline);
            if (!coordinates.length) return;
            
            map.addSource('route', {
                'type': 'geojson',
                'data': {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': coordinates
                    }
                }
            });

            // Menambahkan Layer Rute
            map.addLayer({
                'id': 'route',
                'type': 'line',
                'source': 'route',
                'layout': { 
                    'line-join': 'round', 
                    'line-cap': 'round' 
                },
                'paint': {
                    'line-color': routeColor,
                    'line-width': lineWidth,
                    'line-opacity': 1
                }
            });

            // Menambahkan Glow Effect (Hanya untuk Export Mode agar lebih Premium)
            if (isExportMode) {
                map.addLayer({
                    'id': 'route-glow',
                    'type': 'line',
                    'source': 'route',
                    'paint': {
                        'line-color': routeColor,
                        'line-width': lineWidth * 2,
                        'line-blur': 8,
                        'line-opacity': 0.4
                    }
                }, 'route'); // Taruh di bawah layer rute utama
            }

            // Auto-fit rute ke layar
            const bounds = new mapboxgl.LngLatBounds();
            coordinates.forEach(coord => bounds.extend(coord));
            
            map.fitBounds(bounds, { 
                padding: isExportMode ? 60 : 40, 
                duration: isExportMode ? 0 : 1000, // Langsung pas jika ekspor
                animate: !isExportMode
            });
        });

        return map;
    } catch (err) {
        console.error('Mapbox Init Error:', err);
        return null;
    }
};

/**
 * Decode Google Polyline ke [lng, lat]
 */
function decodePolyline(encoded) {
    if (!encoded) return [];
    let points = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;
    while (index < len) {
        let b, shift = 0, result = 0;
        do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
        lat += ((result & 1) ? ~(result >> 1) : (result >> 1));
        shift = 0; result = 0;
        do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
        lng += ((result & 1) ? ~(result >> 1) : (result >> 1));
        points.push([lng / 1e5, lat / 1e5]);
    }
    return points;
}
