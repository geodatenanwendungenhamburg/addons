# Green4Bikes Agent Visualization - Modern Implementation

## Übersicht

Diese modernisierte Implementierung der Agent Visualization bietet eine hochperformante, benutzerfreundliche Visualisierung für agentenbasierte Simulationen (Green4Bikes) im Masterportal.

## Hauptfunktionen

### ✨ Neue Features

1. **Smooth Interpolation**
   - Eliminiert "ruckelige" Bewegungen zwischen Zeitschritten
   - Zwei Modi: Linear und Catmull-Rom Spline
   - Flüssige Animation mit 60 FPS

2. **Advanced Time Slider**
   - Großer, benutzerfreundlicher Zeitregler
   - Live-Zeitstempel-Anzeige
   - Drag-Handle mit Tooltip
   - Playback-Kontrollen: Play, Pause, Skip Forward/Backward
   - Geschwindigkeitseinstellungen (0.1x bis 10x)
   - Loop-Modus

3. **Time-Series Chart**
   - SVG-basierte interaktive Visualisierung (KEINE externen Bibliotheken!)
   - Zeigt Agenten-Anzahl über Zeit
   - Aufschlüsselung nach Fortbewegungsart (Zu Fuß / Fahrrad)
   - Click-to-Jump: Klick auf Chart springt zu entsprechender Zeit
   - Live-Indikator für aktuelle Zeit

4. **Filter Panel**
   - Fortbewegungsart-Filter (Walking/Bike)
   - Trail-Visualisierung (ein/aus)
   - Trail-Länge konfigurierbar (2-20 Schritte)
   - Interpolations-Modus Auswahl
   - Render-Modus: Vector vs. WebGL
   - Performance-Monitoring (FPS, Agent Count)

5. **WebGL Performance Layer**
   - Hochperformantes Rendering für 10.000+ Agenten
   - Zoom-abhängige Punktgröße
   - Batch-Updates für optimale Performance
   - Automatisches Fallback auf Vector-Rendering

## Architektur

### Komponenten-Struktur

```
AgentVisualizationModern.vue (Haupt-Orchestrator)
├── AdvancedTimeSlider.vue (Zeit-Kontrolle)
├── TimeSeriesChart.vue (SVG Chart)
├── FilterPanel.vue (Filter & Einstellungen)
└── SectionHeader.vue (Header)
```

### Utilities

```
TimeEngine.js
├── requestAnimationFrame-basierte Animation
├── Playback-Kontrolle (Play/Pause/Speed/Loop)
├── FPS-Monitoring
└── Vuex Integration

AgentInterpolator.js
├── Linear Interpolation
├── Catmull-Rom Spline Interpolation
├── Trail-Pfad-Generierung
└── Positions-Cache

AgentWebGLLayer.js
├── WebGL Points Layer
├── Batch-Rendering
├── Filter-Integration
└── Click-Detection
```

### Vuex Store

```
store/agentVisualization.js
├── State (Data, Time, Filters, Settings)
├── Getters (Filtered Data, Computed Values)
├── Mutations (State Updates)
└── Actions (Data Loading, Metrics Calculation)
```

## Verwendung

### 1. Komponente registrieren

In `SimulationTool.vue`:

```javascript
import AgentVisualizationModern from "./AgentVisualization/AgentVisualizationModern.vue";

export default {
    components: {
        AgentVisualizationModern
    }
};
```

### 2. Daten laden

Die Komponente akzeptiert GeoJSON-Daten mit folgender Struktur:

```json
{
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "id": "agent-1-time-1654070400000",
            "geometry": {
                "type": "Point",
                "coordinates": [9.993682, 53.551086]
            },
            "properties": {
                "agentId": "agent-1",
                "time": 1654070400000,
                "activeCapability": "walking",
                "velocity": 1.4,
                "routeLength": 2500
            }
        }
    ]
}
```

### 3. Datenformat-Anforderungen

- **Koordinaten**: EPSG:4326 (WGS84) - werden automatisch transformiert
- **Time**: Unix Timestamp in Millisekunden
- **activeCapability**: "walking" oder "bike"
- **agentId**: Eindeutige ID für jeden Agenten (bleibt über Zeit konstant)

## Performance-Optimierungen

### Vector Rendering (Standard)
- ✅ Gut für < 1.000 Agenten
- ✅ Volle Styling-Kontrolle
- ✅ Einfache Debugging
- ⚠️ FPS sinkt bei > 1.000 Agenten

### WebGL Rendering
- ✅ Optimiert für 10.000+ Agenten
- ✅ Konstante 60 FPS bei großen Datensätzen
- ✅ Zoom-adaptive Punktgröße
- ⚠️ Begrenzte Styling-Optionen

### Interpolation
- **Linear**: Schneller, direkte Verbindung zwischen Punkten
- **Catmull-Rom**: Glatter, kurvenförmige Pfade, leicht höhere CPU-Last

## Konfiguration

### Vuex Store Einstellungen

```javascript
// In mounted() oder created()
this.$store.commit("agentVisualization/setSpeed", 2.0); // 2x speed
this.$store.commit("agentVisualization/setLoop", true); // Enable loop
this.$store.commit("agentVisualization/setShowTrails", true); // Show trails
this.$store.commit("agentVisualization/setTrailLength", 10); // 10 steps
this.$store.commit("agentVisualization/setInterpolationMode", "catmullRom");
this.$store.commit("agentVisualization/setRenderMode", "webgl");
```

### TimeEngine API

```javascript
// Zugriff auf TimeEngine
const timeEngine = this.timeEngine;

// Playback-Kontrolle
timeEngine.play();
timeEngine.pause();
timeEngine.reset();

// Navigation
timeEngine.skipForward();
timeEngine.skipBackward();
timeEngine.jumpToTime(timestamp);

// Einstellungen
timeEngine.setSpeed(1.5); // 1.5x speed
timeEngine.setLoop(true); // Enable loop

// Performance
const fps = timeEngine.getFPS();
```

## Bekannte Einschränkungen

1. **Browser-Kompatibilität**
   - WebGL erfordert modernen Browser (Chrome 80+, Firefox 75+, Safari 13+)
   - requestAnimationFrame nicht in IE11

2. **Datengröße**
   - Vector Rendering: Max. 1.000 Agenten für 60 FPS
   - WebGL Rendering: Max. 50.000 Agenten für 30 FPS
   - Empfohlene Datensatzgröße: < 10 MB GeoJSON

3. **Memory**
   - Interpolator cached alle Trajektorien im RAM
   - Bei sehr großen Datensätzen (> 100k Features) kann Memory-Limit erreicht werden

## Troubleshooting

### Problem: Agenten werden nicht angezeigt
**Lösung**: 
- Prüfen Sie Koordinaten-Format (EPSG:4326)
- Prüfen Sie Zeit-Properties (Unix Timestamp in ms)
- Öffnen Sie Browser-Console für Fehler

### Problem: Niedrige FPS
**Lösung**:
- Wechseln Sie zu WebGL Rendering-Modus
- Reduzieren Sie Trail-Länge
- Wechseln Sie zu Linear-Interpolation
- Reduzieren Sie Playback-Geschwindigkeit

### Problem: Interpolation "springt"
**Lösung**:
- Stellen Sie sicher, dass agentId konsistent ist
- Prüfen Sie ob Zeitschritte sortiert sind
- Wechseln Sie zu Catmull-Rom für glattere Kurven

## Migration von alter Implementierung

Die alte `AgentVisualization.vue` bleibt funktionsfähig. Migration in 3 Schritten:

1. **Vuex Store registrieren** (automatisch in `AgentVisualizationModern`)
2. **Komponente austauschen** in Parent-Component
3. **Datenformat prüfen** (sollte kompatibel sein)

## Entwicklung & Tests

```bash
# Installation
cd addons/simulationTool
npm install

# Entwicklung (ohne Chart.js - nur native APIs!)
npm run serve

# Build
npm run build
```

## Browser-Unterstützung

| Browser | Min Version | WebGL | Interpolation |
|---------|-------------|-------|---------------|
| Chrome  | 80+         | ✅    | ✅            |
| Firefox | 75+         | ✅    | ✅            |
| Safari  | 13+         | ✅    | ✅            |
| Edge    | 80+         | ✅    | ✅            |
| IE11    | ❌          | ❌    | ❌            |

## Credits

- **OpenLayers 9.x**: Map Rendering & WebGL Layer
- **Vue 3**: UI Framework
- **Vuex**: State Management
- **Bootstrap 5**: UI Components & Icons

**Keine externen Chart-Bibliotheken!** Alle Visualisierungen sind native SVG/Canvas.

## Lizenz

MIT License - siehe `License.txt` im Hauptverzeichnis
