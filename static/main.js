const map = L.map('map').setView([51.505, -0.09], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

const drawnItems = new L.FeatureGroup();
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
        const rasterLayersStr = JSON.stringify(rasterLayers);
        const tiffLayersStr = JSON.stringify(tiffLayers);
        $.post('/save_map', { name, vector_layers: vectorLayers, raster_layers: rasterLayersStr, tiff_layers: tiffLayersStr }, function (data) {
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
            // Load vector and raster layers as before

            const tiffLayers = JSON.parse(data.tiff_layers);
            for (const layerInfo of tiffLayers) {
                const response = await fetch(layerInfo.url);
                const arrayBuffer = await response.arrayBuffer();
                const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
                const image = await tiff.getImage();
                const rasterData = await image.readRasters();
                const bbox = image.getBoundingBox();
                const plot = new plotty.plot({
                    data: rasterData[0],
                    width: image.getWidth(),
                    height: image.getHeight(),
                    domain: [0, 255],
                    colorScale: 'viridis'
                });

                const tiffLayer = L.imageOverlay.canvas({ opacity: 0.7 });
                tiffLayer.setBounds([
                    [bbox[1], bbox[0]],
                    [bbox[3], bbox[2]]
                ]);
                tiffLayer.on('add', () => {
                    const ctx = tiffLayer._ctx;
                    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                    ctx.drawImage(plot.render(), 0, 0, ctx.canvas.width, ctx.canvas.height);
                });
                tiffLayer.addTo(map);
            }
        });
    }
});



function addRasterLayer() {
    const url = prompt('Enter the WMS URL for the raster layer:');
    const layerName = prompt('Enter the layer name for the raster layer:');
    const rasterLayer = L.tileLayer.wms(url, {
        layers: layerName,
        format: 'image/png',
        transparent: true
    }).addTo(map);

    const rasterLayerInfo = {
        url: url,
        name: layerName
    };
    rasterLayers.push(rasterLayerInfo);
}

document.getElementById('add-raster').addEventListener('click', addRasterLayer);

async function addTiffLayer() {
    const url = prompt('Enter the GeoTIFF file URL:');
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer);
    const image = await tiff.getImage();
    const rasterData = await image.readRasters();
    const bbox = image.getBoundingBox();
    const plot = new plotty.plot({
        data: rasterData[0],
        width: image.getWidth(),
        height: image.getHeight(),
        domain: [0, 255],
        colorScale: 'viridis'
    });

    const tiffLayer = L.imageOverlay.canvas({ opacity: 0.7 });
    tiffLayer.setBounds([
        [bbox[1], bbox[0]],
        [bbox[3], bbox[2]]
    ]);
    tiffLayer.on('add', () => {
        const ctx = tiffLayer._ctx;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.drawImage(plot.render(), 0, 0, ctx.canvas.width, ctx.canvas.height);
    });
    tiffLayer.addTo(map);

    const tiffLayerInfo = {
        url: url
    };
    tiffLayers.push(tiffLayerInfo);
}

document.getElementById('add-tiff').addEventListener('click', addTiffLayer);


