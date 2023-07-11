/**
 * User type definition
 * @typedef {object} VueAddonState
 * @property {boolean} active if true, VueAddon will rendered
 * @property {string} id id of the VueAddon component
 * @property {string} name displayed as title (config-param)
 * @property {string} icon icon next to title (config-param)
 * @property {boolean} renderToWindow if true, tool is rendered in a window, else in sidebar (config-param)
 * @property {boolean} resizableWindow if true, window is resizable (config-param)
 * @property {boolean} isVisibleInMenu if true, tool is selectable in menu (config-param)
 * @property {boolean} deactivateGFI flag if tool should deactivate gfi (config-param)
 */
const state = {
    active: false,
    id: "areaSelector",
    name: "Manuelle Flächenauswahl für Fachdaten",
    icon: "bi-bounding-box-circles",
    renderToWindow: true,
    resizableWindow: false,
    isVisibleInMenu: true,
    deactivateGFI: false,
    geometry: null,
    readmeUrl: {
<<<<<<< HEAD
<<<<<<< HEAD
        "en-US": "https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev/cosi/manuals/018gebietsauswahl.en.md",
        "de-DE": "https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev/cosi/manuals/018gebietsauswahl.md"
=======
<<<<<<< HEAD
        "en-US": "https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev/cosi/manuals/gebietsauswahl.en.md",
        "de-DE": "https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev/cosi/manuals/gebietsauswahl.md"
=======
        "en-US": "https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev/cosi/manuals/areaselector.en.md",
        "de-DE": "https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev/cosi/manuals/areaselector.md"
>>>>>>> dd718441 (add new addons_3_0_0 structure-add missing addons)
>>>>>>> a3a39d38 (add new addons_3_0_0 structure-add missing addons)
=======
        "en-US": "https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev/cosi/manuals/gebietsauswahl.en.md",
        "de-DE": "https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev/cosi/manuals/gebietsauswahl.md"
>>>>>>> 149927fa (resolve rebase conflicts)
    }
};

export default state;
