<!-- eslint-disable one-var -->
<template>
    <div class="agent-visualization-modern">
        <section-header
            title="Green4Bikes - Agent Visualization"
        />

        <div
            v-if="isLoading"
            class="loading-overlay"
        >
            <div class="loading-content">
                <div class="progress-container">
                    <p class="loading-text">
                        {{ loadingStep }}
                    </p>
                    <div class="progress-bar">
                        <div
                            class="progress-bar-fill"
                            :style="{ width: loadingProgress + '%' }"
                        />
                    </div>
                    <p class="progress-percentage">
                        {{ loadingProgress }}%
                    </p>
                </div>
            </div>
        </div>

        <div class="visualization-layout">
            <!-- Left Sidebar - Controls -->
            <div class="sidebar-left">
                <!-- File Upload Section (nur wenn keine Daten geladen) -->
                <div
                    v-if="!dataLoaded"
                    class="control-section"
                >
                    <h4 class="section-title">
                        Daten laden
                    </h4>
                    <div class="file-upload">
                        <input
                            id="agent-data-file"
                            ref="fileInput"
                            type="file"
                            accept=".json,.geojson"
                            class="form-control"
                            @change="handleFileUpload"
                        >
                        <label
                            for="agent-data-file"
                            class="file-label"
                        >
                            GeoJSON oder Kompakt-Format Datei auswählen
                        </label>
                    </div>
                </div>

                <!-- Reset Section (nur wenn Daten geladen) -->
                <div
                    v-if="dataLoaded"
                    class="control-section"
                >
                    <h4 class="section-title">
                        Simulation
                    </h4>
                    <button
                        class="btn btn-sm btn-danger w-100"
                        @click="resetSimulation"
                    >
                        <i class="bi bi-arrow-counterclockwise" />
                        Simulation zurücksetzen
                    </button>
                </div>

                <!-- Advanced Time Slider -->
                <div
                    v-if="dataLoaded"
                    class="control-section"
                >
                    <advanced-time-slider :time-engine="timeEngine" />
                </div>

                <!-- Time Series Chart -->
                <div
                    v-if="dataLoaded"
                    class="control-section"
                >
                    <time-series-chart
                        :time-engine="timeEngine"
                        title="Agenten über Zeit"
                    />
                </div>

                <!-- Filter Panel -->
                <div
                    v-if="dataLoaded"
                    class="control-section"
                >
                    <filter-panel />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import {mapGetters, mapActions, mapMutations} from "vuex";
import {transform} from "ol/proj";
import {boundingExtent, buffer} from "ol/extent";
import {Heatmap as HeatmapLayer, WebGLPoints as WebGLPointsLayer} from "ol/layer";
import {Vector as VectorSource} from "ol/source";
import {getCapabilityColor, findClosestFeature, passesFilters} from "../../utils/agentVisualizationHelpers";
import {convertToGeoJSON} from "../../utils/agentTrajectoryParser.js";
import {infrastructureLayerId} from "../../layerIds.js";
import layerCollection from "../../../../src/core/layers/js/layerCollection";
import layerFactory from "../../../../src/core/layers/js/layerFactory";
import mapCollection from "../../../../src/core/maps/js/mapCollection";
import {Select} from "ol/interaction";
import {singleClick} from "ol/events/condition";
import Style from "ol/style/Style";
import Circle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import {LineString, Point} from "ol/geom";
import {Feature} from "ol";
import GeoJSON from "ol/format/GeoJSON";
import SectionHeader from "../SectionHeader.vue";
import AdvancedTimeSlider from "./AdvancedTimeSlider.vue";
import TimeSeriesChart from "./TimeSeriesChart.vue";
import FilterPanel from "./FilterPanel.vue";
import TimeEngine from "../../utils/TimeEngine";
import AgentInterpolator from "../../utils/AgentInterpolator";
import ConvertStyle from "../../js/convertStyle";
import createInfrastructureStyle from "../../js/createInfrastructureStyle";

const AGENT_LAYER_ID = "green4bikes-agents";

export default {
    name: "AgentVisualization",
    components: {
        SectionHeader,
        AdvancedTimeSlider,
        TimeSeriesChart,
        FilterPanel
    },
    data () {
        return {
            dataLoaded: false,
            agentLayer: null,
            trailLayer: null,
            heatmapLayer: null,
            selectInteraction: null,
            selectedAgent: null,
            timeEngine: null,
            interpolator: null,
            updateThrottleTimer: null,
            isUpdating: false,
            styleCache: new Map() // PERFORMANCE: Cache styles by capability
        };
    },
    computed: {
        ...mapGetters("Modules/SimulationTool", [
            "mode"
        ]),
        isLoading () {
            return this.$store.state.agentVisualization?.isLoading || false;
        },
        loadingProgress () {
            return this.$store.state.agentVisualization?.loadingProgress || 0;
        },
        loadingStep () {
            return this.$store.state.agentVisualization?.loadingStep || "";
        }
    },
    watch: {
        "$store.state.agentVisualization.currentTime" () {
            this.updateVisualization();
        },
        "$store.state.agentVisualization.renderMode" (newMode) {
            this.switchRenderMode(newMode);
        },
        "$store.state.agentVisualization.showTrails" () {
            this.updateVisualization();
        },
        "$store.state.agentVisualization.trailLength" () {
            this.updateVisualization();
        },
        "$store.state.agentVisualization.interpolationMode" (newMode) {
            if (this.interpolator) {
                this.interpolator.setMode(newMode);
                this.updateVisualization();
            }
        },
        "$store.state.agentVisualization.showHeatmap" (showHeatmap) {
            if (showHeatmap) {
                this.initializeHeatmap();
            }
            else if (this.heatmapLayer) {
                this.heatmapLayer.setVisible(false);
            }

            if (this.agentLayer) {
                this.agentLayer.layer.setVisible(!showHeatmap);
            }

            this.updateVisualization();
        },
        "$store.state.agentVisualization.planningScenarioData" (newData) {
            if (newData) {
                this.renderPlanningScenarioData(newData);
            }
        },
        "$store.state.agentVisualization.filters": {
            handler () {
                this.updateVisualization();
            },
            deep: true
        }
    },
    async mounted () {
        this.initialize();

        // Check if data was auto-loaded before mounting
        const agentData = this.$store.state.agentVisualization.agentData;

        if (agentData && this.$store.state.agentVisualization.autoLoadTriggered) {
            this.$store.commit("agentVisualization/setAutoLoadTriggered", false);
            await this.processAutoLoadedData(agentData);
        }
    },
    beforeUnmount () {
        this.cleanup();
    },
    methods: {
        ...mapActions("Maps", ["addInteraction", "removeInteraction"]),
        ...mapMutations("Modules/SimulationTool", ["setMode"]),

        /**
         * Initialize visualization
         */
        initialize () {
            // Register Vuex module if not exists
            if (!this.$store.hasModule(["agentVisualization"])) {
                const agentVisualizationModule = require("../../store/agentVisualization").default;

                this.$store.registerModule("agentVisualization", agentVisualizationModule);
            }

            // Initialize TimeEngine
            this.timeEngine = new TimeEngine(this.$store);

            // Initialize Interpolator
            this.interpolator = new AgentInterpolator();
            this.interpolator.setMode(this.$store.state.agentVisualization.interpolationMode);

            // Initialize layer
            this.initializeLayer();

            // Render planning scenario data if available
            const planningScenarioData = this.$store.state.agentVisualization.planningScenarioData;

            if (planningScenarioData) {
                this.renderPlanningScenarioData(planningScenarioData);
            }

            // CRITICAL: Re-apply infrastructure styles after initialization
            // This ensures bike station icons are displayed correctly when loading directly from SimulationResults
            // Use setTimeout to ensure this happens AFTER all rendering is complete
            setTimeout(() => {
                this.reapplyInfrastructureStyles();
            }, 100);
        },

        /**
         * Re-applies infrastructure styles to all point features
         * This is needed when features are loaded from existing layers where icon styles may be lost
         */
        reapplyInfrastructureStyles () {
            const infrastructureLayer = layerCollection.getLayerById(infrastructureLayerId),
                styleConfig = this.$store.state?.Modules?.SimulationTool?.infrastructurePointStyle;

            if (!infrastructureLayer || !styleConfig) {
                console.warn("[AgentVisualization] Cannot reapply styles - layer or config missing", {
                    hasLayer: Boolean(infrastructureLayer),
                    hasConfig: Boolean(styleConfig)
                });
                return;
            }

            // eslint-disable-next-line one-var
            const layerSource = infrastructureLayer.getLayerSource(),
                features = layerSource.getFeatures(),
                pointFeatures = features.filter(f => f.getGeometry()?.getType() === "Point");

            pointFeatures.forEach(feature => {
                // Remove old style properties that might interfere
                feature.unset("styleId", true);
                feature.unset("style", true);

                const style = createInfrastructureStyle(feature, styleConfig);

                if (style) {
                    feature.setStyle(style);
                }
            });
        },

        /**
         * Initialize the agent layer with WebGL for better performance
         */
        initializeLayer () {
            const map = mapCollection.getMap("2D");

            if (!layerCollection.getLayerById(AGENT_LAYER_ID)) {
                // Create vector source for features
                const source = new VectorSource(),
                    // PERFORMANCE: Use WebGL for GPU-accelerated rendering
                    walkingColor = getCapabilityColor("walking"),
                    bikeColor = getCapabilityColor("bike"),
                    rentalBikeColor = getCapabilityColor("cyclingRentalBike"),
                    defaultColor = getCapabilityColor("default"),
                    webglLayer = new WebGLPointsLayer({
                        source: source,
                        style: {
                            "circle-radius": 7,
                            "circle-fill-color": [
                                "case",
                                ["==", ["get", "activeCapability"], "walking"],
                                ["color", ...walkingColor, 0.9],
                                ["==", ["get", "activeCapability"], "bike"],
                                ["color", ...bikeColor, 0.9],
                                ["==", ["get", "activeCapability"], "cyclingRentalBike"],
                                ["color", ...rentalBikeColor, 0.9],
                                ["color", ...defaultColor, 0.9]
                            ],
                            "circle-stroke-color": ["color", 255, 255, 255, 1],
                            "circle-stroke-width": 1.5
                        },
                        // Set Z-Index to ensure proper layering:
                        // 9999999: Agent WebGL Layer (highest - animated agents)
                        // 9999998: Agent Trail Layer (trails/paths)
                        // 9999997: Infrastructure Layer (buildings, roads, stations)
                        // 9999996: Planning Scenario Layer (scenario area, start/end points)
                        zIndex: 9999999
                    });

                webglLayer.setVisible(true);
                webglLayer.set("id", AGENT_LAYER_ID);
                webglLayer.set("name", "Green4Bikes Agents");
                map.addLayer(webglLayer);

                // Store layer info compatible with existing code
                this.agentLayer = {
                    layer: webglLayer,
                    getLayerSource: () => source,
                    get: (key) => webglLayer.get(key),
                    set: (key, value) => webglLayer.set(key, value)
                };
            }
            else {
                this.agentLayer = layerCollection.getLayerById(AGENT_LAYER_ID);
                if (this.agentLayer) {
                    this.agentLayer.layer.setVisible(true);
                }
            }

            // Setup click interaction
            this.selectInteraction = new Select({
                style: this.getHighlightStyle(),
                layers: [this.agentLayer.layer],
                condition: singleClick
            });

            this.selectInteraction.on("select", this.onAgentSelect);
            this.addInteraction(this.selectInteraction);

            // Initialize trail layer (Vector layer for LineStrings, since WebGL doesn't support lines)
            this.initializeTrailLayer();
        },

        /**
         * Initialize trail layer for agent paths
         */
        initializeTrailLayer () {
            const map = mapCollection.getMap("2D"),
                trailSource = new VectorSource();

            this.trailLayer = {
                layer: layerFactory.createLayer({
                    typ: "VECTORBASE",
                    id: AGENT_LAYER_ID + "-trails",
                    name: "Agent Trails"
                }).layer,
                getLayerSource: () => trailSource
            };

            this.trailLayer.layer.setSource(trailSource);
            // Set Z-Index to ensure proper layering:
            // 9999999: Agent WebGL Layer (highest - animated agents)
            // 9999998: Agent Trail Layer (trails/paths)
            // 9999997: Infrastructure Layer (buildings, roads, stations)
            // 9999996: Planning Scenario Layer (scenario area, start/end points)
            this.trailLayer.layer.setZIndex(9999998);
            this.trailLayer.layer.setVisible(true);
            map.addLayer(this.trailLayer.layer);
        },

        /**
         * Initialize heatmap layer
         */
        initializeHeatmap () {
            if (this.heatmapLayer) {
                this.heatmapLayer.setVisible(true);
                return;
            }

            const map = mapCollection.getMap("2D");

            this.heatmapLayer = new HeatmapLayer({
                source: new VectorSource(),
                blur: 15,
                radius: 10,
                weight: () => 1,
                zIndex: 99
            });

            map.addLayer(this.heatmapLayer);
        },

        /**
         * Handle file upload
         */
        async handleFileUpload (event) {
            const file = event.target.files[0];

            if (!file) {
                return;
            }

            try {
                const text = await file.text();
                let geojson = JSON.parse(text);

                // Check if this is a compact AgentTrajectoryCollection format
                if (geojson.type === "AgentTrajectoryCollection") {
                    try {
                        const originalAgentCount = Object.keys(geojson.agents || {}).length;

                        geojson = convertToGeoJSON(geojson);

                        console.warn(`[AgentVisualization] Kompaktes Format erkannt und konvertiert: ${originalAgentCount} Agenten, ${geojson.features?.length || 0} Features`);
                    }
                    catch (error) {
                        throw new Error(`Fehler beim Konvertieren des kompakten Formats: ${error.message}`);
                    }
                }
                // Check if this is a simulation export file (complete format)
                else if (geojson.jobs && geojson.simulationId) {
                    // Try to extract agent GeoJSON from jobs
                    let agentData = null;

                    for (const job of Object.values(geojson.jobs)) {
                        if (job.jobResults && job.jobResults.agents) {
                            agentData = job.jobResults.agents;
                            break;
                        }
                        // Check if jobResults itself is a FeatureCollection
                        if (job.jobResults && job.jobResults.type === "FeatureCollection") {
                            agentData = job.jobResults;
                            break;
                        }
                    }

                    if (!agentData) {
                        throw new Error("Keine Agenten-Daten in der Simulationsdatei gefunden. Bitte exportieren Sie das GeoJSON-Format.");
                    }

                    geojson = agentData;
                }

                // Validate GeoJSON format
                if (!geojson.type || geojson.type !== "FeatureCollection") {
                    throw new Error("Ungültiges Format. Es wird eine GeoJSON FeatureCollection erwartet.");
                }

                if (!geojson.features || !Array.isArray(geojson.features)) {
                    throw new Error("Keine Features in der GeoJSON-Datei gefunden.");
                }

                if (geojson.features.length === 0) {
                    throw new Error("Die GeoJSON-Datei enthält keine Daten (leere Features-Array).");
                }

                // Check for embedded scenario metadata
                // eslint-disable-next-line one-var
                const metadata = geojson.metadata;

                if (metadata && metadata.planningScenarioId) {

                    // Try to find scenario in store
                    const scenarioFromStore = this.$store.state?.Modules?.SimulationTool?.planningScenarios?.find(
                        s => s.id === metadata.planningScenarioId
                    );

                    if (scenarioFromStore) {
                        // Set as current scenario and load layers
                        this.$store.commit("Modules/SimulationTool/setCurrentPlanningScenarioId", metadata.planningScenarioId);
                        this.$store.dispatch("Modules/SimulationTool/updateFeatures", {loadCycleTravelerLayer: true});

                        // Get scenario geometries for visualization
                        const scenarioGeoJSON = this.buildScenarioGeoJSONFromStore(scenarioFromStore);

                        if (scenarioGeoJSON) {
                            this.$store.dispatch("agentVisualization/loadPlanningScenarioData", scenarioGeoJSON);
                        }
                    }
                    else if (metadata.planningScenario) {
                        // Use embedded scenario data
                        const embeddedScenario = metadata.planningScenario,

                            // Add scenario to store
                            currentScenarios = this.$store.state?.Modules?.SimulationTool?.planningScenarios || [];

                        this.$store.commit("Modules/SimulationTool/setPlanningScenarios", [
                            ...currentScenarios,
                            embeddedScenario
                        ]);
                        this.$store.commit("Modules/SimulationTool/setCurrentPlanningScenarioId", embeddedScenario.id);

                        // Trigger layer update
                        this.$store.dispatch("Modules/SimulationTool/updateFeatures", {loadCycleTravelerLayer: true});

                        // Get scenario geometries for visualization
                        // eslint-disable-next-line one-var
                        const scenarioGeoJSON = this.buildScenarioGeoJSONFromStore(embeddedScenario);

                        if (scenarioGeoJSON) {
                            this.$store.dispatch("agentVisualization/loadPlanningScenarioData", scenarioGeoJSON);
                        }
                    }
                    else {
                        console.warn("[AgentVisualization] Scenario ID in metadata but no scenario data available");
                    }
                }

                await this.loadAgentData(geojson);
            }
            catch (error) {
                console.error("[AgentVisualization] Error loading file:", error);
                // Show user-friendly error message
                this.$store.dispatch("Alerting/addSingleAlert", {
                    category: "error",
                    content: `Fehler beim Laden der Datei: ${error.message}`
                }, {root: true});
                // Reset loading state on error
                this.$store.commit("agentVisualization/setIsLoading", false);
            }
        },

        /**
         * Build scenario GeoJSON from store data
         * @param {Object} scenario - Planning scenario from store
         * @returns {Object|null} GeoJSON FeatureCollection or null
         */
        buildScenarioGeoJSONFromStore (scenario) {
            if (!scenario) {
                return null;
            }

            const features = [];

            // Add scenario area features
            if (scenario.scenarioFeature && scenario.scenarioFeature.features) {
                features.push(...scenario.scenarioFeature.features);
            }

            // Add infrastructure and cycleTravelerLayer features
            if (scenario.inputs) {
                Object.values(scenario.inputs).forEach((inputValue) => {
                    if (inputValue && inputValue.features && Array.isArray(inputValue.features)) {
                        features.push(...inputValue.features);
                    }
                });
            }

            if (features.length === 0) {
                return null;
            }

            return {
                type: "FeatureCollection",
                features: features
            };
        },

        /**
         * Helper to update loading progress
         * @param {Number} progress - Progress percentage (0-100)
         * @param {String} step - Step description text
         * @param {Number} delay - Optional delay in ms before continuing
         */
        async updateLoadingProgress (progress, step, delay = 10) {
            this.$store.commit("agentVisualization/setLoadingProgress", progress);
            this.$store.commit("agentVisualization/setLoadingStep", step);
            if (delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        },

        /**
         * Load agent data (called from file upload)
         */
        async loadAgentData (geojson) {
            try {
                // Set loading state
                this.$store.commit("agentVisualization/setIsLoading", true);
                await this.updateLoadingProgress(0, "Lade Agentendaten...", 50);

                // Step 1: Load into Vuex store (this is the heavy operation)
                await this.$store.dispatch("agentVisualization/loadAgentData", geojson);
                await this.updateLoadingProgress(33, "Berechne Zeitreihen...");

                // Step 2: Calculate time series metrics
                await this.$store.dispatch("agentVisualization/calculateTimeSeriesMetrics");
                await this.updateLoadingProgress(66, "Initialisiere Visualisierung...");

                // Step 3: Load into interpolator
                this.interpolator.loadTrajectories(geojson.features);
                this.dataLoaded = true;

                // Step 4: Zoom and update
                this.zoomToAgentData(geojson.features);
                this.updateVisualization();
                await this.updateLoadingProgress(100, "Fertig!", 200);
            }
            catch (error) {
                console.error("Error loading agent data:", error);
                this.$store.dispatch("Alerting/addSingleAlert", {
                    category: "error",
                    content: `Fehler beim Laden der Agentendaten: ${error.message}`
                }, {root: true});
            }
            finally {
                // Always reset loading state
                this.$store.commit("agentVisualization/setIsLoading", false);
            }
        },

        /**
         * Process auto-loaded data (called when data is loaded programmatically)
         */
        async processAutoLoadedData (geojson) {
            if (!geojson || !geojson.features) {
                console.warn("Invalid auto-loaded data");
                return;
            }

            try {
                // Set loading state
                this.$store.commit("agentVisualization/setIsLoading", true);
                await this.updateLoadingProgress(0, "Lade Agentendaten...", 50);

                // Step 1: Load data into Vuex store (this is the heavy operation)
                await this.$store.dispatch("agentVisualization/loadAgentData", geojson);
                await this.updateLoadingProgress(33, "Berechne Zeitreihen...");

                // Step 2: Calculate time series metrics
                await this.$store.dispatch("agentVisualization/calculateTimeSeriesMetrics");
                await this.updateLoadingProgress(66, "Initialisiere Visualisierung...");

                // Step 3: CRITICAL - Call updateFeatures to reload infrastructure from store
                // This is the same approach as when uploading a compact file with embedded scenario metadata
                // It ensures features are loaded fresh from the scenario store with proper icon styles applied at creation time
                // Without this call, the infrastructure features come from the GeoJSON conversion which loses Icon styles
                console.warn("[AgentVisualization] Calling updateFeatures to reload infrastructure with correct styles");
                await this.$store.dispatch("Modules/SimulationTool/updateFeatures", {loadCycleTravelerLayer: true});

                // Step 4: Render planning scenario data if available (bbox, start/end areas)
                const planningScenarioData = this.$store.state.agentVisualization.planningScenarioData;

                if (planningScenarioData) {
                    this.renderPlanningScenarioData(planningScenarioData);
                }

                // Step 5: Load into interpolator
                this.interpolator.loadTrajectories(geojson.features);
                this.dataLoaded = true;

                // Step 6: Zoom and update
                this.zoomToAgentData(geojson.features);
                this.updateVisualization();
                await this.updateLoadingProgress(100, "Fertig!", 200);
            }
            catch (error) {
                console.error("Error processing auto-loaded data:", error);
                this.$store.dispatch("Alerting/addSingleAlert", {
                    category: "error",
                    content: `Fehler beim Verarbeiten der Simulationsdaten: ${error.message}`
                }, {root: true});
            }
            finally {
                // Always reset loading state
                this.$store.commit("agentVisualization/setIsLoading", false);
            }
        },

        /**
         * Zoom map to agent data extent
         * @param {Array} features - GeoJSON features
         */
        zoomToAgentData (features) {
            if (!features || features.length === 0) {
                return;
            }

            try {
                const map = mapCollection.getMap("2D"),
                    view = map.getView(),
                    mapProjection = view.getProjection().getCode(),

                    // Collect all coordinates from features
                    coordinates = features
                        .filter(f => f.geometry && f.geometry.coordinates)
                        .map(f => {
                        // Transform from EPSG:4326 to map projection
                            return transform(
                                f.geometry.coordinates,
                                "EPSG:4326",
                                mapProjection
                            );
                        });

                if (coordinates.length === 0) {
                    return;
                }

                // Calculate bounding extent
                // eslint-disable-next-line one-var
                const extent = boundingExtent(coordinates),
                    bufferedExtent = buffer(extent, (extent[2] - extent[0]) * 1);

                // Fit view to extent with animation
                view.fit(bufferedExtent, {
                    duration: 1000,
                    padding: [100, 100, 100, 100]
                });
            }
            catch (error) {
                console.error("Error zooming to agent data:", error);
            }
        },

        /**
         * Render planning scenario data (scenario area, source, target)
         * Also renders infrastructure and cycleTravelerLayer from store
         * @param {Object} geojson - GeoJSON FeatureCollection (optional, uses store if not provided)
         */
        renderPlanningScenarioData (geojson) {
            const planningScenarioLayer = layerCollection.getLayerById("planning-scenario"),
                infrastructureLayer = layerCollection.getLayerById(infrastructureLayerId),
                geoJsonFormat = new GeoJSON(),
                // Get current scenario from store if geojson not provided
                currentScenario = this.$store.state?.Modules?.SimulationTool?.planningScenarios?.find(
                    scenario => scenario.id === this.$store.state?.Modules?.SimulationTool?.currentPlanningScenarioId
                );

            // === Render Planning Scenario Area (bbox/polygon) ===
            if (planningScenarioLayer) {
                const layerSource = planningScenarioLayer.getLayerSource(),

                    // Check if features are already loaded for this scenario (don't clear/reload if they're already there)
                    existingFeatures = layerSource.getFeatures(),
                    scenarioAlreadyLoaded = existingFeatures.length > 0 &&
                                             currentScenario &&
                                             existingFeatures.some(f => f.get("scenarioId") === currentScenario.id);

                if (scenarioAlreadyLoaded) {
                    planningScenarioLayer.layer.setVisible(true);
                }
                else if (geojson || (currentScenario && currentScenario.scenarioFeature)) {
                    // Only clear if we're loading a different scenario
                    layerSource.clear();

                    // Add features from provided geojson or from store
                    const featuresToRender = geojson || (currentScenario ? currentScenario.scenarioFeature : null);

                    if (featuresToRender && featuresToRender.features) {
                        featuresToRender.features.forEach(feat => {
                            const olFeature = geoJsonFormat.readFeature(feat, {
                                dataProjection: feat.crs || "EPSG:4326",
                                featureProjection: "EPSG:25832"
                            });

                            // Apply style if available
                            if (feat.style) {
                                olFeature.setStyle(ConvertStyle.geoJsonToOpenlayers(feat.style));
                            }

                            // Mark with scenario ID for persistence
                            if (currentScenario) {
                                olFeature.set("scenarioId", currentScenario.id);
                            }

                            layerSource.addFeature(olFeature);
                        });
                    }

                    // Make layer visible
                    planningScenarioLayer.layer.setVisible(true);
                }
            }
            else {
                console.warn("Planning scenario layer not found");
            }

            // === Render Infrastructure (buildings, roads, stations) ===
            if (infrastructureLayer && currentScenario && currentScenario.inputs) {
                const infraLayerSource = infrastructureLayer.getLayerSource(),
                    styleConfig = this.$store.state?.Modules?.SimulationTool?.infrastructurePointStyle;

                // Ensure layer is visible
                infrastructureLayer.layer.setVisible(true);

                // If infrastructure layer is empty, add features from store
                if (infraLayerSource.getFeatures().length === 0) {
                    Object.entries(currentScenario.inputs).forEach(([inputKey, inputValue]) => {
                        // Skip cycleTravelerLayer, it's handled separately below
                        if (inputKey === "cycleTravelerLayer") {
                            return;
                        }

                        if (inputValue?.features && Array.isArray(inputValue.features)) {
                            inputValue.features.forEach(feature => {
                                const olFeature = geoJsonFormat.readFeature(feature, {
                                    dataProjection: feature.crs || "EPSG:4326",
                                    featureProjection: "EPSG:25832"
                                });

                                // Remove old style properties that might interfere
                                olFeature.unset("styleId", true);
                                olFeature.unset("style", true);

                                // Apply infrastructure style (for stations/points)
                                // eslint-disable-next-line one-var
                                const style = createInfrastructureStyle(olFeature, styleConfig);

                                if (style) {
                                    olFeature.setStyle(style);
                                }

                                infraLayerSource.addFeature(olFeature);
                            });
                        }
                    });
                }
                else {
                    infraLayerSource.getFeatures().forEach(feature => {
                        if (feature.getGeometry()?.getType() === "Point") {
                            // CRITICAL: Remove old style properties that prevent icon display
                            feature.unset("styleId", true);
                            feature.unset("style", true);

                            const style = createInfrastructureStyle(feature, styleConfig);

                            if (style) {
                                feature.setStyle(style);
                            }

                            // Force OpenLayers to re-render this feature
                            feature.changed();
                        }
                    });

                    // Force layer refresh
                    infrastructureLayer.layer.changed();
                }
            }

            // === Render cycleTravelerLayer (Start/End points/polygons) ===
            if (currentScenario && currentScenario.inputs && currentScenario.inputs.cycleTravelerLayer) {
                const cycleTravelerData = currentScenario.inputs.cycleTravelerLayer;

                // Add to planning-scenario layer (for visibility with scenario area)
                if (planningScenarioLayer && cycleTravelerData.features) {
                    const layerSource = planningScenarioLayer.getLayerSource();

                    cycleTravelerData.features.forEach(feature => {
                        const olFeature = geoJsonFormat.readFeature(feature, {
                                dataProjection: feature.crs || "EPSG:4326",
                                featureProjection: "EPSG:25832"
                            }),
                            // Check if feature already exists (by ID) to avoid duplicates
                            existingFeature = layerSource.getFeatureById(feature.id);

                        if (currentScenario) {
                            olFeature.set("scenarioId", currentScenario.id);
                        }

                        // Apply style if available
                        if (feature.style) {
                            olFeature.setStyle(ConvertStyle.geoJsonToOpenlayers(feature.style));
                        }

                        if (!existingFeature) {
                            if (feature.id) {
                                olFeature.setId(feature.id);
                            }
                            layerSource.addFeature(olFeature);
                        }
                    });
                }
            }

            // === ALWAYS re-apply infrastructure styles to ensure icons are visible ===
            // This is needed because when features are collected from existing layers,
            // the icon styles may be lost during GeoJSON conversion
            if (infrastructureLayer) {
                const infraLayerSource = infrastructureLayer.getLayerSource(),
                    styleConfig = this.$store.state?.Modules?.SimulationTool?.infrastructurePointStyle;

                infraLayerSource.getFeatures().forEach(feature => {
                    if (feature.getGeometry()?.getType() === "Point") {
                        const style = createInfrastructureStyle(feature, styleConfig);

                        if (style) {
                            feature.setStyle(style);
                        }
                    }
                });
            }
        },

        /**
         * Switch between vector and WebGL rendering modes
         * @param {string} mode - "vector" or "webgl"
         */
        switchRenderMode (mode) {
            // Currently only WebGL is implemented
            // Vector mode would require recreating the layer without WebGL
            console.warn("Render mode switching not fully implemented. Using WebGL.", mode);
            // Could be implemented by recreating the layer:
            // this.cleanup();
            // this.initializeLayer();
            // this.updateVisualization();
        },

        /**
         * Update visualization for current time (throttled)
         */
        updateVisualization () {
            if (!this.dataLoaded) {
                return;
            }

            // Throttle updates to max 30 FPS for smooth slider
            if (this.updateThrottleTimer) {
                return; // Skip if update already scheduled
            }

            this.updateThrottleTimer = setTimeout(() => {
                this.updateThrottleTimer = null;
                this.performUpdate();
            }, 33); // ~30 FPS
        },

        /**
         * Perform the actual visualization update
         */
        performUpdate () {
            if (!this.dataLoaded || this.isUpdating) {
                return;
            }

            this.isUpdating = true;

            const currentTime = this.$store.state.agentVisualization.currentTime,
                showTrails = this.$store.state.agentVisualization.showTrails,
                trailLength = this.$store.state.agentVisualization.trailLength,
                showHeatmap = this.$store.state.agentVisualization.showHeatmap,
                filters = this.$store.state.agentVisualization.filters,
                mapProjection = mapCollection.getMap("2D").getView().getProjection().getCode();

            // Update heatmap if enabled
            if (showHeatmap && this.heatmapLayer) {
                this.updateHeatmap(currentTime, mapProjection);
            }

            // Skip regular rendering if heatmap is shown
            if (showHeatmap) {
                this.isUpdating = false;
                return;
            }

            if (this.agentLayer) {
                // Vector rendering
                const layerSource = this.agentLayer.getLayerSource(),
                    interpolatedPositions = this.interpolator.getAllInterpolatedPositions(currentTime),
                    featuresToAdd = []; // PERFORMANCE: Batch add features

                let visibleCount = 0;

                layerSource.clear();

                interpolatedPositions.forEach((position, agentId) => {
                    // PERFORMANCE: Use indexed lookup instead of filtering all features
                    const agentFeatures = this.$store.state.agentVisualization.featuresByAgent[agentId];

                    if (!agentFeatures || agentFeatures.length === 0) {
                        return;
                    }

                    // PERFORMANCE: Binary search instead of linear scan (O(log n) vs O(n))
                    // eslint-disable-next-line one-var
                    const originalFeature = findClosestFeature(agentFeatures, currentTime);

                    if (!originalFeature) {
                        return;
                    }

                    // Apply filters
                    // eslint-disable-next-line one-var
                    const capability = originalFeature.properties.activeCapability;

                    if (!passesFilters(capability, filters)) {
                        return;
                    }

                    visibleCount++;

                    // Transform coordinates from WGS84 to map projection
                    // eslint-disable-next-line one-var
                    const transformedCoord = transform(position.coordinate, "EPSG:4326", mapProjection),
                        feature = new Feature({geometry: new Point(transformedCoord)});

                    feature.setProperties({
                        agentId: agentId,
                        activeCapability: capability,
                        velocity: position.velocity,
                        routeLength: originalFeature.properties.routeLength
                    });

                    // WebGL handles styling automatically via layer config, no need to set style per feature
                    featuresToAdd.push(feature);
                });

                // PERFORMANCE: Add all features at once instead of one by one
                if (featuresToAdd.length > 0) {
                    layerSource.addFeatures(featuresToAdd);
                }

                // Handle trails in separate vector layer (WebGL doesn't support LineStrings)
                if (showTrails && this.trailLayer) {
                    const trailSource = this.trailLayer.getLayerSource(),
                        trailFeatures = [];

                    trailSource.clear();

                    interpolatedPositions.forEach((position, agentId) => {
                        const agentFeatures = this.$store.state.agentVisualization.featuresByAgent[agentId],
                            originalFeature = findClosestFeature(agentFeatures, currentTime);

                        if (!originalFeature) {
                            return;
                        }

                        // eslint-disable-next-line one-var
                        const capability = originalFeature.properties.activeCapability;

                        // Apply same filters
                        if (!passesFilters(capability, filters)) {
                            return;
                        }

                        // eslint-disable-next-line one-var
                        const trailCoords = this.interpolator.getTrailPath(agentId, currentTime, trailLength);

                        if (trailCoords.length > 1) {
                            const transformedTrailCoords = trailCoords.map(coord => transform(coord, "EPSG:4326", mapProjection)),
                                trailFeature = new Feature({geometry: new LineString(transformedTrailCoords)});

                            trailFeature.setStyle(this.getTrailStyle(originalFeature.properties));
                            trailFeatures.push(trailFeature);
                        }
                    });

                    if (trailFeatures.length > 0) {
                        trailSource.addFeatures(trailFeatures);
                    }
                }

                this.$store.commit("agentVisualization/setVisibleAgentCount", visibleCount);
            }

            this.isUpdating = false;
        },

        /**
         * Update heatmap layer
         */
        updateHeatmap (currentTime, mapProjection) {
            if (!this.heatmapLayer) {
                return;
            }

            const heatmapSource = this.heatmapLayer.getSource(),
                interpolatedPositions = this.interpolator.getAllInterpolatedPositions(currentTime),
                filters = this.$store.state.agentVisualization.filters;

            heatmapSource.clear();

            interpolatedPositions.forEach((position, agentId) => {
                // PERFORMANCE: Use indexed lookup instead of filtering all features
                const agentFeatures = this.$store.state.agentVisualization.featuresByAgent[agentId];

                if (!agentFeatures || agentFeatures.length === 0) {
                    return;
                }

                // PERFORMANCE: Binary search instead of linear scan
                // eslint-disable-next-line one-var
                const originalFeature = findClosestFeature(agentFeatures, currentTime);

                if (!originalFeature) {
                    return;
                }

                // Apply filters
                // eslint-disable-next-line one-var
                const capability = originalFeature.properties.activeCapability;

                if (!passesFilters(capability, filters)) {
                    return;
                }

                // Transform coordinates
                // eslint-disable-next-line one-var
                const transformedCoord = transform(position.coordinate, "EPSG:4326", mapProjection),
                    feature = new Feature({geometry: new Point(transformedCoord)});

                heatmapSource.addFeature(feature);
            });
        },

        /**
         * Get trail style (cached for performance)
         */
        getTrailStyle (properties) {
            const capability = properties.activeCapability;

            // PERFORMANCE: Return cached style if available
            if (this.styleCache.has(`trail-${capability}`)) {
                return this.styleCache.get(`trail-${capability}`);
            }

            // eslint-disable-next-line one-var
            const color = getCapabilityColor(capability),
                style = new Style({
                    stroke: new Stroke({
                        color: [...color, 0.4],
                        width: 2
                    })
                });

            // Cache for future use
            this.styleCache.set(`trail-${capability}`, style);
            return style;
        },

        /**
         * Get highlight style
         */
        getHighlightStyle () {
            return new Style({
                image: new Circle({
                    radius: 9,
                    fill: new Fill({color: [255, 215, 0, 0.9]}),
                    stroke: new Stroke({color: "#000", width: 2})
                })
            });
        },

        /**
         * Get capability label for display
         */
        getCapabilityLabel (capability) {
            const labels = {
                "walking": "Zu Fuß",
                "bike": "Fahrrad",
                "cyclingRentalBike": "Leihrad"
            };

            return labels[capability] || capability;
        },

        /**
         * Handle agent selection
         */
        onAgentSelect (event) {
            if (event.selected.length > 0) {
                this.selectedAgent = event.selected[0].getProperties();
            }
            else {
                this.selectedAgent = null;
            }
        },

        /**
         * Close popup
         */
        closePopup () {
            this.selectedAgent = null;
            if (this.selectInteraction) {
                this.selectInteraction.getFeatures().clear();
            }
        },

        /**
         * Reset simulation and clear all data
         */
        resetSimulation () {
            // Stop playback
            if (this.timeEngine) {
                this.timeEngine.pause();
                this.timeEngine.reset();
            }

            // Clear layers
            if (this.agentLayer) {
                this.agentLayer.getLayerSource().clear();
            }

            if (this.heatmapLayer) {
                const map = mapCollection.getMap("2D");

                map.removeLayer(this.heatmapLayer);
                this.heatmapLayer = null;
            }

            // Clear planning scenario and infrastructure layers
            // eslint-disable-next-line one-var
            const planningScenarioLayer = layerCollection.getLayerById("planning-scenario"),
                infrastructureLayer = layerCollection.getLayerById(infrastructureLayerId);

            if (planningScenarioLayer) {
                planningScenarioLayer.getLayerSource().clear();
            }
            if (infrastructureLayer) {
                infrastructureLayer.getLayerSource().clear();
            }

            // Clear planning scenario data from store to prevent re-rendering
            this.$store.commit("agentVisualization/setPlanningScenarioData", null);

            // Clear interpolator
            if (this.interpolator) {
                this.interpolator = new AgentInterpolator();
            }

            // Clear style cache
            if (this.styleCache) {
                this.styleCache.clear();
            }

            // Reset Vuex store
            this.$store.commit("agentVisualization/setAgentData", null);
            this.$store.commit("agentVisualization/setTimeSteps", []);
            this.$store.commit("agentVisualization/setCurrentTime", 0);
            this.$store.commit("agentVisualization/setPlaying", false);
            this.$store.commit("agentVisualization/setTimeSeriesMetrics", []);

            // Reset file input
            if (this.$refs.fileInput) {
                this.$refs.fileInput.value = "";
            }

            // Mark as not loaded
            this.dataLoaded = false;
        },

        /**
         * Cleanup
         */
        cleanup () {
            // Stop and destroy time engine
            if (this.timeEngine) {
                this.timeEngine.pause();
                this.timeEngine.destroy();
                this.timeEngine = null;
            }

            // Remove heatmap layer
            if (this.heatmapLayer) {
                const map = mapCollection.getMap("2D");

                map.removeLayer(this.heatmapLayer);
                this.heatmapLayer = null;
            }

            // Remove trail layer
            if (this.trailLayer) {
                const map = mapCollection.getMap("2D");

                map.removeLayer(this.trailLayer.layer);
                this.trailLayer = null;
            }

            // Remove select interaction
            if (this.selectInteraction) {
                try {
                    this.selectInteraction.un("select", this.onAgentSelect);
                    this.removeInteraction(this.selectInteraction);
                    this.selectInteraction = null;
                }
                catch (error) {
                    console.error("Error removing select interaction:", error);
                }
            }

            // Hide and clear agent layer
            if (this.agentLayer) {
                this.agentLayer.layer.setVisible(false);
                this.agentLayer.getLayerSource().clear();
            }

            // Clear interpolator
            if (this.interpolator) {
                this.interpolator = null;
            }

            // Clear style cache
            if (this.styleCache) {
                this.styleCache.clear();
            }
        }
    }
};
</script>

<style lang="scss" scoped>
.agent-visualization-modern {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    max-width: 100%;
    height: calc(100vh - 150px);
    overflow-y: auto;
    overflow-x: hidden;
}

.visualization-layout {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    max-width: 100%;
    flex: 1;
    min-height: 0;
}

.sidebar-left {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 0.5rem;
    background: #f8f9fa;
    border-radius: 8px;
    width: 100%;
}

.control-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.section-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #2c3e50;
}

.file-upload {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    input[type="file"] {
        display: none;
    }

    .file-label {
        display: inline-block;
        padding: 0.5rem 1rem;
        background: #0066cc;
        color: white;
        border-radius: 0.25rem;
        cursor: pointer;
        text-align: center;
        transition: background 0.2s;

        &:hover {
            background: #0052a3;
        }
    }
}

.map-area {
    position: relative;
    background: #e9ecef;
    border-radius: 8px;
    overflow: hidden;
}

.info-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.95);
    z-index: 1000;
}

.info-content {
    text-align: center;
    max-width: 400px;
    padding: 2rem;

    i {
        font-size: 4rem;
        color: #6c757d;
        margin-bottom: 1rem;
    }

    h3 {
        font-size: 1.5rem;
        color: #2c3e50;
        margin-bottom: 0.5rem;
    }

    p {
        color: #6c757d;
        margin: 0;
    }
}

.agent-popup {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    max-width: 500px;
    width: 90%;
    z-index: 10000;

    .popup-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid #dee2e6;

        h5 {
            margin: 0;
            font-size: 1rem;
            font-weight: 600;
        }
    }

    .popup-content {
        padding: 1rem;
        max-height: 400px;
        overflow-y: auto;

        .table {
            margin: 0;

            td {
                padding: 0.5rem;
                vertical-align: middle;
                border-color: #dee2e6;
            }

            td:first-child {
                width: 40%;
                white-space: nowrap;
            }
        }
    }
}

.agent-visualization-modern {
    position: relative;
}

.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.loading-content {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.progress-container {
    width: 300px;
}

.loading-text {
    font-size: 1.1rem;
    color: #333;
    margin: 0 0 1rem 0;
    font-weight: 500;
}

.progress-bar {
    width: 100%;
    height: 24px;
    background-color: #e9ecef;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.progress-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #0d6efd 0%, #0a58ca 100%);
    transition: width 0.3s ease;
    border-radius: 12px;
}

.progress-percentage {
    font-size: 0.9rem;
    color: #6c757d;
    margin: 0.5rem 0 0 0;
}

@media (max-width: 992px) {
    .visualization-layout {
        gap: 0.5rem;
    }

    .sidebar-left {
        padding: 0.25rem;
    }
}
</style>
