/**
 * Mapbox Engine Pro
 * Menangani inisialisasi rute, style modern, dan pembersihan memori.
 */

// Ganti dengan Mapbox Access Token Anda
const MAPBOX_TOKEN = 'pk.eyJ1IjoiaG1teiIsImEiOiJjbW4xbGxqc3QwdzUzMzFvcWxzb2Y2N3MxIn0.1qI1EQRdNTj5JYyP9T8QGw';
mapboxgl.accessToken = MAPBOX_TOKEN;

export const initActivityMap = (containerId, activity) => {
    if (!activity.summary_polyline) return null;

    const map = new mapboxgl.Map({
        container: containerId,
        // Style Outdoor Modern (Sangat cocok untuk lari)
        style: 'mapbox://styles/mapbox/outdoors-v12', 
        center: [activity.start_lng, activity.start_lat],
        zoom: 14,
        attributionControl: false
    });

    map.on('load', () => {
        // 1. Decode Polyline Strava ke GeoJSON
        const coordinates = decodePolyline(activity.summary_polyline);
        
        // 2. Tambahkan Source (Data Rute)
        map.addSource('route', {
            'type': 'geojson',
            'data': {
                'type': 'Feature',
                'properties': {},
                'geometry': {
                    'type': 'LineString',
                    'coordinates': coordinates
                }
            }
        });

        // 3. Tambahkan Layer Garis (Warna Strava Orange)
        map.addLayer({
            'id': 'route',
            'type': 'line',
            'source': 'route',
            'layout': {
                'line-join': 'round',
                'line-cap': 'round'
            },
            'paint': {
                'line-color': '#fc4c02', // Strava Orange
                'line-width': 4,
                'line-opacity': 0.8
            }
        });

        // 4. Zoom Otomatis agar rute pas di layar
        const bounds = new mapboxgl.LngLatBounds();
        coordinates.forEach(coord => bounds.extend(coord));
        map.fitBounds(bounds, { padding: 40, duration: 1000 });
    });

    return map;
};

/**
 * Helper: Decode Encoded Polyline dari Strava
 */
function decodePolyline(encoded) {
    let points = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
        let b, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        // Mapbox menggunakan format [longitude, latitude]
        points.push([lng / 1e5, lat / 1e5]);
    }
    return points;
}
