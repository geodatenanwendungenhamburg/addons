<!-- eslint-disable one-var -->
<script>
import AccordionItem from "../../../../src/shared/modules/accordion/components/AccordionItem.vue";
import SwitchInput from "../../../../src/shared/modules/checkboxes/components/SwitchInput.vue";
import ConvertFeature from "../../js/convertFeatures";
import {downloadBlobPerHTML5, downloadBlobPerNavigator} from "../../../../src/shared/modules/buttons/js/exportButtonUtils.js";
import ConvertStyle from "../../js/convertStyle";
import CircleStyle from "ol/style/Circle";
import {getMappedProperty} from "../shared/js/getMappedProperty";
import {Feature} from "ol";
import FeaturesHandler from "../../../../src/modules/statisticDashboard/js/handleFeatures.js";
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
import Fill from "ol/style/Fill";
import isObject from "../../../../src/shared/js/utils/isObject";
import layerCollection from "../../../../src/core/layers/js/layerCollection";
import layerFactory from "../../../../src/core/layers/js/layerFactory";
import {LineString} from "ol/geom";
import {mapActions, mapGetters, mapMutations} from "vuex";
import {Select, Translate} from "ol/interaction";
import {singleClick} from "ol/events/condition";
import Stroke from "ol/style/Stroke";
import Style from "ol/style/Style";
import Text from "ol/style/Text";
import {infrastructureLayerId} from "../../layerIds.js";

export default {
    name: "SimulationResults",
    components: {
        AccordionItem,
        SwitchInput,
        FlatButton
    },
    data () {
        return {
            currentOutput: "",
            finishedTimes: [],
            jobStatusTags: [],
            layers: [],
            outputs: [],
            progressValues: [],
            startTimes: [],
            outputSelectInteraction: {},
            tableFeaturesCollection: {},
            lineFeaturesCollection: {},
            showTextFeatures: true
        };
    },
    computed: {
        ...mapGetters("Modules/SimulationTool", [
            "hasLargeResponse",
            "onJobStatusChange",
            "planningScenarios",
            "simulations",
            "simulationIdForResults"
        ]),
        ...mapGetters("Menu", [
            "mainMenu",
            "mainExpanded"
        ]),

        /**
         * Checks if the Print module is available/configured in the main menu only
         * @returns {Boolean} True if print module is available in main menu
         */
        isPrintModuleAvailable () {
            return this.isModuleInSections(this.mainMenu?.sections, "print");
        },

        /**
         * Get the planning scenario containing the current simulation.
         * @returns {Object} The current planning scenario.
         */
        currentPlanningScenario () {
            return this.planningScenarios?.find(scenario => scenario?.simulations?.[this.simulationIdForResults]);
        },

        /**
         * Get the current simulation based on the current simulation id.
         * @returns {Object} The current simulation.
         */
        currentSimulation () {
            return this.currentPlanningScenario?.simulations?.[this.simulationIdForResults];
        },

        /**
         * Get the earliest start time of all jobs.
         * @returns {String} The earliest time.
         */
        earliestStartTime () {
            const timeValues = this.startTimes
                    .map(time => new Date(time).getTime())
                    .filter(value => Number.isFinite(value)),
                earliestTimeValue = Math.min(...timeValues);

            if (!Number.isFinite(earliestTimeValue)) {
                return "";
            }
            return new Date(earliestTimeValue)
                .toLocaleString("de-DE", {dateStyle: "medium", timeStyle: "medium"});
        },

        /**
         * Get the inputs for inputs accordion.
         * @returns {Object} The inputs.
         */
        inputsToShow () {
            const inputs = {};

            Object.values(this.jobs)
                .map(job => job.requestBody?.inputs)
                .filter(inputsObj => isObject(inputsObj))
                .flatMap(inputsObj => Object.entries(inputsObj))
                .forEach(([inputKey, input]) => {
                    inputs[inputKey] = input;
                });

            return inputs;
        },

        /**
         * Get current jobs object or an empty object.
         * @returns {Object} The jobs object or {}.
         */
        jobs () {
            if (!isObject(this.currentSimulation?.jobs)) {
                return {};
            }
            return this.currentSimulation.jobs;
        },

        /**
         * Average progress of all jobs.
         * @returns {Number} The average progress of all jobs.
         */
        meanProgress () {
            if (!this.progressValues.length) {
                return 0;
            }
            const sum = this.progressValues.reduce((total, each) => total + each, 0);

            return Math.round(sum / this.progressValues.length);
        },

        /**
         * Get the latest finished time of all jobs.
         * @returns {String} The latest finished time.
         */
        latestFinishedTime () {
            const timeValues = this.finishedTimes
                    .map(time => new Date(time).getTime())
                    .filter(value => Number.isFinite(value)),
                latestTimeValue = Math.max(...timeValues);

            if (!Number.isFinite(latestTimeValue)) {
                return "";
            }
            return new Date(latestTimeValue)
                .toLocaleString("de-DE", {dateStyle: "medium", timeStyle: "medium"});
        },

        /**
         * Get the worst (least successful) job status tag.
         * @returns {String} The worst job status tag.
         */
        worstJobStatusTag () {
            const status = ["failed", "accepted", "running", "successful"].find(
                statusByPriority => this.jobStatusTags.includes(statusByPriority)
            );

            if (status) {
                return status;
            }
            console.warn(`No valid job status found: [${this.jobStatusTags.join(", ")}]`);
            return "unknown";
        },

        /**
        * Get the simulation configuration for the current simulation.
        * @returns {Object} The current simulation configuration.
        */
        simulationConfig () {
            return this.simulations.find(simulation => simulation.id === this.currentSimulation.configId);
        },

        /**
         * Get the current style for features (from job results)
         * @returns {Object} The current style object
         */
        currentStyle () {
            return this.jobs ? Object.values(this.jobs).find(job => job.resultStyle)?.resultStyle || null : null;
        },

        /**
         * Get the legend value for the current style.
         * @returns {Object[]} The legend value in array.
         */
        legendValue () {
            if (this.worstJobStatusTag !== "successful") {
                return [];
            }
            return this.getLegendValue(this.currentStyle);
        }
    },
    watch: {
        /**
         * Watches for changes in the job status and updates the job status tags, start times, finished times, progress values and outputs.
         * Also calls showFeatures to display the features on the map.
         * @param {Object} jobs - The jobs object.
         */
        onJobStatusChange: {
            handler () {
                const jobsArr = Object.values(this.jobs || {});

                this.jobStatusTags = jobsArr.map(job => job.jobStatus?.status);
                this.startTimes = jobsArr.map(job => job.jobStatus?.started).filter(time => time);
                this.finishedTimes = jobsArr.map(job => job.jobStatus?.finished).filter(time => time);
                this.progressValues = jobsArr.map(job => job.jobStatus?.progress).filter(progress => Number.isFinite(progress));
                this.outputs = Object.keys(jobsArr[0]?.jobResults || {});
                this.showFeatures(this.simulationIdForResults, this.jobs, this.outputs);
            },
            immediate: true
        },

        /**
         * Sets the visibility of output, only the layer of current output shows.
         * @param {String} val - The current output.
         */
        currentOutput (val) {
            this.layers.forEach(layer => {
                if (typeof layer?.layer?.get !== "function") {
                    return;
                }
                const isOutputSelected = layer.layer.get("id") === `${this.simulationIdForResults}-${val}`;

                layer.layer.setVisible(isOutputSelected);
                if (isOutputSelected && this.isTableMode) {
                    Object.values(this.outputSelectInteraction).forEach(interactionsOnLayer => Object.values(interactionsOnLayer).forEach(interaction => this.removeInteraction(interaction)));
                    Object.values(this.outputSelectInteraction[layer.layer.get("id")]).forEach(interaction => {
                        this.addInteraction(interaction);
                    });
                }
            });
        }
    },
    mounted () {
        if (typeof this.currentPlanningScenario !== "undefined" && this.currentPlanningScenario?.scenarioFeature) {
            this.updateFeatures();
            this.zoomToFeature();
        }
    },
    unmounted () {
        if (this.layers.length) {
            this.layers.forEach(layer => {
                layer.getLayerSource().clear();
            });
        }
        Object.values(this.outputSelectInteraction).forEach(interactionsOnLayer => Object.values(interactionsOnLayer).forEach(interaction => this.removeInteraction(interaction)));
        if (layerCollection.getLayerById(infrastructureLayerId)) {
            layerCollection.getLayerById(infrastructureLayerId).getLayerSource().clear();
        }
    },
    methods: {
        ...mapActions("Modules/SimulationTool", ["updateFeatures", "zoomToFeature"]),
        ...mapActions("Maps", ["addInteraction", "removeInteraction"]),
        ...mapActions("Menu", ["changeCurrentComponent", "toggleMenu"]),
        ...mapActions("Alerting", ["addSingleAlert"]),
        ...mapMutations("Modules/SimulationTool", [
            "setMode"
        ]),

        /**
         * Adds a select for given layer.
         * @param {Number} layerId - The layerId.
         * @param {Object} interaction - The interaction object to add.
         * @param {String} eventType - The type of event to listen for (e.g., "select", "translating").
         * @param {Function} listener - The listener function to handle the select event.
         * @returns {void}
         */
        addSelectInteractionForGivenLayer (layerId, interaction, eventType, listener) {
            if (this.outputSelectInteraction[layerId]?.[eventType] || !isObject(interaction)) {
                return;
            }
            interaction.on(eventType, listener);

            if (!isObject(this.outputSelectInteraction[layerId])) {
                this.outputSelectInteraction[layerId] = {};
            }
            this.outputSelectInteraction[layerId][eventType] = interaction;
            this.addInteraction(interaction);
        },

        /**
         * Creates or updates a layer with the given layerId.
         * @param {String} layerId - The ID of the layer to create or update.
         * @returns {Object} The created or updated layer.
         */
        createOrUpdateLayer (layerId) {
            if (typeof layerCollection.getLayerById(layerId) !== "undefined") {
                const layer = layerCollection.getLayerById(layerId);

                layer.getLayerSource().clear();
                return layer;
            }
            const layer = layerFactory.createLayer({
                typ: "VECTORBASE",
                id: layerId,
                name: layerId
            });

            layer.layer.setZIndex(9999998);
            return layer;
        },

        /**
         * Gets all z-values from a table feature.
         * @param {ol/Feature} feature - The feature to extract z-values from.
         * @returns {String[]} An array of z-values sorted in descending order.
         */
        getAllZValuesFromTableFeature (feature) {
            const featureProps = feature.getProperties(),
                allZValues = Object.entries(featureProps).filter(([key]) => key.startsWith("custom-z-")).sort((a, b) => {
                    const zA = parseFloat(a[0].replace("custom-z-", "")),
                        zB = parseFloat(b[0].replace("custom-z-", ""));

                    return zB - zA;
                });

            return allZValues || [];
        },

        /**
         * Downloads the simulation results as JSON file.
         * @param {String} format - The format to download: "complete" or "geojson"
         * @returns {void}
         */
        downloadResults (format = "complete") {
            if (this.worstJobStatusTag !== "successful" || !this.currentSimulation) {
                return;
            }

            let data, fileName, fileType;
            const baseName = this.currentSimulation.name.replace(/[^a-z0-9]/gi, "_"),
                dateStr = new Date().toISOString().split("T")[0];

            if (format === "geojson") {
                // Download agent data as GeoJSON for AgentVisualization
                const agentData = this.extractAgentGeoJSON();

                if (!agentData || !agentData.features || agentData.features.length === 0) {
                    console.warn("No agent data available for download");
                    this.addSingleAlert({
                        content: "Keine Agenten-Daten zum Herunterladen verfügbar.",
                        category: "warning"
                    });
                    return;
                }

                data = agentData;
                fileName = `agents_${baseName}_${dateStr}.geojson`;
                fileType = "application/geo+json";
            }
            else {
                // Download complete simulation results
                data = {
                    simulationName: this.currentSimulation.name,
                    scenarioName: this.currentPlanningScenario?.name,
                    configId: this.currentSimulation.configId,
                    simulationId: this.simulationIdForResults,
                    timestamp: new Date().toISOString(),
                    status: this.worstJobStatusTag,
                    startTime: this.earliestStartTime,
                    finishedTime: this.latestFinishedTime,
                    inputs: this.inputsToShow,
                    jobs: Object.fromEntries(
                        Object.entries(this.jobs).map(([jobId, job]) => [
                            jobId,
                            {
                                jobStatus: job.jobStatus,
                                jobResults: job.jobResults,
                                requestBody: job.requestBody
                            }
                        ])
                    )
                };
                fileName = `simulation_${baseName}_${dateStr}.json`;
                fileType = "application/json";
            }

            const blob = new Blob([JSON.stringify(data, null, 2)], {type: fileType}),
                succeed = downloadBlobPerNavigator(blob, fileName);

            if (!succeed) {
                downloadBlobPerHTML5(blob, fileName);
            }
        },

        /**
         * Switch to AgentVisualization and load agent data
         */
        switchToAgentVisualization () {
            const agentData = this.extractAgentGeoJSON();
            if (!agentData) {
                console.warn("No agent data available");
                return;
            }

            // Register agentVisualization module if not exists
            if (!this.$store.hasModule(["agentVisualization"])) {
                const agentVisualizationModule = require("../../store/agentVisualization").default;

                this.$store.registerModule("agentVisualization", agentVisualizationModule);
            }

            // Collect planning scenario geometries
            const planningScenarioLayer = layerCollection.getLayerById("planning-scenario"),
                planningScenarioData = this.collectPlanningScenarioGeometries(planningScenarioLayer);

            // Load data into AgentVisualization store
            this.$store.dispatch("agentVisualization/loadAgentData", agentData);

            // Calculate time series metrics
            this.$store.dispatch("agentVisualization/calculateTimeSeriesMetrics");

            // Load planning scenario geometries
            if (planningScenarioData) {
                this.$store.dispatch("agentVisualization/loadPlanningScenarioData", planningScenarioData);
            }

            // Set flag to indicate automatic load
            this.$store.commit("agentVisualization/setAutoLoadTriggered", true);

            // Switch to AgentVisualization mode
            this.setMode("agentVisualization");
        },

        /**
         * Collects geometries from planning scenario layer
         * @param {Object} layer - The planning scenario layer
         * @returns {Object|null} GeoJSON FeatureCollection or null
         */
        collectPlanningScenarioGeometries (layer) {
            if (!layer) {
                return null;
            }

            const layerSource = layer.getLayerSource(),
                features = layerSource.getFeatures();

            if (!features || features.length === 0) {
                return null;
            }

            const GeoJSON = require("ol/format/GeoJSON").default,
                geoJsonFormat = new GeoJSON(),
                geojson = geoJsonFormat.writeFeaturesObject(features, {
                    dataProjection: "EPSG:4326",
                    featureProjection: "EPSG:25832"
                });

            return geojson;
        },

        /**
         * Extracts agent GeoJSON data from job results.
         * @returns {Object|null} GeoJSON FeatureCollection or null if not found
         */
        extractAgentGeoJSON () {
            for (const job of Object.values(this.jobs)) {
                // Check for agents in jobResults
                if (job.jobResults && job.jobResults.agents) {
                    const agents = job.jobResults.agents;

                    // Validate that it's a valid FeatureCollection with data
                    if (agents.type === "FeatureCollection" &&
                        agents.features &&
                        Array.isArray(agents.features) &&
                        agents.features.length > 0) {
                        return agents;
                    }
                }
                // Check if jobResults itself is a FeatureCollection with data
                if (job.jobResults &&
                    job.jobResults.type === "FeatureCollection" &&
                    job.jobResults.features &&
                    Array.isArray(job.jobResults.features) &&
                    job.jobResults.features.length > 0) {
                    return job.jobResults;
                }
            }
            return null;
        },

        /**
         * Recursively searches for a module type in menu sections
         * @param {Array} sections - The menu sections to search in
         * @param {String} moduleType - The module type to search for
         * @returns {Boolean} True if module is found
         */
        isModuleInSections (sections, moduleType) {
            if (!Array.isArray(sections)) {
                return false;
            }

            for (const section of sections) {
                if (Array.isArray(section)) {
                    // Handle array of sections
                    if (this.isModuleInSections(section, moduleType)) {
                        return true;
                    }
                }
                else if (section && typeof section === "object") {
                    // Check if this section has the module type
                    if (section.type === moduleType) {
                        return true;
                    }
                    // Check if this is a folder with elements
                    if (section.type === "folder" && section.elements) {
                        if (this.isModuleInSections(section.elements, moduleType)) {
                            return true;
                        }
                    }
                    // Check if this section has elements
                    if (section.elements && this.isModuleInSections(section.elements, moduleType)) {
                        return true;
                    }
                }
            }
            return false;
        },

        /**
         * Opens the print module in the main menu while preserving simulation state
         * @returns {void}
         */
        openPrintModule () {
            if (!this.isPrintModuleAvailable) {
                return;
            }

            // Ensure main menu is open
            if (!this.mainExpanded) {
                this.toggleMenu("mainMenu");
            }

            // Change to print component in main menu
            this.changeCurrentComponent({
                type: "print",
                side: "mainMenu",
                props: {
                    name: "common:modules.print.name"
                }
            });
        },

        /**
         * Gets the legend value of style.
         * @param {Object} val The current style object.
         * @returns {Object[]} the legend value in array.
         */
        getLegendValue (val) {
            if (!isObject(val)) {
                return [];
            }

            const extractedValue = [];

            if (val?.type === "polygon") {
                val.styles?.forEach((data, index) => {
                    const legendObj = {
                            "name": data.value
                        },
                        style = {
                            "polygonFillColor": data.style?.fillColor,
                            "polygonStrokeColor": data.style?.strokeColor,
                            "polygonStrokeWidth": data.style?.strokeWidth
                        };

                    extractedValue[index] = FeaturesHandler.prepareLegendForPolygon(legendObj, style);
                });
            }

            return extractedValue;
        },

        /**
         * Formats key-value pairs into a string representation.
         * @param {String[][]} list - An array of key-value pairs, where each pair is an array of [key, value].
         * @param {String} prefixToRemove - The prefix to remove from the keys.
         * @param {String} [suffix="m"] - The suffix to append to the keys (default is "m").
         * @returns {String} A string representation of the key-value pairs, each pair on a new line.
         */
        formatKeyValuePairs (list, prefixToRemove, suffix = "m") {
            // If there's only one entry and it's a "value" property (no real 3D coordinates),
            // show it simply without height formatting
            if (list.length === 1 && list[0][0] === "custom-z-value") {
                return `Wert: ${list[0][1]}`;
            }

            // Calculate max length for height values (that will have suffix)
            const maxKeyLength = Math.max(...list.map(([k]) => String(k).length), 0);

            return list.map(([key, value]) => {
                // Check if key is valid (not null, undefined, or empty string)
                const keyString = key !== null && key !== undefined && key !== "" ? String(key) : "",
                    keyWithSuffix = keyString ? `${keyString}${suffix}` : "",
                    paddedKey = keyWithSuffix.padEnd(maxKeyLength + suffix.length, " ");

                return `${paddedKey.slice(prefixToRemove.length)}: ${value}`;
            }).join("\n");
        },

        /**
         * Creates a feature style for displaying a table like view with key-value pairs.
         * @param {String} tableText - The text to display in the table.
         * @returns {ol/style/Style} An OpenLayers style object with a circle and text style for the feature.
         */
        getFeatureStyleTable (tableText) {
            return new Style({
                text: new Text({
                    text: tableText,
                    justify: "left",
                    font: "11px monospace",
                    fill: new Fill({color: "#000"}),
                    stroke: new Stroke({color: "#fff", width: 3}),
                    padding: [2, 2, 2, 2],
                    backgroundFill: new Fill({color: "rgba(255, 255, 255, 0.8)"}),
                    backgroundStroke: new Stroke({color: "black", width: 1})
                })
            });
        },

        /**
         * Creates a feature style for displaying a circle with a specific style.
         * @returns {ol/style/Style} An OpenLayers style object with a circle style for the feature.
         */
        getFeatureStyleCircle () {
            return new Style({
                image: new CircleStyle({
                    radius: 8,
                    fill: new Fill({color: "rgba(255, 153, 0, 0.8)"}),
                    stroke: new Stroke({color: "#fff", width: 2})
                })
            });
        },

        getMappedProperty,

        /**
         * Sets the Feature style according to the value of property.
         * @param {ol/Feature} feature - The feature.
         * @param {Object} currentStyles - The current style objects.
         * @returns {void}
         */
        setFeatureStyle (feature, currentStyles) {
            let style = null;

            if (!isObject(currentStyles) || !Array.isArray(currentStyles?.styles)) {
                feature.setStyle(style);
                return;
            }

            if (currentStyles?.type === "polygon") {
                style = currentStyles.styles.find(styleObj => feature.get(currentStyles?.property) === styleObj?.value)?.style;
                style = typeof style !== "undefined" ? ConvertStyle.geoJsonToOpenlayers(style) : null;
            }

            feature.setStyle(style);
        },

        /**
         * Sets the current output.
         * @param {String} output - The output.
         * @returns {void}
         */
        setCurrentOutput (output) {
            this.currentOutput = output;
        },

        /**
         * Shows features in map.
         * @param {String} simulationId the simulation id.
         * @param {Object} jobs - The jobs.
         * @param {String[]} outputs - The output array.
         * @returns {void}
         */
        showFeatures (simulationId, jobs, outputs) {
            if (typeof simulationId !== "string" || !isObject(jobs) || !Array.isArray(outputs)) {
                return;
            }

            outputs.forEach(output => {
                const layerId = `${simulationId}-${output}`,
                    layer = this.createOrUpdateLayer(layerId),
                    layerSource = layer.getLayerSource();

                Object.values(jobs).forEach(job => {
                    const featuresToAdd = ConvertFeature.geoJsonToOpenlayers(job.jobResults?.[output]?.features || job.jobResults?.[output]?.value?.features || []),
                        foundProcess = this.simulationConfig?.processes.find(process => process?.id === job.jobStatus.processID) || {},
                        isTableMode = foundProcess?.renderingOptions?.featureRenderMode === "table";

                    if (isTableMode) {
                        this.processAndStylePointFeaturesForTable(layerId, layer, layerSource, featuresToAdd, simulationId, foundProcess?.renderingOptions?.attributeToShow);
                        return;
                    }
                    featuresToAdd?.forEach(feature => {
                        feature.set("simulationId", simulationId);
                        this.setFeatureStyle(feature, job.resultStyle);
                    });
                    layerSource.addFeatures(featuresToAdd);
                });

                if (!this.layers.some(existingLayer => existingLayer?.get?.("id") === layerId)) {
                    this.layers.push(layer);
                }
                if (!layerCollection.getLayerById(layerId)) {
                    layerCollection.addLayer(layer);
                }
            });
            this.setCurrentOutput(outputs[0]);
        },

        /**
         * Stores a translated point feature and creates a line feature connecting the original point to the translated point.
         * It updates the table features collection with the translated point and its properties.
         * @param {ol/Feature} feature - The original feature to be translated.
         * @param {String} layerId - The ID of the layer to which the feature belongs.
         * @param {String} toShowAttrKey - The attribute key to show in the table.
         * @param {String} originalXYKey - The key used to store the original XY coordinates of the feature.
         * @param {String} customZKey - The key used to identify custom Z values in the table features.
         * @returns {void}
         */
        storeTranslatedPointAndCreateLine (feature, layerId, toShowAttrKey, originalXYKey, customZKey) {
            const featureGeometry = feature.getGeometry(),
                coordinates = featureGeometry.getCoordinates(),
                [x, y, z] = Array.isArray(coordinates) ? coordinates : coordinates.toString().split(","),
                coordinate2d = `${x},${y}`;
            let zValue,
                propertyKey;

            if (!isObject(this.tableFeaturesCollection[layerId][coordinate2d])) {
                const clonedFeature = feature.clone();

                clonedFeature.getGeometry().translate(0, 20);
                this.tableFeaturesCollection[layerId][coordinate2d] = clonedFeature;
            }
            Object.entries(feature.getProperties()).forEach(([key, value]) => {
                if (toShowAttrKey === key || key.startsWith(toShowAttrKey)) {
                    zValue = typeof value === "undefined" ? "---" : value;
                }
            });

            // If we're showing 'value' property and no z-coordinate exists, use a different approach
            if (toShowAttrKey === "value" && (z === undefined || z === null || z === "")) {
                // Use "value" as the key instead of z-coordinate
                propertyKey = "value";
                this.tableFeaturesCollection[layerId][coordinate2d].set(customZKey + propertyKey, zValue);
            }
            else {
                // Use z-coordinate for height values (with default to "0" if missing)
                const validZ = z !== undefined && z !== null && z !== "" ? z : "0";

                propertyKey = validZ;
                this.tableFeaturesCollection[layerId][coordinate2d].set(customZKey + validZ, zValue);
            }
            this.tableFeaturesCollection[layerId][coordinate2d].set(originalXYKey, coordinate2d);
            this.lineFeaturesCollection[layerId][`${coordinate2d},${propertyKey}`] = new Feature(new LineString([
                featureGeometry.getCoordinates(),
                this.tableFeaturesCollection[layerId][coordinate2d].getGeometry().getCoordinates()
            ]));
        },

        /**
         * Processes and styles point features for table view.
         * @param {String} layerId - The ID of the layer.
         * @param {Object} layer - The layer object containing the OpenLayers layer.
         * @param {ol/source/Vector} layerSource - The source of the layer.
         * @param {ol/Feature[]} geojsonFeature - The GeoJSON features to process.
         * @param {String} simulationId - The simulation ID.
         * @param {String} toShowAttrKey - The attribute key to show in the table.
         * @returns {void}
         */
        processAndStylePointFeaturesForTable (layerId, layer, layerSource, geojsonFeature, simulationId, toShowAttrKey) {
            const originalXYKey = "og-xy",
                customZKey = "custom-z-";

            this.tableFeaturesCollection[layerId] = this.tableFeaturesCollection[layerId] || {};
            this.lineFeaturesCollection[layerId] = this.lineFeaturesCollection[layerId] || {};
            this.addSelectInteractionForGivenLayer(layerId, new Select({
                style: null,
                layers: [layer.layer],
                filter: feature => typeof feature.get("simulationId") !== "undefined",
                toggleCondition: singleClick,
                hitTolerance: 10
            }), "select", event => this.onFeatureSelect(event, `${this.simulationIdForResults}-${this.currentOutput}`, layerSource, customZKey));

            geojsonFeature.forEach(feature => {
                if (feature.getGeometry()?.getType() === "Point") {
                    this.storeTranslatedPointAndCreateLine(feature, layerId, toShowAttrKey, originalXYKey, customZKey);
                }
                feature.set("simulationId", simulationId);
                feature.setStyle(this.getFeatureStyleCircle());
            });
            Object.values(this.tableFeaturesCollection[layerId]).forEach(feature => {
                const allZValues = this.getAllZValuesFromTableFeature(feature);

                feature.setStyle(this.getFeatureStyleTable(this.formatKeyValuePairs(allZValues, customZKey)));
            });
            layerSource.addFeatures([...geojsonFeature, ...Object.values(this.tableFeaturesCollection[layerId]), ...Object.values(this.lineFeaturesCollection[layerId])]);

            this.addSelectInteractionForGivenLayer(layerId, new Translate({
                filter: feature => typeof feature.get(originalXYKey) !== "undefined"
            }), "translating", event => this.onFeatureMove(event, `${this.simulationIdForResults}-${this.currentOutput}`, originalXYKey, customZKey));
        },

        /**
         * Handles the movement of a feature during translation.
         * It updates the coordinates of the line features associated with the moved feature.
         * @param {Object} event - The event object containing the moved features.
         * @param {String} layerId - The ID of the layer containing the features.
         * @param {String} originalXYKey - The key used to store the original XY coordinates of the feature.
         * @param {String} customZKey - The key used to identify custom Z values in the table features.
         * @returns {void}
         */
        onFeatureMove (event, layerId, originalXYKey, customZKey) {
            if (!event.features.getLength()) {
                return;
            }
            const tableFeature = event.features.getArray()[0],
                tableFeatureProps = tableFeature?.getProperties?.(),
                z = [];
            let xy;

            if (!isObject(tableFeature.getGeometry())) {
                return;
            }
            Object.entries(tableFeatureProps).forEach(([key, value]) => {
                if (key === originalXYKey) {
                    xy = value;
                }
                else if (key.startsWith(customZKey)) {
                    z.push(key.replace(customZKey, ""));
                }
            });
            z.forEach(zValue => {
                this.lineFeaturesCollection[layerId][`${xy},${zValue}`].getGeometry().setCoordinates([
                    [...xy.split(",").map(val => parseFloat(val)), parseFloat(zValue)],
                    tableFeature.getGeometry().getCoordinates()
                ]);
            });
        },

        /**
         * Handles feature selection and deselection events.
         * If a feature is selected, it updates the style of the corresponding table feature and toggles the visibility of related line features.
         * If a feature is deselected, it resets the style of the corresponding table feature and shows the related line features.
         * @param {Object} event - The event object containing selected and deselected features.
         * @param {String} layerId - The ID of the layer containing the features.
         * @param {ol/source/Vector} layerSource - The source of the layer containing the features.
         * @param {String} customZKey - The key used to identify custom Z values in the table features.
         * @returns {void}
         */
        onFeatureSelect (event, layerId, layerSource, customZKey) {
            const currentFeature = event.selected[0] || event.deselected[0],
                coordinates = currentFeature.getGeometry().getCoordinates(),
                // 3d coordinates: take only x,y for key
                coordinatesFor2D = coordinates.length > 2 ? coordinates.slice(0, -1) : coordinates,
                keyOfTableFeature = coordinatesFor2D.join(","),
                tableFeature = this.tableFeaturesCollection[layerId][keyOfTableFeature],
                hideFeatures = Array.isArray(event.selected) && event.selected.length > 0;

            if (tableFeature) {
                tableFeature.setStyle(hideFeatures ? new Style(null) : this.getFeatureStyleTable(this.formatKeyValuePairs(this.getAllZValuesFromTableFeature(tableFeature), customZKey)));
                const multipleLines = Object.keys(this.lineFeaturesCollection[layerId]).filter(key => key.startsWith(keyOfTableFeature)),
                    bulkUpdate = [];

                multipleLines.forEach(featureXYZ => {
                    bulkUpdate.push(this.lineFeaturesCollection[layerId][featureXYZ]);
                });
                hideFeatures ? layerSource.removeFeatures(bulkUpdate) : layerSource.addFeatures(bulkUpdate);
            }
        },
        toggleTextFeaturesVisibility (show) {
            const customZKey = "custom-z-";

            this.layers.forEach(layer => {
                const layerId = layer.layer?.get("id"),
                    tableFeatures = this.tableFeaturesCollection[layerId] || {},
                    lineFeatures = this.lineFeaturesCollection[layerId] || {},
                    bulkUpdate = Object.values(lineFeatures),
                    layerSource = layer.getLayerSource();

                Object.values(tableFeatures).forEach(feature => {
                    if (show) {
                        feature.setStyle(this.getFeatureStyleTable(this.formatKeyValuePairs(this.getAllZValuesFromTableFeature(feature), customZKey)));
                    }
                    else {
                        feature.setStyle(new Style(null));
                    }
                });

                show ? layerSource.addFeatures(bulkUpdate) : layerSource.removeFeatures(bulkUpdate);
            });
        }
    }
};
</script>

<template>
    <div>
        <div v-if="simulationIdForResults">
            <div>
                <div
                    class="d-flex flex-column"
                >
                    <div
                        class="me-2 ps-label"
                    >
                        {{ $t('additional:modules.tools.simulationTool.started') }}
                    </div>
                    <div
                        class="me-2 font-bold"
                    >
                        {{ earliestStartTime }}
                    </div>
                </div>
                <div
                    v-if="latestFinishedTime"
                    class="d-flex flex-column"
                >
                    <div
                        class="me-2 ps-label"
                    >
                        {{ $t('additional:modules.tools.simulationTool.finished') }}
                    </div>
                    <div
                        class="me-2 font-bold"
                    >
                        {{ latestFinishedTime }}
                    </div>
                </div>
                <div
                    class="d-flex flex-column"
                >
                    <div
                        class="me-2 ps-label"
                    >
                        {{ $t('additional:modules.tools.simulationTool.status') }}
                    </div>
                    <div
                        class="me-2 ps-label"
                    >
                        <span
                            v-if="worstJobStatusTag === 'successful'"
                            class="status success"
                        >
                            {{ $t('additional:modules.tools.simulationTool.successful') }}
                        </span>
                        <span
                            v-else-if="worstJobStatusTag === 'failed'"
                            class="status failed"
                        >
                            {{ $t('additional:modules.tools.simulationTool.failed') }}
                        </span>
                        <span
                            v-else-if="worstJobStatusTag === 'unknown'"
                            class="status unknown"
                        >
                            {{ $t('additional:modules.tools.simulationTool.unknown') }}
                        </span>
                        <span
                            v-else
                            class="status running"
                        >
                            {{ $t('additional:modules.tools.simulationTool.progress') }}: {{ meanProgress }}%
                        </span>
                    </div>
                </div>
            </div>
            <AccordionItem
                v-if="currentSimulation?.jobs"
                id="simulation-results-accordion-inputs"
                class="ms-1 my-1"
                :title="$t('additional:modules.tools.simulationTool.inputParameters')"
            >
                <div class="input-parameters-container">
                    <div
                        v-for="(input, inputKey) in inputsToShow"
                        :key="inputKey"
                    >
                        <div
                            v-if="typeof input === 'object' && input?.type !== 'FeatureCollection' && !Array.isArray(input)"
                            class="container"
                        >
                            <div
                                v-for="(property, propertyKey) in input"
                                :key="`${inputKey}-${propertyKey}`"
                                class="py-1 row"
                            >
                                <div class="col col-md-5">
                                    {{ getMappedProperty(propertyKey, simulationConfig?.inputs?.[inputKey]?.propertiesMapping) + ":" }}
                                </div>
                                <div class="col col-md-7 font-bold align-self-center">
                                    {{ property }}
                                </div>
                            </div>
                        </div>
                        <div
                            v-else-if="typeof input !== 'object' && getMappedProperty(inputKey, simulationConfig?.inputs?.[inputKey]?.propertiesMapping) !== ''"
                            class="py-1 row"
                        >
                            <div class="col col-md-5">
                                {{ getMappedProperty(inputKey, simulationConfig?.inputs?.[inputKey]?.propertiesMapping) + ":" }}
                            </div>
                            <div class="col col-md-7 font-bold align-self-center">
                                {{ input }}
                            </div>
                        </div>
                    </div>
                </div>
            </AccordionItem>
            <hr>
            <div
                v-if="worstJobStatusTag === 'successful'"
                class="result-output-container"
            >
                <h5
                    class="mb-2"
                >
                    {{ $t('additional:modules.tools.simulationTool.showResults') }}
                </h5>
                <div
                    class="list-group list-group-flush mt-3"
                >
                    <div
                        v-for="output in outputs"
                        :key="output"
                        class="form-check list-group-item list-group-item-action"
                        :class="output === currentOutput ? 'selected-ouput' : ''"
                    >
                        <input
                            :id="output"
                            :value="output"
                            class="form-check-input d-flex justify-content-between align-items-center"
                            type="radio"
                            :checked="output === currentOutput"
                            @input="setCurrentOutput(output)"
                        >
                        <label
                            class="form-check-label d-flex justify-content-between align-items-center"
                            :for="output"
                        >
                            {{ getMappedProperty(output, simulationConfig?.outputs?.propertiesMapping) }}
                        </label>
                    </div>
                </div>
                <div class="form-check form-switch mt-2">
                    <SwitchInput
                        id="showTextFeatures"
                        :checked="showTextFeatures"
                        :label="$t('additional:modules.tools.simulationTool.showMeasuredValues')"
                        :aria="$t('additional:modules.tools.simulationTool.showMeasuredValues')"
                        @change="toggleTextFeaturesVisibility($event.target.checked)"
                    />
                </div>
            </div>
            <div v-if="legendValue.length">
                <hr>
                <AccordionItem
                    id="simulation-results-accordion-legend"
                    class="mt-2"
                    :title="$t('additional:modules.tools.simulationTool.legend')"
                >
                    <h6
                        class="mb-2"
                    >
                        {{ currentStyle?.property }}
                    </h6>
                    <div class="row">
                        <div
                            v-for="legendObj in legendValue"
                            :key="legendObj.name"
                            class="row legend"
                        >
                            <div>
                                <img
                                    :alt="legendObj.name"
                                    :src="legendObj.graphic"
                                    class="col-3 col-xs px-0 left"
                                >
                                <span
                                    class="col col-xs legend-names px-0 ms-1"
                                >
                                    {{ legendObj.name }}
                                </span>
                            </div>
                        </div>
                    </div>
                </AccordionItem>
            </div>
        </div>
        <div
            v-else
            class="alert alert-primary"
        >
            {{ $t('additional:modules.tools.simulationTool.noJobsSelected') }}
        </div>
        <div
            class="my-1"
        >
            <form>
                <div
                    class="d-flex justify-content-between button"
                >
                    <FlatButton
                        id="back"
                        :icon="'bi bi-gear'"
                        :aria-label="$t('additional:modules.tools.simulationTool.showProperties')"
                        :text="$t('additional:modules.tools.simulationTool.showProperties')"
                        @click="() => setMode('simulationParameter')"
                    />
                    <div v-if="worstJobStatusTag === 'successful'">
                        <FlatButton
                            v-if="!hasLargeResponse && extractAgentGeoJSON() && simulationIdForResults && simulationIdForResults.includes('green4Bikes')"
                            id="show-agent-visualization"
                            class="me-2"
                            :icon="'bi bi-play-circle'"
                            :aria-label="'Agent Visualization anzeigen'"
                            :text="'Simulation anzeigen'"
                            @click="switchToAgentVisualization"
                        />
                        <FlatButton
                            id="download-results-complete"
                            class="me-2"
                            :icon="'bi bi-download'"
                            :aria-label="$t('additional:modules.tools.simulationTool.downloadResults')"
                            :text="$t('additional:modules.tools.simulationTool.downloadComplete')"
                            @click="() => downloadResults('complete')"
                        />
                        <FlatButton
                            v-if="extractAgentGeoJSON()"
                            id="download-results-geojson"
                            :icon="'bi bi-geo-alt'"
                            :aria-label="$t('additional:modules.tools.simulationTool.downloadGeoJSON')"
                            :text="$t('additional:modules.tools.simulationTool.downloadGeoJSON')"
                            @click="() => downloadResults('geojson')"
                        />
                    </div>
                    <!-- If print module is available, show print button -->
                    <!--<FlatButton
                        v-if="isPrintModuleAvailable"
                        id="print-results-bottom"
                        class="mx-2"
                        :icon="'bi bi-printer'"
                        :aria-label="'Simulationsergebnisse drucken'"
                        :text="'Drucken'"
                        @click="openPrintModule"
                    /> -->
                </div>
            </form>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";
.selected-ouput {
    background-color: $light_blue;
}
.result-output-container .form-check {
    margin-bottom: 0;
}
.result-output-container label {
    padding-left: 1.313rem;
}
.result-output-container .form-check .form-check-input {
    margin-left: -0.625rem;
}
.result-output-container {
    margin-left: 0.625rem;
}
.result-output-container .list-group-item-action {
    margin-left: 0.625rem;
}
.result-output-container .list-group-item-action:active {
    background-color: $light_blue;
}
.ps-label {
    font-size: $font_size_sm;
}
.font-bold {
    font-family: $font_family_accent;
}
.status {
    line-height: 1.125rem;
    text-align: center;
    user-select: none;
    color: #ffffff;
    display: inline-block;
    padding: 0.125rem 0.625rem;
    font-size: 0.75rem;
    font-weight: 100;
    vertical-align: middle;
    border-radius: 0.938rem;
}
.running {
    background-color: #3C5F94;
    border-color: #3C5F94;
}
.success {
    background-color: #198754;
    border-color: #198754;
}
.unknown {
    background-color: #6c757d;
    border-color: #6c757d;
}
.failed {
    background-color: #e10019;
    border-color: #e10019;
}
.legend {
    img {
        width: 30px;
    }
    .legend-names {
        font-size: $font_size_sm;
        align-content: center;
    }
}

/* prevent scroll bar in accordion item with a lot of parameters */
#simulation-results-accordion-inputs {
    .accordion-body {
        overflow: visible !important;
        max-height: none !important;
    }
}

.input-parameters-container {
    width: 100%;
    overflow: visible;
    height: auto;
    max-height: none;
}
</style>
