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
 * @property {String} roofLayerId - ID of the roof layer
 * @property {String} pvAreaLayerId - ID of the net area layer
 * @property {Boolean} isCreatingReport - flag if the report is currently been generated
 * @property {String} selectedRoofId - ID of the selected roof
 * @property {Number[]} selectedRoofExtent - Geometric extent of the selected roof [minx, miny, maxx, maxy]
 * @property {String[]} relevantLayerIds - IDs of roof layers used in this addon (configured in config.json). The addon will wait until the features of these layers are loaded before it starts working.
 * @property {Boolean} isDrawing - flag indicating whether the user is currently drawing on the map
 * @property {String} baseUrl - base URL of the Geoportal used for remote requests (e.g. reverse geocoding)
 * @property {String} geosearchReverseServiceId - id of the reverse geosearch service to get the service url from restConfig
 * @property {String} styleJson - Json object for project style defined in portalconfigs/resources/style.json
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
    roofLayerId: "34755",
    pvAreaLayerId: "34753",
    isCreatingReport: false,
    selectedRoofId: null,
    selectedRoofExtent: [],
    baseUrl: "https://geoportal-hamburg.de",
    geosearchReverseServiceId: "5",
    isDrawing: false,
    styleJson: ""
};

export default state;


