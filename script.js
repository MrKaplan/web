var map = L.map('map').setView([38.72, -9.14], 7);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
 attribution: '© OpenStreetMap contributors'
}).addTo(map);

fetch('data/points.geojson')
.then(response => response.json())
.then(data => {

L.geoJSON(data,{
onEachFeature:function(feature,layer){

if(feature.properties && feature.properties.name){

layer.bindPopup(feature.properties.name);

}

}
}).addTo(map);

});
