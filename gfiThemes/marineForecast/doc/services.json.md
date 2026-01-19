# marineForecast gfiTheme

## Beschreibung

Das `marineForecast` gfiTheme ist eine spezialisierte Komponente zur Darstellung von marinen Vorhersagedaten und Pegelstationsinformationen. Es wurde entwickelt, um HTML-Tabellen aus WMS- und WFS-Diensten in einem einheitlichen Format anzuzeigen.

### Hauptfunktionen

- **Automatische HTML-Tabellen-Erkennung**: Erkennt Properties, die HTML-Tabellen mit `class="featureInfo"` enthalten
- **Konfigurierbare Property-Mappings**: Ermöglicht die Anpassung von Titeln und Zeitstempel-Verknüpfungen für verschiedene Datenquellen
- **Rückwärtskompatibilität**: Funktioniert auch ohne Konfiguration mit Standard-Mappings
- **Flexibles Rendering**: Unterstützt sowohl Iframe- als auch Inline-HTML-Darstellung

## Konfiguration in services-internet.json

### Grundlegende Konfiguration

Die einfachste Konfiguration verwendet nur den Theme-Namen. In diesem Fall werden die Standard-Property-Mappings verwendet:

```json
{
  "id": "6000",
  "name": "Pegelstationen Nordsee",
  "url": "https://www.geoseaportal.de/geoserver/Meeresinformation/wms",
  "typ": "WMS",
  "layers": "Stationen_Nordsee",
  "gfiAttributes": "showAll",
  "gfiTheme": {
    "name": "marineForecast"
  },
  "infoFormat": "text/html"
}
```

### Erweiterte Konfiguration mit benutzerdefinierten Parameters

Für maximale Flexibilität können Sie alle Aspekte der Darstellung konfigurieren:

```json
{
  "id": "6001",
  "name": "Pegelstationen Ostsee WFS",
  "url": "https://gdi.bsh.de/mapservice_gs/Meeresinformation/wfs",
  "typ": "WFS",
  "featureType": "Stationen_Ostsee",
  "gfiAttributes": "showAll",
  "gfiTheme": {
    "name": "marineForecast",
    "params": {
      "stationNameProperty": "stationbf",
      "stationPositionProperty": "position",
      "propertyMappings": {
        "windvorhersage": {
          "title": "DWD Windvorhersagen",
          "timestampProperty": "stand_wind"
        },
        "temp_vs": {
          "title": "Wasseroberflächentemperaturvorhersage",
          "timestampProperty": "wtemp_stand"
        },
        "ws_vorhersage": {
          "title": "Wasserstandsvorhersage",
          "timestampProperty": "stand"
        },
        "mondereignisse": {
          "title": "Mondereignisse"
        },
        "sonnenereignisse": {
          "title": "Sonnenereignisse"
        }
      }
    }
  },
  "infoFormat": "text/html"
}
```

## Konfigurations-Parameter

### `stationNameProperty` (optional)

- **Typ**: String
- **Standard**: `"stationbf"`
- **Beschreibung**: Der Name des Properties, das den Stationsnamen enthält. Falls nicht vorhanden, wird auf `"name"` zurückgegriffen, oder es wird `"Marine Station"` als Standard verwendet.

**Beispiel:**
```json
"stationNameProperty": "station_name"
```

### `stationPositionProperty` (optional)

- **Typ**: String
- **Standard**: `"position"`
- **Beschreibung**: Der Name des Properties, das die Positionsangabe der Station enthält (z.B. Koordinaten oder geografische Bezeichnung).

**Beispiel:**
```json
"stationPositionProperty": "coordinates"
```

### `propertyMappings` (optional)

- **Typ**: Object
- **Standard**: Vordefinierte Mappings für deutsche Marinestation-Properties
- **Beschreibung**: Ein Objekt, das die Zuordnung von Property-Namen zu Anzeigeinformationen definiert.

Jedes Property-Mapping kann folgende Attribute enthalten:

#### `title` (erforderlich)

- **Typ**: String
- **Beschreibung**: Der anzuzeigende Titel für diese Datenkategorie.

#### `timestampProperty` (optional)

- **Typ**: String
- **Beschreibung**: Der Name eines anderen Properties, das einen Zeitstempel enthält, der zusammen mit dem Titel angezeigt werden soll.

**Beispiel für ein vollständiges Property-Mapping:**
```json
"propertyMappings": {
  "wind_forecast": {
    "title": "Wind Forecast",
    "timestampProperty": "forecast_time"
  },
  "wave_height": {
    "title": "Wave Height Prediction"
  }
}
```

### `forceIframe` (optional)

- **Typ**: Boolean
- **Standard**: `false`
- **Beschreibung**: Erzwingt die Darstellung in einem Iframe, auch wenn der Inhalt inline gerendert werden könnte.

**Beispiel:**
```json
"params": {
  "forceIframe": true
}
```

## Standard Property-Mappings

Wenn keine `propertyMappings` konfiguriert sind, werden folgende Standardwerte verwendet:

| Property-Name | Titel | Zeitstempel-Property |
|---------------|-------|----------------------|
| `windvorhersage` | DWD Windvorhersagen | `stand_wind` |
| `temp_vs` | Wasseroberflächentemperaturvorhersage | `wtemp_stand` |
| `ws_vorhersage` | Wasserstandsvorhersage | `stand` |
| `mondereignisse` | Mondereignisse | - |
| `sonnenereignisse` | Sonnenereignisse | - |

## Anwendungsfälle

### Fall 1: Verwendung der Standardkonfiguration

Wenn Ihre WFS-/WMS-Daten die Standard-Property-Namen verwenden:

```json
"gfiTheme": {
  "name": "marineForecast"
}
```

### Fall 2: Anpassung für eigene Property-Namen

Wenn Ihre Datenquelle andere Property-Namen verwendet:

```json
"gfiTheme": {
  "name": "marineForecast",
  "params": {
    "stationNameProperty": "name",
    "stationPositionProperty": "location",
    "propertyMappings": {
      "wind_data": {
        "title": "Windvorhersage",
        "timestampProperty": "last_update"
      },
      "tide_data": {
        "title": "Gezeiteninformationen"
      }
    }
  }
}
```

### Fall 3: Teilweise Konfiguration

Sie können auch nur einige Properties konfigurieren. Nicht konfigurierte Properties mit HTML-Tabellen werden automatisch mit dem Property-Namen (Unterstriche werden durch Leerzeichen ersetzt) angezeigt:

```json
"gfiTheme": {
  "name": "marineForecast",
  "params": {
    "propertyMappings": {
      "hauptvorhersage": {
        "title": "Hauptvorhersage",
        "timestampProperty": "stand"
      }
    }
  }
}
```

**Ergebnis:**
- `hauptvorhersage` → wird angezeigt als "Hauptvorhersage [Zeitstempel]"
- `andere_daten` → wird automatisch angezeigt als "andere daten"

### Fall 4: WFS mit Iframe-Erzwingung

Für WFS-Dienste, bei denen Sie die Iframe-Darstellung erzwingen möchten:

```json
"gfiTheme": {
  "name": "marineForecast",
  "params": {
    "forceIframe": true,
    "stationNameProperty": "station",
    "propertyMappings": {
      "forecast": {
        "title": "Vorhersage",
        "timestampProperty": "time"
      }
    }
  }
}
```

## Hinweise

- **HTML-Tabellen-Erkennung**: Das Theme erkennt nur Properties, die HTML-Code mit `<table` und `class="featureInfo"` enthalten
- **Automatisches Fallback**: Wenn ein Property HTML-Tabellen enthält, aber nicht in `propertyMappings` definiert ist, wird es trotzdem angezeigt
- **Flexibilität**: Sie können das Theme für beliebige WFS-/WMS-Dienste verwenden, solange diese HTML-Tabellen mit der entsprechenden Klasse zurückgeben
- **Styling**: Das Theme verwendet ein einheitliches Styling mit grauem Hintergrund und blauen Tabellenköpfen

## Technische Details

### Unterstützte Dienst-Typen

- WMS mit `infoFormat: "text/html"`
- WFS mit HTML-Properties

### Rendering-Modi

1. **Iframe-Modus**: Für `text/html` MIME-Type oder wenn `forceIframe: true`
2. **Inline-Modus**: Für JSON/WFS-Daten mit HTML-Tabellen in Properties

### Darstellung

- **Stationskopf**: Wird aus konfigurierbaren Properties zusammengesetzt
- **Abschnittstitel**: Werden aus `propertyMappings` oder automatisch generiert
- **Zeitstempel**: Werden automatisch an Titel angehängt, wenn konfiguriert
- **Tabellen-Styling**: Einheitliches Design mit alternierender Zeilenfärbung
