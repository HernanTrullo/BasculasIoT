const espIP = "5258-200-6-182-114.ngrok-free.app";  // IP de tu ESP32
const pesoIdeal = 20.0;

const ws = new WebSocket(`wss://${espIP}/ws`);
const cont = document.getElementById("basculas");
const info = document.getElementById("info");

// Almacenar los últimos 5 pesos para promedio
const ultimosPesos = [];
const ultimosTiempos = [];  // para contar paquetes por minuto

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

  // Registrar tiempo de llegada
    ultimosTiempos.push(now);

    // Filtrar solo los de los últimos 60 segundos
    const haceUnMinuto = new Date(now.getTime() - 60 * 1000);
    const tiemposFiltrados = ultimosTiempos.filter(t => t >= haceUnMinuto);
    ultimosTiempos.length = 0;
    ultimosTiempos.push(...tiemposFiltrados);

    const paquetesPorMinuto = tiemposFiltrados.length;

  // Mostrar básculas
  cont.innerHTML = "";
  data.basculas.forEach((p, i) => {
    const div = document.createElement("div");
    div.className = "b";
    if (data.combinacion.includes(i)) div.classList.add("highlight");
    div.innerHTML = `B${i}<br>${p.toFixed(1)}`;
    cont.appendChild(div);
  });

  // Calcular promedio de últimos 5 pesos
  ultimosPesos.push(data.mejorPeso);
  if (ultimosPesos.length > 30) ultimosPesos.shift();
  const promedio = ultimosPesos.reduce((a, b) => a + b, 0) / ultimosPesos.length;

  // calcular porcentaje de error
  const peso_objetivo = 20;
  const peso_encontrado = data.mejorPeso.toFixed(2);
  const porcentaje_error = 100*(promedio -peso_objetivo)/peso_objetivo 

  // Mostrar info separada por ítems
  info.innerHTML = ""; // limpiar
  const items = [
    { label: "Mejor combinación", value: `[${data.combinacion.join(", ")}]` },
    { label: "Peso objetivo", value: `${peso_objetivo} g` },
    { label: "Peso encontrado", value: `${data.mejorPeso.toFixed(2)} g` },
    { label: "Porcentaje de error", value: `${porcentaje_error.toFixed(2)} %` },
    { label: "Promedio pesos", value: `${promedio.toFixed(2)} g` },
    { label: "Uso de básculas", value: `${data.mejorTamano}` },
    { label: "Paquetes/minuto", value: `${paquetesPorMinuto} paq` },
  ];

  items.forEach(({ label, value }) => {
    const div = document.createElement("div");
    div.className = "infoItem";
    div.innerHTML = `<strong>${label}</strong><br>${value}`;
    info.appendChild(div);
  });

  // Actualizar gráfico
  pesoChart.data.datasets[0].data.push({ x: now, y: data.mejorPeso });
  if (pesoChart.data.datasets[0].data.length > 30) pesoChart.data.datasets[0].data.shift();
  pesoChart.update('none');
};