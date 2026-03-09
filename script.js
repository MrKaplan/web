// 1. Configuração do Mapa
const map = L.map('map').setView([39.5, -8.5], 6);

// Fundo Escuro para parecer um Radar
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CartoDB'
}).addTo(map);

let markers = {};

async function updatePlanes() {
    const statusEl = document.getElementById('count');
    
    // URL original do OpenSky para Portugal
    const openSkyUrl = 'https://opensky-network.org/api/states/all?lamin=32.0&lomin=-15.0&lamax=42.5&lomax=-6.0';
    
    // USAMOS UM PROXY para evitar o erro de CORS (Segurança do Browser)
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(openSkyUrl)}`;

    try {
        statusEl.innerText = "A ligar à rede...";
        const response = await fetch(proxyUrl);
        const wrapper = await response.json();
        
        // O AllOrigins mete a resposta dentro de .contents, precisamos de converter para JSON
        const data = JSON.parse(wrapper.contents);
        const planes = data.states || [];
        
        statusEl.innerText = `${planes.length} aviões detetados`;

        planes.forEach(s => {
            const icao = s[0];
            const callsign = s[1] ? s[1].trim() : "N/A";
            const lon = s[5];
            const lat = s[6];
            const rot = s[10] || 0; 
            const altitude = s[7] || 0;

            if (lat && lon) {
                if (markers[icao]) {
                    markers[icao].setLatLng([lat, lon]);
                } else {
                    const isTAP = callsign.startsWith("TAP");
                    const color = isTAP ? "#00ff00" : "#ffffff";

                    markers[icao] = L.marker([lat, lon], {
                        icon: L.divIcon({
                            className: 'plane-icon',
                            html: `<div style="transform: rotate(${rot-45}deg); color: ${color}; font-size: 20px; text-shadow: 0 0 3px #000;">✈️</div>`,
                            iconSize: [20, 20]
                        })
                    }).addTo(map).bindPopup(`<b>${callsign}</b><br>Alt: ${altitude}m`);
                }
            }
        });
    } catch (err) {
        console.error("Erro técnico:", err);
        statusEl.innerText = "Erro: API ocupada. Tenta daqui a pouco.";
    }
}

// Atualiza a cada 15 segundos (mais seguro para não seres bloqueado)
setInterval(updatePlanes, 15000);
updatePlanes();
