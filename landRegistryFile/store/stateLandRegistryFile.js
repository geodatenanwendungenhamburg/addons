/**
 * Masterportal state
 * @typedef {Object} MapState
 * @property {String[]} supportedDevices list of devices supported
 * @property {String[]} supportedMapModes list of map modes supported
 * @property {String} type type of the component
 * @property {String} id - id of component
 * @property {String} name - displayed as the title
 * @property {String} description The description that should be shown in the button in the menu.
 * @property {String} icon - icon next to the title
 * @property {Boolean} hasMouseMapInteractions - if true, the component interacts with the map using the mouse

 * Addon state
 * @property {Boolean} showLoadingSpinner - Show loading spinner or not
 * @property {Object[]} landRegistryFileFeatures The array of land registry file features retrieved from the OAF collection.
 * @property {Object} oafParams The parameters for querying the OAF collection.
 * @property {string} oafParams.url - The URL of the OAF service.
 * @property {string} oafParams.collection - The name of the OAF collection to query.
 * @property {Object} oafParams.filters - The filter configuration for the OAF query.
 * @property {string} oafParams.filters.dateRangeField - The field name for date range filtering.
 * @property {string[]} oafParams.filters.textSearchFields - The field names for text search filtering.
 * @property {Object} oafParams.filters.select - The select filter configuration.
 * @property {string} oafParams.filters.select.field - The field name for select filtering.
 * @property {string[]} oafParams.filters.select.options - The available options for select filtering.
 * @property {string} styleConf - The URL or path to the style configuration for the land registry file features.
 */

const state = {
    // Masterportal state
    supportedDevices: ["Desktop", "Mobile"],
    supportedMapModes: ["2D", "3D"],
    type: "landRegistryFile",
    id: "landRegistryFile",
    name: "additional:modules.landRegistryFile.name",
    description: "additional:modules.landRegistryFile.description",
    icon: "bi-file-earmark-post",
    hasMouseMapInteractions: true,

    // Addon state
    showLoadingSpinner: false,
    landRegistryFileFeatures: [],
    oafParams: {
        url: "",
        collection: "",
        filters: {
            dateRangeField: "",
            textSearchFields: [],
            select: {
                field: "",
                options: [
                    "Bauaufsichtsakte",
                    "Straßenakte",
                    "Grünanlagenakte",
                    "Naturschutzakte",
                    "Wasserwirtschaftsakte",
                    "Kehrakte"
                ]
            }
        }
    },
    styleConf: ""
};

export default state;


