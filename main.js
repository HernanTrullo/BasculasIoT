const pesoIdeal = 20.0;

// Conexión a HiveMQ Cloud vía WebSocket seguro (WSS)
const client = mqtt.connect("wss://fb6a5ee0562d42b19e2716f427d8e514.s1.eu.hivemq.cloud:8884/mqtt", {
  username: "readypackers_basculasiot",
  password: "1007587458Matematicas",
  protocol: "wss",
  connectTimeout: 5000,
  reconnectPeriod: 2000,
  clean: true,
  clientId: "webclient_" + Math.random().toString(16).substring(2, 10)
});

const topic = "hernan/basculas/peso"; // Debe coincidir con el que publica la ESP32
const cont = document.getElementById("basculas");
const info = document.getElementById("info");

const ultimosPesos = [];
const ultimosTiempos = [];
let lastPaquetesMinutoUpdate = 0;
let paquetesPorMinuto = 0;

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
      x: { type: 'time', time: { unit: 'second', tooltipFormat: 'HH:mm:ss' }, title: { display: true, text: 'Hora' } },
      y: { title: { display: true, text: 'Peso' } }
    }
  }
});

// Conectado
client.on("connect", () => {
  console.log("Conectado a HiveMQ Cloud");
  info.textContent = "Conectado a HiveMQ. Esperando datos...";
  client.subscribe(topic, err => {
    if (err) console.error("Suscripción fallida:", err);
  });
});

// Recibir mensajes
client.on("message", (topic, message) => {
  const data = JSON.parse(message.toString());
  const now = new Date();
  ultimosTiempos.push(now);
  const hace24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  while (ultimosTiempos.length && ultimosTiempos[0] < hace24h) ultimosTiempos.shift();

  paquetesAcumuladosDia = data.numero_productos_diarios;
  paquetesPorMinuto = data.productos_por_minuto;
  const num_basculas = 14;
  cont.innerHTML = "";
  data.basculas.forEach((p, i) => {
    if (i>=num_basculas) return;
    const div = document.createElement("div");
    div.className = "b";
    if (data.combinacion.includes(i)) div.classList.add("highlight");
    div.innerHTML = `B${i}<br>${p.toFixed(1)}`;
    cont.appendChild(div);
  });

  ultimosPesos.push(data.mejorPeso);
  if (ultimosPesos.length > 30) ultimosPesos.shift();
  const promedio = data.promedio;
  const peso_objetivo = pesoIdeal;
  const peso_encontrado = data.mejorPeso.toFixed(2);
  const porcentaje_error = data.desviacion;

  info.innerHTML = "";
  const items = [
    { label: "Mejor combinación", value: `[${data.combinacion.join(", ")}]` },
    { label: "Peso objetivo", value: `${peso_objetivo} g` },
    { label: "Peso encontrado", value: `${peso_encontrado} g` },
    { label: "Desviación de los últimos 30", value: `${porcentaje_error.toFixed(2)} %` },
    { label: "Promedio peso de los últimos 30", value: `${promedio.toFixed(2)} g` },
    { label: "Uso de básculas", value: `${data.mejorTamano}` },
    { label: "Paquetes/minuto", value: `${paquetesPorMinuto} paq` },
    { label: "Paquetes acumulados por día", value: `${paquetesAcumuladosDia} paq` },
  ];

  items.forEach(({ label, value }) => {
    const div = document.createElement("div");
    div.className = "infoItem";
    div.innerHTML = `<strong>${label}</strong><br>${value}`;
    info.appendChild(div);
  });

  pesoChart.data.datasets[0].data.push({ x: now, y: data.mejorPeso });
  if (pesoChart.data.datasets[0].data.length > 30) pesoChart.data.datasets[0].data.shift();
  pesoChart.update('none');
});
