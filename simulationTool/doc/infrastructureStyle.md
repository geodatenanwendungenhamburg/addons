# Infrastructure Point Style Configuration

Die Style-Konfiguration für Infrastructure-Layer Point-Features kann im Vuex Store angepasst werden.

## Konfiguration im State

Die Konfiguration befindet sich in `store/state.js` unter `infrastructurePointStyle`:

### Circle Style (Standard)

```javascript
infrastructurePointStyle: {
    type: "circle",
    circle: {
        radius: 6,
        fillColor: [255, 140, 0, 0.8],  // Orange mit 80% Deckkraft
        strokeColor: [255, 140, 0, 1],   // Orange volldeckend
        strokeWidth: 2
    }
}
```

### Icon Style mit Text-Label (z.B. Fahrrad-Icon mit Anzahl)

```javascript
infrastructurePointStyle: {
    type: "icon",
    icon: {
        src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%23FF8C00' d='M15.5 5.5c1 0 1.8-.8 1.8-1.8s-.8-1.7-1.8-1.7-1.8.8-1.8 1.7.8 1.8 1.8 1.8M5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5m0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5m5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5.1 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2l-2.2-2.3M19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5m0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5'/%3E%3C/svg%3E",
        scale: 1.2,
        anchor: [0.5, 0.5],
        anchorXUnits: "fraction",
        anchorYUnits: "fraction"
    },
    text: {
        enabled: true,
        propertyName: "num_bikes_available",  // Feature-Property mit der Anzahl
        offsetY: 20,  // 20px unter dem Icon
        font: "bold 12px sans-serif",
        fillColor: [255, 140, 0, 1],  // Orange Text
        strokeColor: [255, 255, 255, 1],  // Weißer Rand
        strokeWidth: 3
    }
}
```

## Verwendung einer externen Bild-Datei

```javascript
infrastructurePointStyle: {
    type: "icon",
    icon: {
        src: "./assets/bike-icon.png",  // Relativer Pfad zur Icon-Datei
        scale: 0.8,
        anchor: [0.5, 1],  // Icon am unteren Mittelpunkt verankern
        anchorXUnits: "fraction",
        anchorYUnits: "fraction"
    }
}
```

## Parameter-Beschreibung

### type
- `"circle"`: Zeigt einen Kreis-Marker
- `"icon"`: Zeigt ein Bild-Icon

### circle (nur wenn type="circle")
- `radius`: Radius des Kreises in Pixeln
- `fillColor`: Füllfarbe als RGBA-Array [R, G, B, Alpha]
- `strokeColor`: Randfarbe als RGBA-Array [R, G, B, Alpha]
- `strokeWidth`: Randbreite in Pixeln

### icon (nur wenn type="icon")
- `src`: URL oder Data-URI des Icons
- `scale`: Skalierung des Icons (1.0 = Originalgröße)
- `anchor`: Ankerpunkt des Icons [x, y]
- `anchorXUnits`: Einheit für X-Koordinate ("fraction" oder "pixels")
- `anchorYUnits`: Einheit für Y-Koordinate ("fraction" oder "pixels")

### text (optional, für beide Typen verfügbar)
- `enabled`: Boolean - Aktiviert/deaktiviert das Text-Label
- `propertyName`: String - Name der Feature-Property die angezeigt werden soll (z.B. "num_bikes_available")
- `offsetY`: Number - Vertikaler Offset in Pixeln (positiv = unter dem Icon)
- `font`: String - CSS Font-Style (z.B. "bold 12px sans-serif")
- `fillColor`: RGBA-Array - Textfarbe [R, G, B, Alpha]
- `strokeColor`: RGBA-Array - Randfarbe des Texts [R, G, B, Alpha]
- `strokeWidth`: Number - Breite des Text-Rands in Pixeln

## Hinweise

- Linien und Polygone verwenden weiterhin den Standard-OpenLayers-Style
- Nur Point-Features erhalten den konfigurierten Style
- SVG-Icons sollten als Data-URI kodiert werden für beste Performance
- Die Konfiguration kann zur Laufzeit über den Store geändert werden
- Text-Labels werden nur angezeigt, wenn die konfigurierte Property im Feature vorhanden ist
- Der `propertyName` muss mit dem tatsächlichen Property-Namen des Features übereinstimmen
- Der Text-Rand (stroke) verbessert die Lesbarkeit auf verschiedenen Hintergründen

## Beispiel: Fahrradstationen mit Anzahl verfügbarer Räder

Wenn die Features eine Property `num_bikes_available` haben, wird diese automatisch unter dem Fahrrad-Icon angezeigt:

```javascript
// Feature-Daten (GeoJSON)
{
  "type": "Feature",
  "properties": {
    "name": "Station Hauptbahnhof",
    "num_bikes_available": 5
  },
  "geometry": {
    "type": "Point",
    "coordinates": [10.0, 53.5]
  }
}
```

Mit der aktuellen Konfiguration wird die Zahl "5" in orange mit weißem Rand unter dem Fahrrad-Icon angezeigt.
