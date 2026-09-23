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
    showLoadingSpinner: false
};

export default state;


