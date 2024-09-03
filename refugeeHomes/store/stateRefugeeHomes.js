/**
 * User type definition
 * @typedef {Object} RefugeeHomesState
 * @property {Boolean} active if true, viewer will rendered
 * @property {String} id id of the viewer component
 * @property {String} name displayed as title (config-param)
 * @property {String} icon icon next to title (config-param)
 * @property {Boolean} renderToWindow if true, tool is rendered in a window, else in sidebar (config-param)
 * @property {Boolean} resizableWindow if true, window is resizable (config-param)
 * @property {Boolean} isVisibleInMenu if true, tool is selectable in menu (config-param)
 * @property {Boolean} deactivateGFI flag if tool should deactivate gfi (config-param)
 * @property {Number} initialWidth initial width of the sidebar
 * @property {Array} layerIds ids of the refugee homes related layers
 * @property {Array} featureAttributes attributes that are shown in the table
 * @property {Array} features all refugee homes
 * @property {Array} filteredFeatures refugee homes of a district
 * @property {Array} ranking ranking used for sorting
 */

const state = {
    active: false,
    id: "refugeehomes",
    name: "additional:menu.tools.refugeehomes",
    icon: "house-fill",
    renderToWindow: false,
    resizableWindow: true,
    isVisibleInMenu: true,
    deactivateGFI: true,
    initialWidth: 600,
    layerIds: ["33606", "33607", "33608", "33610", "33611", "33609", "33612", "33613"],
    featureAttributes: ["besonderheit", "bezirk", "platzzahl", "stadtteil", "bezeichnung", "geplante_inbetriebnahme", "pfad", "geom", "kategorie", "status"],
    featureImages: {
        ZEA: "fluechtlinge_best_zea_bl.png",
        EA: "fluechtlinge_ea_bl.png",
        INT: "fluechtlinge_int.png",
        IZW: "fluechtlinge_izw.png",
        NOT: "fluechtlinge_not.png",
        UPW: "fluechtlinge_upw.png",
        WUK: "fluechtlinge_wuk.png"
    },
    features: [],
    filteredFeatures: [],
    ranking: [
        "ankunftszentrum",
        "einrichtungen_der_erstaufnahme",
        "in_zukunft_wohnen",
        "interimsstandorte",
        "notstandorte",
        "standorte_in_planung",
        "unterkuenfte_perspektive_wohnen",
        "wohnunterkuenfte"]
};

export default state;
