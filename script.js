const map = L.map('map').setView([39.5, -8.5], 6);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CartoDB'
}).addTo(map);

let markers = {};

async function updatePlanes() {
    const statusEl = document.getElementById('count');
    
    // Bounding box de Portugal (Sem passwords desta vez!)
    const openSkyUrl = 'https://opensky-network.org/api/states/all?lamin=32.0&lomin=-15.0&lamax=42.5&lomax=-6.0';
    
    // Usamos o AllOrigins no modo RAW (devolve o JSON direto sem espinhas e não precisa de preflight)
    const finalUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(openSkyUrl)}`;

    try {
        statusEl.innerText = "A pesquisar aviões...";
        
        // Pedido SIMPLES: Sem headers personalizados para não assustar o CORS
        const response = await fetch(finalUrl);

        if (!response.ok) {
            throw new Error(`Servidor respondeu com erro ${response.status}`);
        }

        const data = await response.json();
        
        if (!data || !data.states) {
            statusEl.innerText = "Sem aviões na zona.";
            return;
        }

        const planes = data.states;
        statusEl.innerText = `${planes.length} aviões detetados`;

        planes.forEach(s => {
            const icao = s[0];
            const callsign = s[1] ? s[1].trim() : "N/A";
            const lon = s[5];
            const lat = s[6];
            const rot = s[10] || 0; 
            const alt = s[7] || 0;

            if (lat && lon) {
                if (markers[icao]) {
                    // Atualiza a posição
                    markers[icao].setLatLng([lat, lon]);
                } else {
                    // Se for TAP, pinta de verde. Se não, branco.
                    const isTAP = callsign.startsWith("TAP");
                    const color = isTAP ? "#00ff00" : "#ffffff";

                    markers[icao] = L.marker([lat, lon], {
                        icon: L.divIcon({
                            className: 'plane-icon',
                            html: `<div style="transform: rotate(${rot-45}deg); color: ${color}; font-size: 20px; text-shadow: 0 0 3px #000;">✈️</div>`,
                            iconSize: [20, 20]
                        })
                    }).addTo(map).bindPopup(`<b>${callsign}</b><br>Alt: ${alt}m`);
                }
            }
        });
    } catch (err) {
        console.error("Erro no Radar:", err);
        statusEl.innerText = "Radar ocupado. A tentar novamente em 30s...";
    }
}

// 30 segundos de intervalo. É o "sweet spot" para não sermos bloqueados pelos proxies públicos.
setInterval(updatePlanes, 30000);
updatePlanes();
