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
 * @property {Object|null} oafSchema The schema of the OAF collection.
 * @property {Object} oafParams The parameters for querying the OAF collection.
 * @property {string} oafParams.url - The URL of the OAF service.
 * @property {string} oafParams.collection - The name of the OAF collection to query.
 * @property {Object} oafParams.filters - The filter configuration for the OAF query.
 * @property {string} oafParams.filters.dateRangeField - The field name for date range filtering.
 * @property {string[]} oafParams.filters.textSearchFields - The field names for text search filtering.
 * @property {Array<Object>} oafParams.filters.select - The configuration for one or more select filters.
 * @property {string} oafParams.filters.select.field - The field name for select filtering.
 * @property {string[]} oafParams.filters.select.options - The available options for select filtering.
 * @property {Boolean} oafParams.filters.select.multiple - The flag if multiple select is possible in this select filtering.
 * @property {string} styleConf - The URL to the style configuration for the land registry features.
 * @property {Object} styles - The styles applied to the land registry features.
 * @property {Object[]} tableFields - The configuration for the table fields to display in the results.
 * @property {string[]} detailsFields - The configuration for the fields to display in the details view of a selected feature.
 * @property {string|null} selectedDetailFeatureId - The selected feature ID for displaying details.
 * @property {Object} sorting - The sorting configuration for the results table.
 * @property {string} sorting.columnName - The name of the column to sort by.
 * @property {string} sorting.order - The order of sorting, can be "origin", "asc", or "desc".
 * @property {Object[]} mapFeaturesSelected - The array of features currently selected on the map.
 * @property {Boolean} onCenterMap - Indicates whether the map is centered by the click action initiated from the table row.
 * @property {string|null} mapSelectionSource - The source of the map selection, can be "map" or "table".
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
    oafSchema: null,
    oafParams: {
        url: "",
        collection: "",
        filters: {
            dateRangeField: "",
            textSearchFields: [],
            select: [
                {
                    field: "aktenart",
                    options: [
                        "Bauaufsichtsakte",
                        "Straßenakte",
                        "Grünanlagenakte",
                        "Naturschutzakte",
                        "Wasserwirtschaftsakte",
                        "Kehrakte"
                    ],
                    multiple: true
                },
                {
                    field: "bezirk",
                    options: [
                        "Altona",
                        "Bergedorf",
                        "Eimsbüttel",
                        "Hamburg-Mitte",
                        "Hamburg-Nord",
                        "Harburg",
                        "Wandsbek",
                        "HPA"
                    ],
                    multiple: false
                }
            ]
        }
    },
    styleConf: "",
    styles: {},
    tableFields: [],
    detailsFields: [],
    selectedDetailFeatureId: null,
    sorting: {
        columnName: "",
        order: "origin"
    },
    mapFeaturesSelected: [],
    onCenterMap: false,
    mapSelectionSource: null
};

export default state;


