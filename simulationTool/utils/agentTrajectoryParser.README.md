# Agent Trajectory Parser

Dieses Modul bietet Funktionen zum Konvertieren von Simulationsdaten zwischen verschiedenen Formaten.

## Übersicht

Der Agent Trajectory Parser transformiert große GeoJSON-FeatureCollections mit Agenten-Trajektorien in ein kompakteres Format, das statische Metadaten von dynamischen Trajektoriendaten trennt. Dies führt zu deutlich kleineren Dateien und effizienterer Datenverarbeitung.

## Format-Vergleich

### Aktuelles Format (GeoJSON FeatureCollection)

Jeder Zeitschritt eines Agenten ist ein separates Feature mit vollständigen Eigenschaften:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [9.96, 53.44]},
      "properties": {
        "agentId": "agent-1",
        "time": "2024-12-10T10:00:01",
        "gender": "male",
        "activeCapability": "walking",
        "velocity": 1.4,
        "routeLength": 3680,
        ...
      }
    },
    // Hunderte weitere Features pro Agent...
  ]
}
```

**Probleme:**
- Redundante Daten (gender, routeLength) in jedem Feature
- Große Dateigröße bei vielen Agenten und langen Trajektorien
- Ineffiziente Speicherung statischer Eigenschaften

### Neues kompaktes Format (AgentTrajectoryCollection)

Statische Metadaten werden getrennt von der Trajektorie gespeichert:

```json
{
  "type": "AgentTrajectoryCollection",
  "description": "Gruppierte Agenten-Trajektorien - Kompakte Datenstruktur",
  "version": "2.0",
  "agents": {
    "agent-1": {
      "agentId": "agent-1",
      "metadata": {
        "gender": "male",
        "startX": 9.96,
        "startY": 53.44,
        "goalX": 9.99,
        "goalY": 53.47,
        "distanceStartGoal": 2644.99,
        "routeMainModalChoice": "cyclingRentalBike",
        "routeLength": 3680
      },
      "trajectory": [
        {
          "time": "2024-12-10T10:00:01",
          "step": 1,
          "coordinates": [9.96, 53.44],
          "activeCapability": "walking",
          "velocity": 1.4,
          "expectedTravelTime": 1200,
          "comment": ""
        },
        // Weitere Trajektorie-Schritte...
      ]
    }
  }
}
```

**Vorteile:**
- Statische Eigenschaften nur einmal pro Agent
- Kleinere Dateigröße (ca. 30-50% Reduktion bei typischen Simulationen)
- Bessere Strukturierung nach Agenten
- Einfachere Analyse einzelner Agenten
- Schnelleres Laden und Verarbeiten

## Verwendung

### Konvertierung von GeoJSON zu kompaktem Format

```javascript
import {convertToAgentTrajectoryCollection} from './utils/agentTrajectoryParser.js';

// GeoJSON FeatureCollection von der Simulation
const geojson = {
  type: "FeatureCollection",
  features: [/* ... */]
};

// Konvertieren zum kompakten Format
const compactFormat = convertToAgentTrajectoryCollection(geojson);

// Als JSON speichern
const json = JSON.stringify(compactFormat, null, 2);
```

### Konvertierung zurück zu GeoJSON

```javascript
import {convertToGeoJSON} from './utils/agentTrajectoryParser.js';

// Kompaktes Format laden
const compactFormat = JSON.parse(/* ... */);

// Zurück zu GeoJSON konvertieren (für Visualisierung)
const geojson = convertToGeoJSON(compactFormat);
```

### Statistiken abrufen

```javascript
import {getStatistics} from './utils/agentTrajectoryParser.js';

const stats = getStatistics(compactFormat);
console.log(stats);
// {
//   totalAgents: 50,
//   totalSteps: 5000,
//   averageStepsPerAgent: 100,
//   modalChoices: {
//     walking: 20,
//     cycling: 15,
//     cyclingRentalBike: 15
//   }
// }
```

## UI-Integration

In der SimulationResults-Komponente stehen drei Download-Optionen zur Verfügung:

1. **Vollständig**: Komplette Simulationsergebnisse mit allen Job-Details
2. **GeoJSON**: Agent-Trajektorien im Standard-GeoJSON-Format
3. **Kompakt** (NEU): Agent-Trajektorien im optimierten AgentTrajectoryCollection-Format

## Datenstruktur Details

### Metadata-Felder

- `gender`: Geschlecht des Agenten
- `startX`, `startY`: Startkoordinaten (Longitude, Latitude)
- `goalX`, `goalY`: Zielkoordinaten
- `distanceStartGoal`: Luftlinie Start-Ziel in Metern
- `routeMainModalChoice`: Hauptsächlich verwendetes Verkehrsmittel (häufigstes `activeCapability`)
- `routeLength`: Gesamtlänge der Route in Metern

### Trajectory-Felder

- `time`: Zeitstempel (ISO 8601)
- `step`: Schrittnummer (1-basiert)
- `coordinates`: [Longitude, Latitude]
- `activeCapability`: Aktuelles Verkehrsmittel/Fähigkeit
- `velocity`: Geschwindigkeit in m/s
- `expectedTravelTime`: Verbleibende Reisezeit in Sekunden
- `comment`: Optional, Zusatzinformationen
- `hasBike`: Optional, ob Agent ein Fahrrad hat

## Performance

Typische Dateigrößen-Reduktion:

| Agenten | Schritte pro Agent | GeoJSON | Kompakt | Reduktion |
|---------|-------------------|---------|---------|-----------|
| 50      | 100               | 2.5 MB  | 1.2 MB  | 52%       |
| 100     | 200               | 12 MB   | 6 MB    | 50%       |
| 500     | 100               | 25 MB   | 12 MB   | 52%       |

## Tests

Unit-Tests sind verfügbar unter:
```
addons/simulationTool/tests/unit/utils/agentTrajectoryParser.spec.js
```

Tests ausführen:
```bash
npm test -- agentTrajectoryParser
```

## Kompatibilität

- Das kompakte Format kann jederzeit zurück zu GeoJSON konvertiert werden
- Alle Visualisierungstools erwarten GeoJSON, daher erfolgt die Konvertierung bei Bedarf
- Metadaten aus dem ursprünglichen GeoJSON werden im kompakten Format erhalten
- Round-trip-Konvertierung (GeoJSON → Compact → GeoJSON) erhält alle relevanten Daten

## Zukünftige Erweiterungen

Mögliche Verbesserungen:

- Komprimierung mit gzip für noch kleinere Dateien
- Streaming-Parser für sehr große Datensätze
- Binäres Format (z.B. Protocol Buffers) für maximale Effizienz
- Aggregierte Statistiken direkt im Format speichern
