const DATASETS = [
  { city: "Armenia", indicator: "Estrato promedio", file: "lisa_estrato_promedio_armenia.geojson" },
  { city: "Armenia", indicator: "Educacion", file: "lisa_ind_educacion_armenia.geojson" },
  { city: "Armenia", indicator: "Laboral", file: "lisa_ind_laboral_armenia.geojson" },
  { city: "Armenia", indicator: "Multidimensional", file: "lisa_ind_multidim_armenia.geojson" },
  { city: "Armenia", indicator: "Pobreza habitacional", file: "lisa_ind_pobreza_hab_armenia.geojson" },
  { city: "Armenia", indicator: "Servicios", file: "lisa_ind_servicios_armenia.geojson" },
  { city: "Cali", indicator: "Estrato promedio", file: "lisa_estrato_promedio_cali.geojson" },
  { city: "Cali", indicator: "Educacion", file: "lisa_ind_educacion_cali.geojson" },
  { city: "Cali", indicator: "Laboral", file: "lisa_ind_laboral_cali.geojson" },
  { city: "Cali", indicator: "Multidimensional", file: "lisa_ind_multidim_cali.geojson" },
  { city: "Cali", indicator: "Pobreza habitacional", file: "lisa_ind_pobreza_hab_cali.geojson" },
  { city: "Cali", indicator: "Servicios", file: "lisa_ind_servicios_cali.geojson" },
  { city: "Pereira", indicator: "Estrato promedio", file: "lisa_estrato_promedio_pereira.geojson" },
  { city: "Pereira", indicator: "Educacion", file: "lisa_ind_educacion_pereira.geojson" },
  { city: "Pereira", indicator: "Laboral", file: "lisa_ind_laboral_pereira.geojson" },
  { city: "Pereira", indicator: "Multidimensional", file: "lisa_ind_multidim_pereira.geojson" },
  { city: "Pereira", indicator: "Pobreza habitacional", file: "lisa_ind_pobreza_hab_pereira.geojson" },
  { city: "Pereira", indicator: "Servicios", file: "lisa_ind_servicios_pereira.geojson" },
];

const CLUSTER_COLORS = {
  "High-High": "#d73027",
  "Low-Low": "#4575b4",
  "Low-High": "#74add1",
  "High-Low": "#f46d43",
  "Not Significant": "#a8a8a8",
  "Not significant": "#a8a8a8",
};

const QUADRANT_COLORS = {
  1: "#d73027",
  2: "#74add1",
  3: "#4575b4",
  4: "#f46d43",
  0: "#a8a8a8",
};

const citySelect = document.querySelector("#citySelect");
const indicatorSelect = document.querySelector("#indicatorSelect");
const colorMode = document.querySelector("#colorMode");
const numericGroup = document.querySelector("#numericGroup");
const numericField = document.querySelector("#numericField");
const significantOnly = document.querySelector("#significantOnly");
const pValueMax = document.querySelector("#pValueMax");
const statusEl = document.querySelector("#status");
const featureCount = document.querySelector("#featureCount");
const fileName = document.querySelector("#fileName");
const distribution = document.querySelector("#distribution");
const attributeTable = document.querySelector("#attributeTable");
const downloadLink = document.querySelector("#downloadLink");

let currentData = null;
let currentLayer = null;
let visibleData = null;
let numericRange = null;
let downloadUrl = null;

const map = L.map("map", {
  preferCanvas: true,
  zoomControl: true,
}).setView([4.57, -74.29], 6);

map.createPane("featuresPane");
map.getPane("featuresPane").style.zIndex = 650;
const canvasRenderer = L.canvas({ padding: 0.5, pane: "featuresPane" });

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

function setStatus(message) {
  statusEl.textContent = message;
}

function refreshMapSize() {
  map.invalidateSize({ pan: false });
  requestAnimationFrame(() => map.invalidateSize({ pan: false }));
  window.setTimeout(() => map.invalidateSize({ pan: false }), 120);
}

function unique(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "es"));
}

function parseNumber(value) {
  if (typeof value === "number") return value;
  if (value === null || value === undefined || value === "") return NaN;
  return Number(String(value).replace(",", "."));
}

function selectedDataset() {
  return DATASETS.find(
    (item) => item.city === citySelect.value && item.indicator === indicatorSelect.value
  );
}

function fillSelect(select, values) {
  select.innerHTML = "";
  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function populateCities() {
  fillSelect(citySelect, unique(DATASETS.map((item) => item.city)));
}

function populateIndicators() {
  const indicators = DATASETS.filter((item) => item.city === citySelect.value).map((item) => item.indicator);
  fillSelect(indicatorSelect, unique(indicators));
}

function propertyKeys(data) {
  const first = data.features.find((feature) => feature.properties);
  return first ? Object.keys(first.properties) : [];
}

function getNumericFields(data) {
  const keys = propertyKeys(data);
  return keys.filter((key) =>
    data.features.some((feature) => Number.isFinite(parseNumber(feature.properties?.[key])))
  );
}

function updateNumericFields() {
  const fields = currentData ? getNumericFields(currentData) : [];
  fillSelect(numericField, fields);
  numericGroup.style.display = colorMode.value === "numeric" ? "grid" : "none";
}

function isVisibleFeature(feature) {
  if (!significantOnly.checked) return true;
  const pValue = parseNumber(feature.properties?.p_value);
  const maxValue = parseNumber(pValueMax.value);
  return Number.isFinite(pValue) && pValue <= maxValue;
}

function filteredFeatures() {
  if (!currentData) return [];
  return currentData.features.filter(isVisibleFeature);
}

function computeNumericRange(features) {
  const field = numericField.value;
  const values = features
    .map((feature) => parseNumber(feature.properties?.[field]))
    .filter((value) => Number.isFinite(value));
  if (!values.length) return { min: 0, max: 1 };
  return { min: Math.min(...values), max: Math.max(...values) };
}

function rampColor(value, min, max) {
  if (!Number.isFinite(value) || min === max) return "#a8a8a8";
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const stops = [
    [237, 248, 251],
    [178, 226, 226],
    [102, 194, 164],
    [44, 162, 95],
    [0, 109, 44],
  ];
  const scaled = t * (stops.length - 1);
  const low = Math.floor(scaled);
  const high = Math.min(low + 1, stops.length - 1);
  const weight = scaled - low;
  const rgb = stops[low].map((channel, index) =>
    Math.round(channel * (1 - weight) + stops[high][index] * weight)
  );
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

function featureColor(feature) {
  const props = feature.properties || {};
  if (colorMode.value === "cluster") {
    return CLUSTER_COLORS[props.lisa_cluster] || "#8c8c8c";
  }
  if (colorMode.value === "quadrant") {
    return QUADRANT_COLORS[String(props.quadrant)] || "#8c8c8c";
  }
  const value = parseNumber(props[numericField.value]);
  return rampColor(value, numericRange.min, numericRange.max);
}

function styleFeature(feature) {
  return {
    color: "#111827",
    weight: 0.7,
    opacity: 0.9,
    fillColor: featureColor(feature),
    fillOpacity: 0.82,
  };
}

function popupContent(properties) {
  const preferred = [
    "COD_DANE_ANM",
    "lisa_cluster",
    "quadrant",
    "p_value",
    "local_I",
    "IND_MULTIDIM",
    "IND_EDUCACION",
    "IND_LABORAL",
    "IND_SERVICIOS",
    "IND_POBREZA_HAB",
    "ESTRATO_PROMEDIO",
  ];
  const keys = Object.keys(properties || {});
  const selected = preferred.filter((key) => keys.includes(key));
  keys.forEach((key) => {
    if (!selected.includes(key) && selected.length < 10) selected.push(key);
  });
  const rows = selected
    .map((key) => `<tr><td>${key}</td><td>${properties[key] ?? ""}</td></tr>`)
    .join("");
  return `<table class="popup-table">${rows}</table>`;
}

function onEachFeature(feature, layer) {
  layer.bindPopup(popupContent(feature.properties || {}));
  layer.on({
    mouseover: () => layer.setStyle({ weight: 1.4, fillOpacity: 0.88 }),
    mouseout: () => currentLayer && currentLayer.resetStyle(layer),
  });
}

function renderMap() {
  if (!currentData) return;
  refreshMapSize();
  if (currentLayer) {
    map.removeLayer(currentLayer);
  }

  const features = filteredFeatures();
  numericRange = computeNumericRange(features);
  visibleData = { ...currentData, features };

  currentLayer = L.geoJSON(visibleData, {
    pane: "featuresPane",
    renderer: canvasRenderer,
    style: styleFeature,
    onEachFeature,
  }).addTo(map);

  const bounds = currentLayer.getBounds();
  window.setTimeout(() => {
    refreshMapSize();
    if (features.length && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 14 });
    }
  }, 80);

  updateMetrics(features);
  renderDistribution(features);
  renderTable(features);
  updateDownload();
}

function updateMetrics(features) {
  const dataset = selectedDataset();
  featureCount.textContent = features.length.toLocaleString("es-CO");
  fileName.textContent = dataset ? dataset.file : "-";
}

function renderDistribution(features) {
  const field = currentData?.features?.some((feature) => feature.properties?.lisa_cluster)
    ? "lisa_cluster"
    : "quadrant";
  const counts = new Map();
  features.forEach((feature) => {
    const value = feature.properties?.[field] ?? "Sin dato";
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map((entry) => entry[1]));
  distribution.innerHTML = entries
    .map(([label, count]) => {
      const width = Math.round((count / max) * 100);
      const color = CLUSTER_COLORS[label] || QUADRANT_COLORS[String(label)] || "#0f766e";
      return `
        <div class="dist-row">
          <div>
            <strong>${label}</strong>
            <div class="dist-bar"><div class="dist-fill" style="width:${width}%; background:${color}"></div></div>
          </div>
          <span>${count.toLocaleString("es-CO")}</span>
        </div>
      `;
    })
    .join("");
}

function renderTable(features) {
  const rows = features.slice(0, 250);
  const keys = propertyKeys({ features: rows });
  if (!rows.length || !keys.length) {
    attributeTable.innerHTML = "<tbody><tr><td>No hay registros visibles.</td></tr></tbody>";
    return;
  }
  const head = `<thead><tr>${keys.map((key) => `<th>${key}</th>`).join("")}</tr></thead>`;
  const body = rows
    .map((feature) => {
      const props = feature.properties || {};
      return `<tr>${keys.map((key) => `<td>${props[key] ?? ""}</td>`).join("")}</tr>`;
    })
    .join("");
  attributeTable.innerHTML = `${head}<tbody>${body}</tbody>`;
}

function updateDownload() {
  if (!visibleData) return;
  if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  const blob = new Blob([JSON.stringify(visibleData)], { type: "application/geo+json" });
  downloadUrl = URL.createObjectURL(blob);
  downloadLink.href = downloadUrl;
  const dataset = selectedDataset();
  downloadLink.download = dataset ? dataset.file.replace(".geojson", "_filtrado.geojson") : "geojson_filtrado.geojson";
}

async function loadCurrentDataset() {
  const dataset = selectedDataset();
  if (!dataset) return;

  setStatus("Cargando...");
  if (currentLayer) {
    map.removeLayer(currentLayer);
    currentLayer = null;
  }
  attributeTable.innerHTML = "";

  try {
    const response = await fetch(`data/${dataset.file}`);
    if (!response.ok) throw new Error(`No se pudo cargar ${dataset.file}`);
    currentData = await response.json();
    updateNumericFields();
    renderMap();
    setStatus("Listo");
  } catch (error) {
    console.error(error);
    setStatus("Error");
    alert("No se pudo cargar el GeoJSON. En local abre el proyecto con un servidor web, no con doble clic.");
  }
}

citySelect.addEventListener("change", () => {
  populateIndicators();
  loadCurrentDataset();
});
indicatorSelect.addEventListener("change", loadCurrentDataset);
colorMode.addEventListener("change", () => {
  updateNumericFields();
  renderMap();
});
numericField.addEventListener("change", renderMap);
significantOnly.addEventListener("change", renderMap);
pValueMax.addEventListener("input", renderMap);

populateCities();
populateIndicators();
window.addEventListener("resize", refreshMapSize);
window.addEventListener("load", refreshMapSize);
loadCurrentDataset();
