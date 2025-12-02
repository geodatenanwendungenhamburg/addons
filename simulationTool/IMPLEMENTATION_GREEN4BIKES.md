# Green4Bikes Integration - Implementierungsübersicht

## Durchgeführte Änderungen

### 1. Terminologie-Umbenennung (✓ Abgeschlossen)
- **Dateien**: `locales/de/additional.json`, `locales/en/additional.json`
- **Änderungen**: Alle `planningScenario*` Keys wurden zu `scenario*` umbenannt
- **Beispiele**:
  - `planningScenarioCreate` → `scenarioCreate`
  - `dataSourceForPlanningScenario` → `dataSourceForScenario`
  - `planningScenarioOverview` → `scenarioOverview`

### 2. Entfernung der Bounding-Box-Limitierung (✓ Abgeschlossen)
- **Datei**: `addons/simulationTool/components/PlanningScenario/PlanningScenarioCreate.vue`
- **Änderungen**:
  - `maxSideLengthFromConfig` Computed Property auskommentiert
  - `bufferConstraintStatus` Computed Property auskommentiert
  - `isMaxConstraintExceeded` Computed Property und Watcher auskommentiert
  - `checkBboxSideLengthConstraint` Methode auskommentiert
  - `constraintExceededInfoText` Methode auskommentiert
  - Alert-UI für Constraint-Überschreitung entfernt
  - `isMaxConstraintExceeded` aus Button `disabled` Bedingung entfernt

### 3. Datetime-Input-Komponente (✓ Abgeschlossen)
- **Datei**: `addons/simulationTool/components/shared/components/DatetimeInput.vue`
- **Features**:
  - Separate HTML5 Date- und Time-Inputs
  - Automatische Konvertierung zu ISO 8601 Format (`YYYY-MM-DDTHH:mm:ss`)
  - Echtzeit-Validierung gegen `min` und `max` Props
  - Dynamische Min/Max-Zeit basierend auf ausgewähltem Datum
  - Zweisprachige Labels (Datum/Zeit)
  - Fehleranzeige bei Validierungsproblemen

### 4. Geometrie-Input-Komponente (✓ Abgeschlossen)
- **Datei**: `addons/simulationTool/components/shared/components/GeometryInput.vue`
- **Features**:
  - Unterstützung für Point und Polygon (Rechteck) Geometrien
  - Integration mit OpenLayers Draw-Interaktion
  - Rectangle-Zeichnung via `Draw.createBox()`
  - GeoJSON-Export der gezeichneten Geometrie
  - Löschen-Funktion für gezeichnete Geometrien
  - Visuelle Anzeige der aktuellen Geometrie

### 5. DynamicInputByType Erweiterung (✓ Abgeschlossen)
- **Datei**: `addons/simulationTool/components/shared/components/DynamicInputByType.vue`
- **Änderungen**:
  - Import der neuen `DatetimeInput` und `GeometryInput` Komponenten
  - Neue Input-Typen `datetime` und `geometry` hinzugefügt
  - Props erweitert um `geometryType` für Polygon/Point-Auswahl
  - `min`/`max` Props von Number auf `[Number, String]` erweitert für Datetime-Support

### 6. Lokalisierung erweitert (✓ Abgeschlossen)
- **Dateien**: `locales/de/additional.json`, `locales/en/additional.json`
- **Neue Keys**:
  - `rentalStations`, `bikeStations`, `stationId`, `stationName`, `numberOfBikes`
  - `startPoint`, `endPoint`, `cycleTravelerSource`, `cycleTravelerTarget`
  - `sourceGeometry`, `targetGeometry`, `startTime`, `endTime`
  - `spawningAmount`, `spawningIntervalInMinutes`, `hasOwnBikeProbability`
  - `gender`, `mass`, `perceptionInMeter`
  - Output-Properties: `hasBike`, `routeLength`, `velocity`

### 7. Green4Bikes Konfiguration (✓ Abgeschlossen)
- **Datei**: `addons/simulationTool/config-green4bikes.json`
- **Inhalt**:
  - **StadtRAD-Datenquelle**:
    - ID: `stadtrad`
    - OAF-URL: `https://api.hamburg.de/datasets/v1/stadtrad/collections/stadtrad_stationen/items`
    - Properties: `id`, `name`, `anzahl_raeder`
    - CRS: EPSG:4326 (WGS84)
  
  - **Green4Bikes-Simulation**:
    - ID: `mars:sim-green4Bikes-default`
    - Process-URL: `http://ump-lgv.germanywestcentral.cloudapp.azure.com/api/`
    - **Primary Parameters**:
      - `startPoint` (datetime): Startzeitpunkt der Simulation
      - `endPoint` (datetime): Endzeitpunkt der Simulation
      - `cycleTravelerSource` (object):
        - `geometry` (Polygon): Startbereich
        - `spawningAmount` (integer): Anzahl Radfahrer pro Intervall
        - `spawningIntervalInMinutes` (integer): Erzeugungsintervall
        - `startTime`, `endTime` (datetime): Zeitfenster für Agenten-Spawning
      - `cycleTravelerTarget` (object):
        - `geometry` (Polygon): Zielbereich
      - `rentalStations` (editable FeatureCollection): StadtRAD-Stationen
    - **Advanced Parameters**:
      - `hasOwnBikeProbability` (0.0-1.0): Wahrscheinlichkeit eigenes Rad
      - `gender` (enum): Geschlecht
      - `mass` (number): Masse in kg
      - `perceptionInMeter` (number): Wahrnehmungsdistanz
    - **Outputs**:
      - Agent-Properties: `hasBike`, `routeLength`, `velocity`, `time`, `gender`, etc.

## Nächste Schritte für die Integration

### 1. Konfiguration ins Portal integrieren
Die `config-green4bikes.json` muss in die Portal-Konfiguration eingefügt werden:
- Entweder direkt in `portal/master/config.json` unter dem simulationTool
- Oder die `dataSources` und `simulations` Arrays in der Store-Initialisierung

### 2. SimulationParameter.vue erweitern
Die Komponente muss angepasst werden, um die neuen Input-Typen zu verarbeiten:
- Erkennung von `datetime` Format in Schema
- Erkennung von `geometry` Properties in Objects
- Übergabe der richtigen Props an `DynamicInputByType`

### 3. Datetime-Constraint-Validierung
Implementierung der Validierung für verschachtelte Datetime-Properties:
- `cycleTravelerSource.startTime` >= `startPoint`
- `cycleTravelerSource.endTime` <= `endPoint`
- Watch auf parent-Parameter für dynamische Min/Max-Updates

### 4. GeoJSON-Koordinaten-Transformation
Falls nötig, Transformation von WGS84 (EPSG:4326) nach EPSG:25832:
- In `fetchFeatures` für StadtRAD-Stationen
- Oder direkt in `GeometryInput` beim Export

### 5. Request-Body-Formatierung
Sicherstellen, dass die Request-Body-Generierung in `SimulationParameter.vue`:
- Geometry-Objects korrekt als GeoJSON Features formatiert
- Datetime-Strings im ISO 8601 Format bleiben
- Nested Object-Properties korrekt strukturiert sind

### 6. Testing
- Unit-Tests für `DatetimeInput` und `GeometryInput`
- Integration-Tests für Green4Bikes-Simulation
- Validierung der API-Requests gegen Process-Definition

## Technische Hinweise

### Koordinatensysteme
- **StadtRAD-API**: Liefert WGS84:4326 (Lon/Lat)
- **Green4Bikes-Modell**: Erwartet laut Doku WGS84:4326
- **Masterportal-Standard**: EPSG:25832 (UTM32)
- **Empfehlung**: WGS84 beibehalten für Konsistenz mit API und Modell

### Datetime-Format
- **UI**: Separate Date/Time Inputs für bessere UX
- **Backend**: ISO 8601 Format `YYYY-MM-DDTHH:mm:ss`
- **Validierung**: Echtzeit mit dayjs

### Geometrie-Input
- **Point**: Einzelner Klick auf Karte
- **Polygon**: Rectangle via `Draw.createBox()`
- **Export**: GeoJSON-Feature mit coordinates

### Parameter-Kategorisierung
- **Primary**: `spawningAmount`, `spawningIntervalInMinutes`, Geometrien, Zeitpunkte
- **Advanced** (optional): `hasOwnBikeProbability`, `gender`, `mass`, `perceptionInMeter`
- **Editable**: `rentalStations` (über PlanningScenarioLanduse)
