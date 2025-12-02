# 🎯 Green4Bikes Agent Visualization - Implementation Documentation

## 📋 Übersicht

Die Agent-Visualisierung für das SimulationTool ermöglicht die Darstellung und Analyse von agentenbasierten Modellen wie Green4Bikes im Masterportal.

## 🏗️ Architektur

### Komponenten-Struktur

```
addons/simulationTool/
├── components/
│   └── AgentVisualization/
│       ├── AgentVisualization.vue       # Hauptkomponente
│       ├── TimeSlider.vue               # Zeit-Slider Control
│       └── AgentHistogram.vue           # Histogramm-Visualisierung
```

### Vuex Store Erweiterung

Der Store wurde um folgende State-Properties erweitert:

```javascript
{
  agentData: null,              // GeoJSON FeatureCollection
  agentTimeSteps: [],           // Array von Zeitstempeln
  agentCurrentTimeStep: 0,      // Aktueller Zeitschritt-Index
  agentIsPlaying: false         // Animation-Status
}
```

## 🎨 UI-Design (angelehnt an Green4Bikes)

### Dunkles Design-Schema
- Hintergrund: `#2d2d2d`
- Primärfarbe: `#0d6efd` (Blau für Walking)
- Akzentfarbe: `#ffc107` (Gelb/Orange für Bike)

### Komponenten-Layout

1. **Datenquelle-Sektion**
   - File-Upload für GeoJSON
   - Unterstützt `.json` und `.geojson`

2. **Zeit-Controls**
   - Aktueller Zeitstempel
   - Anzahl Agenten am aktuellen Zeitpunkt
   - Play/Pause/Reset Buttons

3. **Zeit-Slider**
   - Horizontaler Range-Slider
   - Zeitstempel-Labels (Start/Ende)
   - Schritt-Anzeige

4. **Histogramm**
   - Vertikale Balken für Agenten-Anzahl pro Zeitschritt
   - Aktiver Zeitschritt hervorgehoben
   - Interaktiv: Klick auf Balken springt zu Zeitschritt

5. **Agent-Popup**
   - Overlay mit Agentendetails
   - Zeigt alle Properties strukturiert
   - Farbcodierung nach Modus

## 📊 Datenstruktur

### Input-Format (GeoJSON FeatureCollection)

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "uuid",
      "geometry": {
        "type": "Point",
        "coordinates": [lon, lat]
      },
      "properties": {
        "time": "2024-12-01T06:54:58",
        "activeCapability": "walking",
        "hasBike": false,
        "velocity": 128.0,
        "routeLength": 764,
        "startX": 9.9871464E7,
        "startY": 5.34563488E8,
        "goalX": 9.9906103E7,
        "goalY": 5.3452216E7,
        "step": 598
      }
    }
  ]
}
```

## 🔧 Technische Implementierung

### 1. Daten-Indexierung

```javascript
processAgentData(featureCollection) {
  // Erstelle Zeit-Index für schnellen Zugriff
  this.timeIndex = {};
  
  featureCollection.features.forEach(feature => {
    const time = feature.properties.time;
    if (!this.timeIndex[time]) {
      this.timeIndex[time] = [];
    }
    this.timeIndex[time].push(feature);
  });
  
  // Sortiere Zeitschritte
  this.timeSteps = Array.from(new Set(times)).sort();
}
```

### 2. Layer-Management

```javascript
initializeLayer() {
  const layer = layerFactory.createLayer({
    typ: "VECTORBASE",
    id: "green4bikes-agents",
    name: "Green4Bikes Agents"
  });
  layer.layer.setZIndex(9999999);
  layerCollection.addLayer(layer);
}
```

### 3. Feature-Styling

```javascript
getAgentStyle(properties) {
  let color = [100, 100, 100]; // default gray
  
  if (properties.activeCapability === "walking") {
    color = [66, 135, 245]; // blue
  } else if (properties.activeCapability === "bike" || properties.hasBike) {
    color = [255, 153, 0]; // orange
  }
  
  return new Style({
    image: new Circle({
      radius: 6,
      fill: new Fill({color: [...color, 0.8]}),
      stroke: new Stroke({color: "#fff", width: 1.5})
    })
  });
}
```

### 4. Animation-Logik

```javascript
play() {
  this.isPlaying = true;
  this.playInterval = setInterval(() => {
    if (this.currentTimeStep < this.timeSteps.length - 1) {
      this.currentTimeStep++;
      this.updateVisualization();
    } else {
      this.pause();
    }
  }, this.playSpeed); // 1000ms = 1 Sekunde pro Schritt
}
```

### 5. Click-Interaktion

```javascript
initializeLayer() {
  this.selectInteraction = new Select({
    style: this.getHighlightStyle(),
    layers: [this.agentLayer.layer],
    condition: singleClick
  });
  
  this.selectInteraction.on("select", this.onAgentSelect);
  this.addInteraction(this.selectInteraction);
}
```

## 🚀 Performance-Optimierung

### Strategien

1. **Zeit-Indexierung**
   - Features werden nach Zeit vorindexiert
   - Kein Durchsuchen der gesamten Collection bei jedem Schritt

2. **Feature-Caching**
   - Zeitindex bleibt im Speicher
   - Nur Sichtbarkeits-Update, kein Neu-Parsing

3. **Layer-Clearing**
   - Effizientes Clear/Add statt vollständigem Neu-Rendering

4. **Interval-basierte Animation**
   - Nutzt `setInterval` statt `requestAnimationFrame` für Kontrolle

## 🎯 Integration ins SimulationTool

### Routing

```javascript
// SimulationTool.vue
<AgentVisualization v-if="mode === 'agentVisualization'" />
```

### SideMenu-Eintrag

```vue
<button
  class="btn btn-link"
  :class="{ active: mode === 'agentVisualization' }"
  :title="$t('additional:modules.tools.simulationTool.agentVisualization')"
  @click="() => setMode('agentVisualization')"
>
  <i class="bi bi-people-fill" />
</button>
```

## 🌐 Internationalisierung

Neue Translation-Keys:

```json
{
  "agentVisualization": "Agent Visualization",
  "agentDistribution": "Agent Distribution",
  "loadAgentData": "Load Agent Data",
  "currentTime": "Current Time",
  "agents": "Agents",
  "play": "Play",
  "pause": "Pause",
  "reset": "Reset"
}
```

## 📝 Nutzungsanleitung

### Workflow

1. **Addon öffnen** → Click auf "Agent Visualization" Icon im SideMenu
2. **Daten laden** → Upload GeoJSON-Datei mit Agenten-Features
3. **Zeitschritt wählen** → Slider bewegen oder Play-Button drücken
4. **Agenten inspizieren** → Auf Punkt klicken für Details
5. **Analyse** → Histogramm zeigt Agentenverteilung über Zeit

### Beispiel-Daten laden

```javascript
// Programmatisch laden (z.B. aus API)
this.loadAgentData(urlOrFeatureCollection);

// Via File-Upload
// Nutzer lädt .json/.geojson Datei hoch
```

## 🔮 Erweiterungsmöglichkeiten

### Mögliche Features

1. **Trajektorien-Anzeige**
   - Linien zwischen aufeinanderfolgenden Positionen

2. **Filter-Optionen**
   - Nach Modus (Walking/Bike)
   - Nach Geschwindigkeit
   - Nach Route-Länge

3. **Heatmap-Modus**
   - Dichte-Visualisierung statt Punkten

4. **Export-Funktion**
   - Screenshot des aktuellen Zeitschritts
   - Video-Export der Animation

5. **Multi-Szenario-Vergleich**
   - Zwei Simulationen parallel anzeigen

## 🐛 Bekannte Limitationen

1. **Große Datensätze**: Bei >10.000 Agenten kann Performance leiden
   → Lösung: Clustering oder Vereinfachung implementieren

2. **Browser-Memory**: Gesamte FeatureCollection im RAM
   → Lösung: Lazy-Loading für sehr große Zeitreihen

3. **Zeitstempel-Format**: Muss als String vorhanden sein
   → Lösung: Automatische Konvertierung verschiedener Formate

## 📚 Abhängigkeiten

- OpenLayers 9.x
- Vue 3.x
- Bootstrap Icons
- Masterportal Core (layerFactory, layerCollection)

---

**Status**: ✅ Implementierung abgeschlossen
**Version**: 1.0.0
**Autor**: GitHub Copilot
**Datum**: 2025-12-01
