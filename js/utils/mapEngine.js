// js/utils/mapEngine.js

const MAPBOX_TOKEN = 'pk.eyJ1IjoiaG1teiIsImEiOiJjbW4xbGxqc3QwdzUzMzFvcWxzb2Y2N3MxIn0.1qI1EQRdNTj5JYyP9T8QGw';

export const initActivityMap = (containerId, activity) => {
    if (typeof window.mapboxgl === 'undefined') return null;

    const mapboxgl = window.mapboxgl;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    if (!activity?.summary_polyline) return null;

    try {
        const isExportMode = containerId === 'export-map';
        const isHike = activity.type === 'Hike';

        // 1. SMART STYLE SELECTION
        // Tetap gunakan Outdoors untuk Hike agar gunung tetap hijau & cerah
        // Gunakan Dark untuk Export non-hike agar efek neon maksimal
        const mapStyle = isExportMode && !isHike 
            ? 'mapbox://styles/mapbox/dark-v11' 
            : 'mapbox://styles/mapbox/outdoors-v12';

        const routeColor = isExportMode ? '#00f2ff' : '#fc4c02';

        const map = new mapboxgl.Map({
            container: containerId,
            style: mapStyle,
            center: [activity.start_lng || 0, activity.start_lat || 0], 
            zoom: 14,
            attributionControl: false,
            preserveDrawingBuffer: true,
            interactive: !isExportMode,
            // 2. DRONE VIEW CONFIG (Miring jika Hike/Export)
            pitch: (isHike || isExportMode) ? 60 : 0,
            bearing: (isHike || isExportMode) ? -15 : 0,
            antialias: true
        });

        map.on('load', () => {
            // 3. TERRAIN 3D ENGINE
            map.addSource('mapbox-dem', {
                'type': 'raster-dem',
                'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
                'tileSize': 512,
                'maxzoom': 14
            });

            // Aktifkan elevasi (Exaggeration 1.5x agar Penanggungan terlihat gagah)
            map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });

            // Tambahkan Sky layer untuk cakrawala di kejauhan
            map.addLayer({
                'id': 'sky',
                'type': 'sky',
                'paint': {
                    'sky-type': 'atmosphere',
                    'sky-atmosphere-sun': [0.0, 0.0],
                    'sky-atmosphere-sun-intensity': 15
                }
            });

            const coordinates = decodePolyline(activity.summary_polyline);
            if (!coordinates.length) return;
            
            map.addSource('route', {
                'type': 'geojson',
                'data': {
                    'type': 'Feature',
                    'geometry': { 'type': 'LineString', 'coordinates': coordinates }
                }
            });

            // 4. NEON GLOW EFFECT (Khusus Export)
            if (isExportMode) {
                map.addLayer({
                    'id': 'route-glow',
                    'type': 'line',
                    'source': 'route',
                    'paint': {
                        'line-color': routeColor,
                        'line-width': 10,
                        'line-blur': 8,
                        'line-opacity': 0.4
                    }
                });
            }

            map.addLayer({
                'id': 'route',
                'type': 'line',
                'source': 'route',
                'layout': { 'line-join': 'round', 'line-cap': 'round' },
                'paint': {
                    'line-color': routeColor,
                    'line-width': isExportMode ? 5 : 4,
                    'line-opacity': 1
                }
            });

            const bounds = new mapboxgl.LngLatBounds();
            coordinates.forEach(coord => bounds.extend(coord));
            
            map.fitBounds(bounds, { 
                padding: isExportMode ? 80 : 40, 
                duration: isExportMode ? 0 : 1000,
                animate: !isExportMode
            });
        });

        return map;
    } catch (err) {
        console.error('Mapbox Init Error:', err);
        return null;
    }
};

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
