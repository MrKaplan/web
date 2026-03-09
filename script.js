const map = L.map('map').setView([39.5, -8.5], 6);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CartoDB'
}).addTo(map);

let markers = {};

async function updatePlanes() {
    const statusEl = document.getElementById('count');
    
    // 1. Configura os teus dados
    const user = "faginea";
    const pass = "Pardinus2000"; // <--- Mete a tua pass aqui
    const auth = btoa(`${user}:${pass}`);

    // Bounding box de Portugal
    const openSkyUrl = 'https://opensky-network.org/api/states/all?lamin=32.0&lomin=-15.0&lamax=42.5&lomax=-6.0';
    
    // 2. USAMOS O CORSPROXY.IO (Simples e eficaz)
    const finalUrl = `https://corsproxy.io/?${encodeURIComponent(openSkyUrl)}`;

    try {
        statusEl.innerText = "A consultar radar...";
        
        const response = await fetch(finalUrl, {
            headers: {
                "Authorization": `Basic ${auth}`
            }
        });

        if (response.status === 429) {
            statusEl.innerText = "Limite atingido. Espera 1 min.";
            return;
        }

        const data = await response.json();
        const planes = data.states || [];
        
        statusEl.innerText = `${planes.length} aviões (Conta: faginea)`;

        planes.forEach(s => {
            const icao = s[0];
            const callsign = s[1] ? s[1].trim() : "N/A";
            const lon = s[5];
            const lat = s[6];
            const rot = s[10] || 0; 
            const alt = s[7] || 0;

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
                    }).addTo(map).bindPopup(`<b>${callsign}</b><br>Alt: ${alt}m`);
                }
            }
        });
    } catch (err) {
        console.error(err);
        statusEl.innerText = "Erro na rede. A tentar novamente...";
    }
}

// Aumenta para 20 segundos para não seres bloqueado por "Too many requests"
setInterval(updatePlanes, 20000);
updatePlanes();
