**DashboardManager**

<<<<<<< HEAD
Statistische Datenübersicht.

|Name|Verpflichtend|Typ|Default|Beschreibung|
|----|-------------|---|-------|------------|
|name|nein|String|Dashboard|Name des Werkzeuges im Menu.|
|icon|nein|String|bi-speedometer|CSS Klasse des Glyphicons, das vor dem Toolnamen im Menu angezeigt wird.|

**Beispiel**
```
"dashboard": {
    "name": "Dashboard",
    "icon": "bi-table"
}
```
=======
TODO.

|Name|Verpflichtend|Typ|Default|Beschreibung|
|----|-------------|---|-------|------------|
|name|nein|String|Gebiet auswählen|Name des Werkzeuges im Menu.|
|icon|nein|String|bi-list|CSS Klasse des Glyphicons, das vor dem Toolnamen im Menu angezeigt wird.|
|districtLevels|ja|Object[]||Beinhaltet die nötigen Informationen der einzelnen Verwaltungsebenen (siehe Beispiel).|
|districtLevels[i].layerId|ja|String||Die Layer id zum jeweiligen Verwaltungslayer.|
|districtLevels[i].label|ja|String||Die/der Bezeichnung/ Name für die Verwaltungsebene.|
|districtLevels[i].keyOfAttrName|ja|String||Der Key für das Attribut in dem der Name der Verwaltungeinheit steht.|
|districtLevels[i].keyOfAttrNameStats|ja|String||Der Key für das Attribut in dem der Name steht, für die statistischen Daten.|
>>>>>>> 108ebd74 (add new addons_3_0_0 structure-add missing addons)
