/**
 * User type definition
 * @typedef {Object} DistrictFinderState
 * @property {Boolean} [active=false] - Is activated (will be rendered) or not (config-param).
 * @property {Boolean} [deactivateGFI=false] - Deactivates the gfi if true (config-param).
 * @property {String} [icon="bi-folder2-open"] - Bootstrap icon class (config-param).
 * @property {String} id - The id of the district finder component.
 * @property {boolean} isVisibleInMenu if true, tool is selectable in menu (config-param)
 * @property {String} [referenceLineColor="rgba(255, 0, 0, 0.5)"] Color of the line that indicates the reference value in the chart.
 * @property {String} [name="additional:modules.tools.cosi.districtFinder.title"] - The name of the tool (config-param).
 * @property {Boolean} [renderToWindow=true] - Renders tool in a window if true, otherwise in the sidebar (config-param).
 * @property {Boolean} [resizableWindow=false] - If True, window is resizable (config-param).
 * @property {Number} [numberOfSelectableLevels=2] - The number of possible selectable district levels. Starts at the lowest level.
 * @property {String} [selectedLevelId=""] - The id of the selected level.
 * @property {Object[]} [selectedDistricts=[]] - The districts on which the screening is executed.
 * @property {Object} [chartColors= conditionFalse: "rgb(220, 226, 243, 1)", conditionTrue: "rgb(0, 67, 122, 1)"] - Colors for the diagram depending on whether a condition is true or false
 */
const state = {
    active: false,
    deactivateGFI: true,
    icon: "bi-image",
    id: "districtFinder",
    isVisibleInMenu: true,
    name: "additional:modules.tools.cosi.districtFinder.title",
    readmeUrl: {
        "de-DE": "https://bitbucket.org/geowerkstatt-hamburg/addons/src/dev/cosi/manuals/025GebieteScreening.md"
    },
    referenceLineColor: "rgba(255, 0, 0, 0.5)",
    renderToWindow: true,
    resizableWindow: false,
    selectedLevelId: "",
    selectedDistricts: [],
    chartColors: {
        conditionFalse: "rgb(220, 226, 243, 1)",
        conditionTrue: "rgb(0, 67, 122, 1)"
    }
};

export default state;
