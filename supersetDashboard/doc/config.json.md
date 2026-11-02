## Portalconfig.menu.sections.supersetDashboard
Module to display an [Apache Superset](https://superset.apache.org) dashboard in the menu. The module uses a Pinia store.

***

### SupersetDashboard - Configuration

|Name|Mandatory|Type|Default|Description|Expert|
|----|-------------|---|-------|------------|------|
|type|yes|String|"supersetDashboard"|The type used to identify the module.|false|
|icon|no|String|"bi-bar-chart-line"|The icon to use.|false|
|name|no|String|"Superset"|The title of the module or the entry in the menu.|false|
|supersetUrl|yes|String|""|Base URL of the Superset instance (http or https).|false|
|dashboardId|yes|String|""|ID or slug of the dashboard to embed.|false|

**Example**
```
#!json
{
    "type": "supersetDashboard",
    "icon": "bi-bar-chart-line",
    "name": "additional:modules.supersetDashboard.name",
    "supersetUrl": "https://superset.example.org",
    "dashboardId": "my-dashboard"
}
```

***
