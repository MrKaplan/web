// Configuração do Mapa centrado em Portugal
const map = L.map('map').setView([39.5, -8.5], 6);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

let markers = {};

// Coordenadas da Bounding Box (Portugal + Margem para ver aproximações)
// [lamin, lomin, lamax, lomax]
const BBOX = "35.0,-12.0,43.0,-6.0"; 

async function updatePlanes() {
    try {
        // Pedido à API do OpenSky filtrado pela nossa área
        const response = await fetch(`https://opensky-network.org/api/states/all?lamin=35.0&lomin=-12.0&lamax=43.0&lomax=-6.0`);
        const data = await response.json();
        
        const planes = data.states || [];
        document.getElementById('count').innerText = `${planes.length} aviões na zona`;

        planes.forEach(s => {
            const icao = s[0];
            const callsign = s[1].strip();
            const lat = s[6];
            const lon = s[5];
            const rot = s[10] || 0; // Rotação

            if (lat && lon) {
                if (markers[icao]) {
                    // Atualiza posição se já existir
                    markers[icao].setLatLng([lat, lon]);
                } else {
                    // Cria novo marcador (ícone de avião simples)
                    markers[icao] = L.marker([lat, lon], {
                        icon: L.divIcon({
                            className: 'plane-icon',
                            html: `<div style="transform: rotate(${rot}deg); font-size: 20px;">✈️</div>`
                        })
                    }).addTo(map).bindPopup(`<b>${callsign}</b><br>Alt: ${s[7]}m`);
                }
            }
        });
    } catch (err) {
        console.error("Erro ao obter aviões:", err);
    }
}

// Atualiza a cada 10 segundos
setInterval(updatePlanes, 10000);
updatePlanes();
