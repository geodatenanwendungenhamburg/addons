/**
 * User type definition
 * @typedef {Object} MapState
 * @property {String[]} supportedDevices list of devices supported
 * @property {String[]} supportedMapModes list of map modes supported
 * @property {String} type type of the component
 * @property {String} id - id of component
 * @property {String} name - displayed as the title
 * @property {String} description The description that should be shown in the button in the menu.
 * @property {String} icon - icon next to the title
 * @property {Boolean} isVisibleInMenu - if true, tool is selectable in menu (config-param)
 * @property {Boolean} deactivateGFI - flag if tool should deactivate gfi (config-param)
 * @property {Boolean} standAlonePortal - flag if tool is used in a standalone portal, then titles are removed via CSS (config-param)
 * @property {Boolean} hasMouseMapInteractions - flag if tool has mouse interactions on the map (config-param)
 * @property {Boolean} isCreatingReport - flag if the report is currently been generated
 * @property {String} selectedRoofId - ID of the selected roof
 * @property {String[]} relevantLayerIds - IDs of roof layers used in this addon (configured in config.json). The addon will wait until the features of these layers are loaded before it starts working.
 * @property {Boolean} isDrawing - flag indicating whether the user is currently drawing on the map
 * @property {String} baseUrl - base URL of the Geoportal used for remote requests (e.g. reverse geocoding)
 * @property {String} geosearchReverseServiceId - id of the reverse geosearch service to get the service url from restConfig
 **/

const state = {
    // Masterportal state
    supportedDevices: ["Desktop", "Mobile", "Table"],
    supportedMapModes: ["2D", "3D"],
    type: "pvObligation",
    id: "pvObligation",
    name: "additional:modules.pvObligation.name",
    description: "additional:modules.pvObligation.description",
    icon: "bi-sun",
    isVisibleInMenu: true,
    deactivateGFI: true,
    standAlonePortal: false,
    hasMouseMapInteractions: true,

    // PvObligation addon state
    isCreatingReport: false,
    selectedRoofId: null,
    relevantLayerIds: [
        "34755", // dachflaechen
        "34753" // dachflaechen_pv
    ],
    baseUrl: "https://geoportal-hamburg.de",
    geosearchReverseServiceId: "5",
    isDrawing: false
};

export default state;


