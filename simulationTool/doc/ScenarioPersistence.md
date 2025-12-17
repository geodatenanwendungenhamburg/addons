# Scenario Persistence in Agent Visualization

## Übersicht

Die Szenario-Persistenz-Funktionalität ermöglicht es, Planungsszenarien (Gebiet, Radstationen, Start/Ziel-Punkte) zusammen mit den Agenten-Simulationsdaten zu speichern und später wieder zu laden.

## Workflow

### 1. Szenario erstellen und Simulation starten

```
Benutzer erstellt Szenario
    ↓
Geometrien werden auf Karte gezeichnet
    ↓
Szenario wird im Store gespeichert (currentPlanningScenario)
    ↓
Simulation wird gestartet
    ↓
Bei Wechsel zu AgentVisualization:
    - Layer bleiben auf Karte (nicht mehr gecleart)
    - Szenario-Daten werden in AgentVisualization geladen
```

**Code-Flow:**
- `SimulationParameter.vue` → `unmounted()` prüft ob Wechsel zu AgentVisualization
- Infrastructure-Layer wird NICHT gecleart wenn `mode === "agentVisualization"`
- `switchToAgentVisualization()` sammelt Geometrien via `collectPlanningScenarioGeometries()`

### 2. Simulation als GeoJSON exportieren

```
Benutzer klickt auf Download (GeoJSON)
    ↓
SimulationResults.extractAgentGeoJSON() wird aufgerufen
    ↓
Agenten-Daten werden extrahiert
    ↓
Szenario-Metadaten werden eingebettet:
    - metadata.planningScenarioId
    - metadata.planningScenario (vollständige Daten)
    - metadata.simulationId
    - metadata.timestamp
    ↓
GeoJSON-Datei wird heruntergeladen
```

**Embedded Metadata Struktur:**
```json
{
  "type": "FeatureCollection",
  "metadata": {
    "planningScenarioId": "uuid-of-scenario",
    "planningScenarioName": "My Scenario",
    "simulationId": "sim-123",
    "timestamp": "2025-12-12T10:30:00.000Z",
    "planningScenario": {
      "id": "uuid-of-scenario",
      "name": "My Scenario",
      "dataSourceId": "datasource-123",
      "scenarioFeature": {
        "type": "FeatureCollection",
        "features": [...]
      },
      "inputs": {
        "buildings": { "type": "FeatureCollection", "features": [...] },
        "roads": { "type": "FeatureCollection", "features": [...] },
        "stations": { "type": "FeatureCollection", "features": [...] },
        "cycleTravelerLayer": { 
          "type": "FeatureCollection", 
          "features": [
            {
              "id": "cycleTravelerSource",
              "geometry": {...},
              "properties": { "type": "source", "spawningAmount": 50 },
              "style": { "fill": { "color": "rgba(255, 165, 0, 0.3)" } }
            },
            {
              "id": "cycleTravelerTarget",
              "geometry": {...},
              "properties": { "type": "target" },
              "style": { "fill": { "color": "rgba(147, 112, 219, 0.3)" } }
            }
          ]
        }
      }
    }
  },
  "features": [
    // Agent trajectory features
  ]
}
```

### 3. GeoJSON-Datei wieder laden

```
Benutzer lädt GeoJSON-Datei in AgentVisualization
    ↓
handleFileUpload() parst die Datei
    ↓
Metadata wird ausgelesen
    ↓
Prüfung: Ist Szenario im Store?
    ├─ JA: Szenario aus Store laden
    │      → updateFeatures() rendert Layer
    │      → Geometrien auf Karte
    │
    └─ NEIN: Embedded Szenario-Daten verwenden
           → Szenario in Store hinzufügen
           → updateFeatures() rendert Layer
           → Geometrien auf Karte
    ↓
Agenten-Daten werden geladen
    ↓
Beide Visualisierungen gleichzeitig aktiv
```

**Code-Flow:**
- `AgentVisualization.vue` → `handleFileUpload()`
- Liest `geojson.metadata.planningScenarioId`
- Sucht Szenario in Store: `planningScenarios.find(s => s.id === metadata.planningScenarioId)`
- Falls nicht gefunden: Nutzt `metadata.planningScenario` (embedded data)
- Fügt Szenario in Store hinzu via `setPlanningScenarios()`
- Triggert `updateFeatures()` Action → Layer werden gerendert
- Ruft `buildScenarioGeoJSONFromStore()` → Konvertiert Store-Daten zu GeoJSON
- Lädt in AgentVisualization Store via `loadPlanningScenarioData()`

## Implementierte Komponenten

### 1. SimulationResults.vue

**Methode:** `extractAgentGeoJSON()`
- Extrahiert Agenten-Daten aus Job-Results
- Embeds `planningScenarioId` und vollständige Szenario-Daten in `metadata`
- Gibt erweitertes GeoJSON mit Metadata zurück

### 2. SimulationParameter.vue

**Methode:** `switchToAgentVisualization()`
- Prüft ob GeoJSON Metadata hat
- Lädt Szenario aus Store oder embedded data
- Setzt `currentPlanningScenarioId` im Store
- Triggert `updateFeatures()` für Layer-Rendering
- Sammelt Geometrien via `collectPlanningScenarioGeometries()`

**Methode:** `collectPlanningScenarioGeometries()`
- Sammelt Features von `planning-scenario` Layer
- Sammelt Features von `infrastructure` Layer
- **Fallback:** Nutzt Store-Daten wenn Layer leer sind
- Konvertiert zu GeoJSON FeatureCollection

**Methode:** `unmounted()`
- Prüft ob Wechsel zu AgentVisualization
- Infrastructure-Layer wird NICHT gecleart wenn `mode === "agentVisualization"`

### 3. AgentVisualization.vue

**Methode:** `handleFileUpload()`
- Parst GeoJSON-Datei
- Liest `metadata.planningScenarioId`
- Sucht Szenario in Store
- Falls nicht gefunden: Nutzt embedded data
- Fügt Szenario in Store hinzu
- Triggert Layer-Rendering
- Lädt Szenario-Geometrien in AgentVisualization Store

**Methode:** `buildScenarioGeoJSONFromStore()`
- Konvertiert Store-Szenario zu GeoJSON FeatureCollection
- Kombiniert scenarioFeature + inputs (infrastructure + cycleTravelerLayer)
- Gibt GeoJSON für Rendering zurück

**Methode:** `renderPlanningScenarioData()`
- Rendert Szenario-Geometrien auf Karte
- Nutzt Store-Daten als Fallback wenn GeoJSON nicht übergeben
- Rendert alle drei Layer-Typen:
  - Planning Scenario Area (Z-Index 9999996)
  - Infrastructure (Z-Index 9999997)
  - cycleTravelerLayer (im planning-scenario Layer)

### 4. CycleTravelerLayerInput.vue

**Methode:** `updateValue()`
- Speichert cycleTravelerLayer in FeatureCollection
- Embeds Styles (orange für Source, lila für Target)
- Ruft `saveCycleTravelerLayerToStore()` auf

**Methode:** `saveCycleTravelerLayerToStore()`
- Speichert cycleTravelerLayer in `currentPlanningScenario.inputs`
- Macht Daten zentral im Store verfügbar

### 5. store/actions.js

**Action:** `updateFeatures()`
- Rendert Szenario-Geometrien auf Karte
- Nutzt `planning-scenario` Layer (Z-Index 9999996)
- Nutzt `infrastructure` Layer (Z-Index 9999997)
- cycleTravelerLayer-Features gehen in planning-scenario Layer
- Wendet Styles aus Features an

### 6. store/agentVisualization.js

**Action:** `loadPlanningScenarioData()`
- Lädt Szenario-GeoJSON in AgentVisualization Store
- Setzt `planningScenarioData` State
- Wird von `renderPlanningScenarioData()` genutzt

## Layer-Hierarchie (Z-Index)

```
9999999: Agent WebGL Layer (höchste Priorität - animierte Agenten)
9999998: Agent Trail Layer (Pfade/Trails)
9999997: Infrastructure Layer (Gebäude, Straßen, Radstationen)
9999996: Planning Scenario Layer (Szenariogebiet, Start/Ziel-Punkte)
```

Diese Reihenfolge stellt sicher, dass:
- Agenten immer oben sichtbar sind
- Trails unter Agenten aber über Infrastructure
- Infrastructure über Szenario-Gebiet
- Alle Szenario-Layer über normalen Map-Layern

## Debug-Logs

Alle Komponenten loggen ihre Aktionen mit Präfix für einfaches Debugging:

- `[SimulationResults]` - GeoJSON-Export mit Metadata
- `[SimulationParameter]` - Szenario-Loading beim Tab-Wechsel
- `[AgentVisualization]` - File-Upload und Szenario-Rekonstruktion
- `[agentVisualization/store]` - Store-Aktionen

**Beispiel-Log beim Laden:**
```
[AgentVisualization] GeoJSON metadata: { planningScenarioId: "...", ... }
[AgentVisualization] Found planningScenarioId in file: abc-123
[AgentVisualization] Scenario found in store, using it
[agentVisualization/store] Loading planning scenario data: { type: "FeatureCollection", featureCount: 15 }
[AgentVisualization] Built scenario GeoJSON with 15 features
```

## Vorteile

1. ✅ **Single Source of Truth**: Szenario-Daten zentral im Vuex Store
2. ✅ **Persistenz**: Szenario-Layer bleiben beim Tab-Wechsel erhalten
3. ✅ **Export/Import**: Vollständige Simulation inkl. Szenario exportierbar
4. ✅ **Offline-fähig**: Keine Server-Verbindung zum Laden gespeicherter Simulationen nötig
5. ✅ **Keine Duplikate**: Feature-ID-basierte Duplikat-Vermeidung
6. ✅ **Klare Trennung**: Separate Layer für unterschiedliche Geometrie-Typen
7. ✅ **Fallback-Logik**: Funktioniert mit Store-Daten oder embedded data

## Einschränkungen

- Szenario-Daten erhöhen Dateigröße des GeoJSON-Exports
- Bei sehr vielen Infrastructure-Features kann Datei groß werden
- Embedded Szenario-Daten sind Snapshot zum Zeitpunkt des Exports
- Änderungen am Szenario nach Export werden nicht reflektiert

## Zukünftige Erweiterungen

- Optionale Kompression der embedded Szenario-Daten
- Versionierung von Szenario-Daten im Export
- UI-Toggle zum Ein/Ausblenden von Szenario-Layern in AgentVisualization
- Export-Option: "Nur Agenten" vs. "Agenten + Szenario"
