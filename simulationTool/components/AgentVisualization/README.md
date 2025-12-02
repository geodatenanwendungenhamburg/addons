# 🚴 Green4Bikes Agent Visualization

Eine Erweiterung des Masterportal SimulationTool für zeitbasierte Agenten-Visualisierung.

## 🎯 Überblick

Diese Komponente ermöglicht die Visualisierung von agentenbasierten Simulationen wie **Green4Bikes** direkt im Masterportal. Sie zeigt Fußgänger und Fahrradfahrer als bewegte Punkte auf der Karte und bietet:

- ⏱️ **Zeit-Slider** mit Play/Pause-Funktion
- 📊 **Histogramm** der Agentenverteilung
- 🎨 **Farbcodierung** nach Fortbewegungsart (Walking/Bike)
- 📍 **Click-Popup** mit detaillierten Agenten-Informationen
- 🚀 **Performance-optimiert** für große Datensätze

## 🚀 Quick Start

### 1. Addon im Masterportal aktivieren

Das SimulationTool muss in der Portal-Konfiguration aktiviert sein:

```json
{
  "secondaryMenu": {
    "sections": [
      {
        "type": "simulationTool"
      }
    ]
  }
}
```

### 2. SimulationTool öffnen

Klicken Sie auf das SimulationTool-Icon im Masterportal-Menü.

### 3. Agent Visualization auswählen

Klicken Sie im SideMenu auf das **People-Icon** (👥).

### 4. Daten laden

**Option A: File Upload**
- Klicken Sie auf "Choose File"
- Wählen Sie eine `.json` oder `.geojson` Datei mit Agenten-Daten

**Option B: Programmatisch**
```javascript
// In Ihrer Anwendung
import {loadAgentsFromUrl} from "./exampleUsage.js";
loadAgentsFromUrl("https://api.example.com/agents.geojson");
```

### 5. Visualisierung steuern

- **Slider bewegen**: Zeitschritt manuell ändern
- **Play**: Animation starten
- **Pause**: Animation anhalten
- **Reset**: Zurück zum ersten Zeitschritt
- **Klick auf Agent**: Details anzeigen

## 📁 Datenformat

### Erforderliche Struktur

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "unique-agent-id",
      "geometry": {
        "type": "Point",
        "coordinates": [longitude, latitude]
      },
      "properties": {
        "time": "2024-12-01T06:54:58Z",
        "activeCapability": "walking",
        "hasBike": false,
        "velocity": 1.28,
        "routeLength": 764,
        "startX": 99871464,
        "startY": 534563488,
        "goalX": 99906103,
        "goalY": 53452216,
        "step": 598
      }
    }
  ]
}
```

### Pflichtfelder

- `geometry.coordinates`: Position des Agenten [lon, lat]
- `properties.time`: Zeitstempel (ISO 8601 String)

### Optionale Felder (für erweiterte Visualisierung)

- `activeCapability`: "walking" | "bike" (für Farbcodierung)
- `hasBike`: boolean
- `velocity`: Geschwindigkeit in m/s
- `routeLength`: Gesamtlänge der Route in Metern
- `startX`, `startY`: Start-Koordinaten
- `goalX`, `goalY`: Ziel-Koordinaten
- `step`: Zeitschritt-Nummer

## 🎨 Styling

### Agent-Farben

- 🔵 **Blau** (`#4287f5`): Fußgänger (walking)
- 🟠 **Orange** (`#ff9900`): Fahrradfahrer (bike)
- ⚪ **Grau** (`#646464`): Keine Angabe

### Highlight-Farbe

- 🟡 **Gelb** (`#ffd700`): Ausgewählter Agent

## 🔧 Konfiguration

### Animation-Geschwindigkeit anpassen

In `AgentVisualization.vue`:

```javascript
data() {
  return {
    playSpeed: 1000  // Millisekunden pro Zeitschritt (Standard: 1000 = 1 Sekunde)
  }
}
```

### Layer-Z-Index ändern

```javascript
layer.layer.setZIndex(9999999);  // Höherer Wert = weiter oben
```

## 📊 Beispiel-Daten

Eine Beispiel-Datei liegt bei: `sampleData.json`

Zum Testen:
1. Öffnen Sie Agent Visualization
2. Laden Sie `sampleData.json` hoch
3. Drücken Sie Play

## 🛠️ API-Integration

### Daten von REST-API laden

```javascript
async function loadFromAPI() {
  const response = await fetch("https://api.simulation.example/agents");
  const data = await response.json();
  
  // Component-Methode aufrufen
  agentVisualizationComponent.loadAgentData(data);
}
```

### Real-Time Streaming

```javascript
import {AgentSimulationStream} from "./exampleUsage.js";

const stream = new AgentSimulationStream(
  "https://api.simulation.example/stream",
  (update) => {
    // Features zur Visualisierung hinzufügen
    agentVisualization.addFeatures(update.features);
  }
);

stream.connect();
```

## 🐛 Troubleshooting

### Problem: Keine Agenten sichtbar

**Lösung**:
- Prüfen Sie, ob `time`-Property in allen Features vorhanden ist
- Überprüfen Sie Koordinaten-Format (WGS84: [lon, lat])
- Checken Sie Browser-Konsole auf Fehler

### Problem: Animation ruckelt

**Lösung**:
- Reduzieren Sie `playSpeed` (z.B. auf 500ms)
- Bei >10.000 Agenten: Datensatz filtern oder vereinfachen
- Browser-Hardware-Beschleunigung aktivieren

### Problem: Zeitschritte fehlen

**Lösung**:
- Stellen Sie sicher, dass `time` als String formatiert ist
- Zeitformat sollte konsistent sein (ISO 8601)

## 📚 Weitere Dokumentation

- [Vollständige Implementierungs-Dokumentation](./doc/AgentVisualization.md)
- [Beispiel-Code](./components/AgentVisualization/exampleUsage.js)
- [Masterportal Dokumentation](https://www.masterportal.org)

## 🤝 Beitragen

Verbesserungsvorschläge und Bug-Reports sind willkommen!

## 📄 Lizenz

Siehe `License.txt` im Addon-Root-Verzeichnis.

---

**Version**: 1.0.0  
**Autor**: Masterportal DevTeam  
**Kontakt**: [GitHub Issues](https://github.com/terrestris/masterportal/issues)
