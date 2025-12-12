/**
 * User type definition
 * @typedef {Object} SimulationToolState
 * @property {string} currentEditableInput - The current editable input (e.g. buildings)
 * @property {string} currentInputName the current input name
 * @property {String} currentPlanningComponent the current open component in planningScenario.
 * @property {Object[]} dataSources - Array of data source configurations.
 * @property {Object[]} drawTypeLabels - the array of type and labels.
 * @property {Array.<Object>} ensembles a list of ensembles
 * @property {boolean} ensemblesLoading flag indicating if ensembles are loading
 * @property {Boolean} [hasMouseMapInteractions=true] If this attribute is true, then all other modules will be deactivated when this attribute is also true. Only one module with this attribute true may be open at the same time, since conflicts can arise in the card interactions.
 * @property {String[]} hiddenSideMenus the side menu which should be hidden.
 * @property {string} id the ID of the simulation tool
 * @property {string} type the type of the simulation tool
 * @property {Object} img object containing keys and links to images
 * @property {Object} jobResultData data of the job result
 * @property {Array.<Object>} jobs a list of jobs
 * @property {boolean} jobsLoading flag indicating if jobs are loading
 * @property {string} mode the current view: 'processes', 'process', 'job' or 'map'
 * @property {Object[]} planningScenarios - The list of planning scenarios.
 * @property {Object[]} planningScenarioCurrentLayout - The current layout object as style.
 * @property {Object[]} planningScenarioDrawIcons - The draw icons.
 * @property {Object[]} planningScenarioDrawTypesMain - The main draw types.
 * @property {String} planningScenarioLabel - The term to describe planning scenarios in the UI for the user.
 * @property {String} planningScenarioLabelPlural - The plural term to describe planning scenarios in the UI for the user.
 * @property {Object[]} planningScenarioHighlightFeatureStyle - The highlight feature style.
 * @property {ol/interaction/Select} planningScenarioSelectInteraction - The current select interactions.
 * @property {Object[]} planningScenarioSelectedDrawType - The selected draw type.
 * @property {Object[]} planningScenarioSelectedDrawTypeMain - The main selected draw type.
 * @property {Object[]} planningScenarioSelectedInteraction - The selected interaction.
 * @property {Object[]} planningScenarioStrokeRange - The stroke range.
 * @property {String} landuseActiveTab - The active tab in the landuse panel (existing or created).
 * @property {Object[]} landuseCurrentLayout - The current layout object as style for buildings or roads.
 * @property {Object[]} landuseRoadDrawIcons - The draw icons for roads.
 * @property {Object[]} landuseRoadDrawTypesMain - The main draw types for roads.
 * @property {number} onJobStatusChange - Counter for job status changes, used to trigger updates.
 * @property {Object|null} process the current process
 * @property {Array.<Object>} processes a list of processes
 * @property {boolean} processesLoading flag indicating if processes are loading
 * @property {Array.<Object>} providers a list of providers
 * @property {boolean} providersLoading flag indicating if providers are loading
 * @property {string|null} selectedEnsembleId the selected ensemble id
 * @property {string|null} selectedJobId the selected job id
 * @property {string|null} selectedProcessId the selected process id
 * @property {String} simulationIdForResults The Id of the simulation that is currently displayed in simulationResult component.
 * @property {Object[]} simulations - A list of all available simulations.
 * @property {String|null} simulationApiUrl The URL for the Urban Model Platform API
 * @property {Object} simulationAreaStyle - The default style for the simulation area (BBOX/Extent of planning scenario)
 * @property {Object} infrastructurePointStyle - The style configuration for infrastructure point features
 * @property {Object} userDetailsCache cache for user details
 * @property {Object|null} agentData - GeoJSON FeatureCollection with agent data
 * @property {String[]} agentTimeSteps - Sorted array of time steps
 * @property {Number} agentCurrentTimeStep - Current time step index
 * @property {Boolean} agentIsPlaying - Whether agent animation is playing
 */
const state = {
    agentData: null,
    agentTimeSteps: [],
    agentCurrentTimeStep: 0,
    agentIsPlaying: false,
    ensembles: [],
    ensemblesLoading: false,
    id: "simulationTool",
    type: "simulationTool",
    name: "additional:modules.tools.simulationTool.toolName",
    currentEditableInput: "",
    currentPlanningComponent: "",
    currentPlanningScenarioId: "",
    currentInputName: "",
    dataSources: [],
    description: "additional:modules.tools.simulationTool.toolDescription",
    hasMouseMapInteractions: true,
    hiddenSideMenus: [],
    icon: "bi-sliders2",
    img: {},
    jobResultData: {},
    jobs: [],
    jobsLoading: false,
    landuseActiveTab: "existing",
    landuseCurrentLayout: {
        fillColor: [60, 95, 148],
        fillTransparency: 0,
        strokeColor: [0, 0, 0],
        strokeWidth: 2,
        pointRadius: 10,
        type: "circle"
    },
    landuseRoadDrawIcons: {
        line: "bi-slash-lg"
    },
    landuseRoadDrawTypesMain: ["line"],
    landuseStationDrawIcons: {
        point: "bi-circle-fill"
    },
    landuseStationDrawTypesMain: ["point"],
    mode: "home-panel",
    onJobStatusChange: 0,
    planningScenarios: [],
    planningScenarioCurrentLayout: {
        fillColor: [0, 0, 0],
        fillTransparency: 100,
        strokeColor: [0, 0, 0],
        strokeWidth: 2
    },
    planningScenarioDrawIcons: {
        box: "bi-square",
        polygon: "bi-octagon"
    },
    planningScenarioDrawTypesMain: ["polygon", "box"],
    planningScenarioLabel: "additional:modules.tools.simulationTool.planningScenario",
    planningScenarioLabelPlural: "additional:modules.tools.simulationTool.planningScenarios",
    planningScenarioHighlightFeatureStyle: {
        fillColor: [0, 0, 0],
        fillTransparency: 100,
        strokeColor: [60, 95, 148, 1],
        strokeWidth: 4
    },
    planningScenarioSelectInteraction: null,
    drawTypeLabels: [
        {type: "polygon", label: "additional:modules.tools.simulationTool.freeForm"},
        {type: "box", label: "additional:modules.tools.simulationTool.rectangle"},
        {type: "line", label: "additional:modules.tools.simulationTool.line"},
        {type: "point", label: "additional:modules.tools.simulationTool.point"}
    ],
    planningScenarioSelectedDrawType: "",
    planningScenarioSelectedDrawTypeMain: "",
    planningScenarioSelectedInteraction: null,
    planningScenarioStrokeRange: [1, 16],
    previousComponentOfSimulation: "home-panel",
    process: null,
    processes: [],
    processesLoading: false,
    providers: [],
    providersLoading: false,
    selectedEnsembleId: null,
    selectedJobId: null,
    selectedProcessId: null,
    simulationApiUrl: null,
    simulationAreaStyle: {
        fillColor: [255, 255, 255, 0],
        strokeColor: [66, 66, 66, 1],
        strokeLineDash: [5, 8],
        strokeWidth: 2
    },
    simulationAreaStyleInvalid: {
        fillColor: [255, 255, 255, 0],
        strokeColor: [225, 0, 25, 1],
        strokeLineDash: [5, 8],
        strokeWidth: 4,
        zIndex: Number.POSITIVE_INFINITY
    },
    infrastructurePointStyle: {
        type: "icon", // "circle" or "icon"
        circle: {
            radius: 6,
            fillColor: [255, 140, 0, 0.8],
            strokeColor: [255, 140, 0, 1],
            strokeWidth: 2
        },
        icon: {
            src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%23FF8C00' d='M15.5 5.5c1 0 1.8-.8 1.8-1.8s-.8-1.7-1.8-1.7-1.8.8-1.8 1.7.8 1.8 1.8 1.8M5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5m0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5m5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5.1 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2l-2.2-2.3M19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5m0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5'/%3E%3C/svg%3E",
            scale: 1.2,
            anchor: [0.5, 0.5],
            anchorXUnits: "fraction",
            anchorYUnits: "fraction"
        }
    },
    simulationIdForResults: "",
    simulations: [],
    userDetailsCache: {}
};

export default state;
