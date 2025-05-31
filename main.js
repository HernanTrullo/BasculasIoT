const espIP = "5258-200-6-182-114.ngrok-free.app";  // IP de tu ESP32
const pesoIdeal = 20.0;

const ws = new WebSocket(`wss://${espIP}/ws`);
const cont = document.getElementById("basculas");
const info = document.getElementById("info");

// Almacenar los últimos 5 pesos para promedio
const ultimosPesos = [];

// Gráfico principal
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
        y: {
          title: { display: true, text: 'Peso' }
        }
      }
    }
});

ws.onopen = () => {
  info.textContent = "Conectado. Esperando datos...";
};

ws.onmessage = (evt) => {
  const data = JSON.parse(evt.data);
  const now = new Date();

  // 1) Mostrar básculas
  cont.innerHTML = "";
  data.basculas.forEach((p, i) => {
    const div = document.createElement("div");
    div.className = "b";
    if (data.combinacion.includes(i)) div.classList.add("highlight");
    div.innerHTML = `B${i}<br>${p.toFixed(1)}`;
    cont.appendChild(div);
  });

  // 2) Calcular promedio de últimos 5 pesos
  ultimosPesos.push(data.mejorPeso);
  if (ultimosPesos.length > 10) ultimosPesos.shift();
  const suma = ultimosPesos.reduce((a, b) => a + b, 0);
  const promedio = suma / ultimosPesos.length;

  // 3) Mostrar info
  info.innerHTML =
    `<b>Mejor combinación:</b> [${data.combinacion.join(", ")}]<br>` +
    `<b>Peso total:</b> ${data.mejorPeso.toFixed(2)}<br>` +
    `<b>Diferencia con ideal:</b> ${(data.mejorPeso - pesoIdeal).toFixed(2)}<br>` +
    `<b>Promedio pesos:</b> ${promedio.toFixed(2)}<br>` +
    `<b>Uso de:</b> ${data.mejorTamano} básculas<br>` +
    `<small>Última actualización: ${now.toLocaleTimeString()}</small>`;

  // 4) Actualizar gráfico
  pesoChart.data.datasets[0].data.push({ x: now, y: data.mejorPeso });
  if (pesoChart.data.datasets[0].data.length > 30) pesoChart.data.datasets[0].data.shift();
  pesoChart.update('none');
};

ws.onerror = (err) => {
  info.textContent = "Error WS: " + err;
};

ws.onclose = () => {
  info.textContent = "Conexión cerrada.";
};