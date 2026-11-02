import {defineStore} from "pinia";
import gettersSupersetDashboard from "./gettersSupersetDashboard.js";
import actionsSupersetDashboard from "./actionsSupersetDashboard.js";

/**
 * @module addons/supersetDashboard/store/supersetDashboardStore
 * @typedef {Object} SupersetDashboardState
 * @property {String} type The type of the module.
 * @property {String} description Description of the module shown in the menu.
 * @property {String} icon Icon next to the name.
 * @property {String} name Name of the module.
 * @property {String[]} supportedDevices Devices on which the module is displayed.
 * @property {String[]} supportedMapModes Map modes in which the module can be used.
 * @property {Boolean} hasMouseMapInteractions If true, other modules with mouse map interactions are deactivated.
 * @property {String} supersetDomain Domain of the Superset instance, e.g. "superset.example.org".
 * @property {String} dashboardUuid UUID of the Superset dashboard to embed.
 * @property {Object[]} statisticLayers List of statistic layers associated with the dashboard.
 * @property {String} statisticLayers.id ID of the statistic layer.
 * @property {String} statisticLayers.name Name of the statistic layer.
 * @property {String} statisticLayers.url URL of the statistic layer.
 * @property {String} statisticLayers.type Type of the statistic layer.
 */

export const useSupersetDashboardStore = defineStore("supersetDashboard", {
    state: () => ({
        type: "supersetDashboard",
        description: "additional:modules.supersetDashboard.description",
        icon: "bi-bar-chart-line",
        name: "additional:modules.supersetDashboard.name",
        supportedDevices: ["Desktop", "Mobile", "Table"],
        supportedMapModes: ["2D", "3D"],
        hasMouseMapInteractions: true,

        supersetDomain: "",
        dashboardUuid: "",
        statisticLayers: [
            {
                id: "",
                name: "",
                url: "",
                type: ""
            }
        ]
    }),
    getters: {
        ...gettersSupersetDashboard
    },
    actions: {
        ...actionsSupersetDashboard
    }
});
