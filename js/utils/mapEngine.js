// js/utils/mapEngine.js

// 1. Pastikan Token Benar
const MAPBOX_TOKEN = 'pk.eyJ1IjoiaG1teiIsImEiOiJjbW4xbGxqc3QwdzUzMzFvcWxzb2Y2N3MxIn0.1qI1EQRdNTj5JYyP9T8QGw'; // Ganti dengan token asli Anda

export const initActivityMap = (containerId, activity) => {
    // 2. Gunakan window.mapboxgl untuk menghindari ReferenceError
    if (typeof window.mapboxgl === 'undefined') {
        console.error('Library Mapbox belum termuat di window!');
        return null;
    }

    const mapboxgl = window.mapboxgl; // Ambil dari global
    mapboxgl.accessToken = MAPBOX_TOKEN;

    if (!activity.summary_polyline) return null;

    try {
        const map = new mapboxgl.Map({
            container: containerId,
            style: 'mapbox://styles/mapbox/outdoors-v12',
            // Koordinat Mapbox: [Longitude, Latitude]
            center: [activity.start_lng, activity.start_lat], 
            zoom: 14,
            attributionControl: false,
            preserveDrawingBuffer: true
        });

        map.on('load', () => {
            const coordinates = decodePolyline(activity.summary_polyline);
            
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

            map.addLayer({
                'id': 'route',
                'type': 'line',
                'source': 'route',
                'layout': { 'line-join': 'round', 'line-cap': 'round' },
                'paint': {
                    'line-color': '#fc4c02', // Strava Orange
                    'line-width': 4,
                    'line-opacity': 0.8
                }
            });

            // Auto-fit rute ke layar
            const bounds = new mapboxgl.LngLatBounds();
            coordinates.forEach(coord => bounds.extend(coord));
            map.fitBounds(bounds, { padding: 40, duration: 1000 });
        });

        return map;
    } catch (err) {
        console.error('Mapbox Init Error:', err);
        return null;
    }
};

// Fungsi decode harus menghasilkan [lng, lat] untuk Mapbox
function decodePolyline(encoded) {
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
        points.push([lng / 1e5, lat / 1e5]); // [Longitude, Latitude]
    }
    return points;
}
