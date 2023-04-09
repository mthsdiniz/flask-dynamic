const map = L.map('map').setView([51.505, -0.09], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

const drawnItems = new L.FeatureGroup();
const tiffLayers = [];
map.addLayer(drawnItems);

const drawControl = new L.Control.Draw({
    draw: {
        polyline: true,
        polygon: true,
        circle: true,
        marker: true,
        circlemarker: false,
        rectangle: true
    },
    edit: {
        featureGroup: drawnItems
    }
});
map.addControl(drawControl);

map.on('draw:created', function (e) {
    const layer = e.layer;
    drawnItems.addLayer(layer);
});

document.getElementById('save-map').addEventListener('click', function () {
    const name = prompt("Enter a name for your map:");
    if (name) {
        const vectorLayers = JSON.stringify(drawnItems.toGeoJSON());
        const tiffLayersStr = JSON.stringify(tiffLayers);
        const zoomLevel = map.getZoom();
        const center = map.getCenter();
        console.log(center)
        console.log(center.lat)
        console.log(center.lng)
        $.post('/save_map', { name, vector_layers: vectorLayers, tiff_layers: tiffLayersStr, zoom_level: zoomLevel, center_lat: center.lat, center_lng: center.lng }, function (data) {
            if (data.status === 'success') {
                alert("Map saved successfully!");
                location.reload();
            }
        });
    }
});



document.getElementById('load-map').addEventListener('click', async function () {
    const mapId = document.getElementById('saved-maps').value;
    if (mapId) {
        $.get('/load_map', { map_id: mapId }, async function (data) {
            drawnItems.clearLayers();
            const zoomLevel = parseInt(data.zoom_level);
            const centerLat = parseFloat(data.center_lat);
            const centerLng = parseFloat(data.center_lng);
            map.setView([centerLat, centerLng], zoomLevel);
            const vectorLayers = JSON.parse(data.vector_layers)
            L.geoJSON(vectorLayers).eachLayer(function (layer) {
                drawnItems.addLayer(layer);
            });

            const tiffLayers = JSON.parse(data.tiff_layers);
            for (const layerInfo of tiffLayers) {
                fetch("/fetch_geotiff", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ url: layerInfo.url }),
                })
                    .then(response => response.arrayBuffer())
                    .then(arrayBuffer => {
                        parseGeoraster(arrayBuffer).then(georaster => {
                            console.log("georaster:", georaster);
                            var layer = new GeoRasterLayer({
                                georaster: georaster,
                                opacity: 0.7
                            });
                            layer.addTo(map);
            
                            map.fitBounds(layer.getBounds());
            
                        });
                    });
            
            }
        });
    }
});

document.getElementById('add-tiff').addEventListener('click', async function () {
    const url = prompt('Enter the GeoTIFF file URL:');

    fetch("/fetch_geotiff", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url }),
    })
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
            parseGeoraster(arrayBuffer).then(georaster => {
                console.log("georaster:", georaster);
                var layer = new GeoRasterLayer({
                    georaster: georaster,
                    opacity: 0.7
                });
                layer.addTo(map);

                map.fitBounds(layer.getBounds());

            });
        });

    const tiffLayerInfo = {
        url: url
    };
    tiffLayers.push(tiffLayerInfo);
});


