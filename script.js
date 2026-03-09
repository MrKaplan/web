const map = L.map('map').setView([39.5, -8.5], 6);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CartoDB'
}).addTo(map);

let markers = {};

async function updatePlanes() {
    const statusEl = document.getElementById('count');
    
    const user = "faginea";
    const pass = "Pardinus2000"; // <--- Garante que a pass está correta
    const auth = btoa(`${user}:${pass}`);

    const openSkyUrl = 'https://opensky-network.org/api/states/all?lamin=32.0&lomin=-15.0&lamax=42.5&lomax=-6.0';
    
    // MUDANÇA DE PROXY: Usamos agora o CodeTabs que é mais robusto
    const finalUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(openSkyUrl)}`;

    try {
        statusEl.innerText = "A consultar radar (via CodeTabs)...";
        
        const response = await fetch(finalUrl, {
            headers: {
                "Authorization": `Basic ${auth}`
            }
        });

        // Se a resposta não for OK, nem tentamos ler o JSON
        if (!response.ok) {
            throw new Error(`Servidor respondeu com erro ${response.status}`);
        }

        const data = await response.json();
        
        // Verificação extra se temos dados válidos
        if (!data || !data.states) {
            statusEl.innerText = "Sem aviões na zona de momento.";
            return;
        }

        const planes = data.states;
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
        console.error("Erro no Radar:", err);
        statusEl.innerText = "Erro na rede. A tentar novamente em 20s...";
    }
}

// 20 segundos para respeitar os limites da API
setInterval(updatePlanes, 20000);
updatePlanes();
