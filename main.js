const espIP = "8fb7-200-6-182-114.ngrok-free.app";  // IP de tu ESP32
const pesoIdeal = 20.0;         // <-- Peso objetivo

const ws = new WebSocket(`wss://${espIP}/ws`);
const cont = document.getElementById("basculas");
const info = document.getElementById("info");

// Gráfico principal de pesos
const pesoChart = new Chart(document.getElementById('pesoChart').getContext('2d'), {
    type: 'line',
    data: {
    datasets: [{
        label: 'Mejor Peso Encontrado',
        data: [],
        fill: false,
        tension: 0.1,
        borderColor: '#007bff'
    }]
    },
    options: {
    animation: false,
    responsive: true,
    scales: {
        x: {
        type: 'time',
        time: { unit: 'second', tooltipFormat: 'HH:mm:ss' },
        title: { display: true, text: 'Hora' }
        },
        y: { title: { display: true, text: 'Peso' } }
    }
    }
});

// Nuevo gráfico de diferencias
const diffChart = new Chart(document.getElementById('diffChart').getContext('2d'), {
    type: 'line',
    data: {
    datasets: [{
        label: 'Diferencia con Peso Ideal',
        data: [],
        fill: false,
        tension: 0.1,
        borderColor: '#ff0000'
    }]
    },
    options: {
    animation: false,
    responsive: true,
    scales: {
        x: {
        type: 'time',
        time: { unit: 'second', tooltipFormat: 'HH:mm:ss' },
        title: { display: true, text: 'Hora' }
        },
        y: { title: { display: true, text: 'Diferencia (kg)' } }
    }
    }
});

ws.onopen = () => {
    info.textContent = "Conectado. Esperando datos...";
};

ws.onmessage = (evt) => {
    const data = JSON.parse(evt.data);

    // 1) Mostrar básculas
    cont.innerHTML = "";
    data.basculas.forEach((p, i) => {
    const div = document.createElement("div");
    div.className = "b";
    if (data.combinacion.includes(i)) div.classList.add("highlight");
    div.innerHTML = `B${i}<br>${p.toFixed(1)}`;
    cont.appendChild(div);
    });

    // 2) Mostrar info
    info.innerHTML =
    `<b>Mejor combinación:</b> [${data.combinacion.join(", ")}]<br>` +
    `<b>Peso total:</b> ${data.mejorPeso.toFixed(2)}<br>` +
    `<b>Diferencia con ideal:</b> ${(data.mejorPeso - pesoIdeal).toFixed(2)}<br>` +
    `<b>Uso de:</b> ${data.mejorTamano} básculas`;

    // 3) Añadir puntos al histórico de peso y diferencia
    const now = new Date();

    pesoChart.data.datasets[0].data.push({ x: now, y: data.mejorPeso });
    diffChart.data.datasets[0].data.push({ x: now, y: data.mejorPeso - pesoIdeal });

    // 4) Mantener últimos 30 puntos
    if (pesoChart.data.datasets[0].data.length > 30) pesoChart.data.datasets[0].data.shift();
    if (diffChart.data.datasets[0].data.length > 30) diffChart.data.datasets[0].data.shift();

    pesoChart.update('none');
    diffChart.update('none');
};

ws.onerror = (err) => {
    info.textContent = "Error WS: " + err;
};

ws.onclose = () => {
    info.textContent = "Conexión cerrada.";
};