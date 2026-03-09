// 1. Configuração do Mapa
const map = L.map('map').setView([39.5, -8.5], 6);

// Layer de mapa escuro (estilo radar)
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

let markers = {};

// Função para atualizar os aviões
async function updatePlanes() {
    try {
        // Bounding Box de Portugal: lamin, lomin, lamax, lomax
        const url = `https://opensky-network.org/api/states/all?lamin=32.0&lomin=-32.0&lamax=42.5&lomax=-6.0`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Limite da API atingido ou erro de servidor');
        
        const data = await response.json();
        const planes = data.states || [];
        
        document.getElementById('count').innerText = `${planes.length} aviões detetados`;

        planes.forEach(s => {
            const icao = s[0];
            // JS usa .trim() e não .strip()
            const callsign = s[1] ? s[1].trim() : "N/A";
            const lon = s[5];
            const lat = s[6];
            const rot = s[10] || 0; 
            const altitude = s[7] || 0;

            if (lat && lon) {
                if (markers[icao]) {
                    // Atualiza posição
                    markers[icao].setLatLng([lat, lon]);
                    markers[icao].setRotationAngle ? markers[icao].setRotationAngle(rot) : null;
                } else {
                    // Define se é TAP para mudar a cor ou ícone
                    const isTAP = callsign.startsWith("TAP");
                    const color = isTAP ? "#00ff00" : "#ffffff"; // Verde para TAP, Branco para outros

                    markers[icao] = L.marker([lat, lon], {
                        icon: L.divIcon({
                            className: 'plane-icon',
                            html: `<div style="transform: rotate(${rot-45}deg); color: ${color}; font-size: 20px; text-shadow: 0 0 5px black;">✈️</div>`,
                            iconSize: [20, 20]
                        })
                    }).addTo(map).bindPopup(`<b>${callsign}</b><br>Alt: ${altitude}m`);
                }
            }
        });
    } catch (err) {
        console.error("Erro técnico:", err);
        document.getElementById('count').innerText = "Erro ao carregar dados";
    }
}

// Atualizar a cada 10 segundos
setInterval(updatePlanes, 10000);
updatePlanes();
