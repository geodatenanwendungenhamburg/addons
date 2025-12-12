<template>
    <div class="agent-visualization-modern">
        <section-header
            title="Green4Bikes - Agent Visualization"
        />

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
                            GeoJSON Datei auswählen
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
import SectionHeader from "../SectionHeader.vue";
import AdvancedTimeSlider from "./AdvancedTimeSlider.vue";
import TimeSeriesChart from "./TimeSeriesChart.vue";
import FilterPanel from "./FilterPanel.vue";
import TimeEngine from "../../utils/TimeEngine";
import AgentInterpolator from "../../utils/AgentInterpolator";

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
            isUpdating: false
        };
    },
    computed: {
        ...mapGetters("Modules/SimulationTool", [
            "mode"
        ])
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
    mounted () {
        this.initialize();
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

                // Check if this is a simulation export file (complete format)
                if (geojson.jobs && geojson.simulationId) {
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

                this.loadAgentData(geojson);
            }
            catch (error) {
                console.error("Error loading file:", error);
            }
        },

        /**
         * Load agent data
         */
        loadAgentData (geojson) {
            // Load into Vuex store
            this.$store.dispatch("agentVisualization/loadAgentData", geojson);

            // Load into interpolator
            this.interpolator.loadTrajectories(geojson.features);

            // Calculate time series metrics
            this.$store.dispatch("agentVisualization/calculateTimeSeriesMetrics");

            this.dataLoaded = true;

            // Zoom to agent data extent
            this.zoomToAgentData(geojson.features);

            // Update visualization
            this.updateVisualization();
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
         * @param {Object} geojson - GeoJSON FeatureCollection
         */
        renderPlanningScenarioData (geojson) {
            const planningScenarioLayer = layerCollection.getLayerById("planning-scenario");

            if (!planningScenarioLayer) {
                console.warn("Planning scenario layer not found");
                return;
            }

            // eslint-disable-next-line one-var
            const layerSource = planningScenarioLayer.getLayerSource(),
                GeoJSON = require("ol/format/GeoJSON").default,
                geoJsonFormat = new GeoJSON();

            // Clear existing features
            layerSource.clear();

            // Add features from planning scenario data
            if (geojson && geojson.features) {
                const features = geoJsonFormat.readFeatures(geojson, {
                    dataProjection: "EPSG:4326",
                    featureProjection: "EPSG:25832"
                });

                features.forEach(feature => {
                    layerSource.addFeature(feature);
                });
            }

            // Make layer visible
            planningScenarioLayer.layer.setVisible(true);
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
         * Get style for agent
         */
        getAgentStyle (properties) {
            const color = getCapabilityColor(properties.activeCapability);

            return new Style({
                image: new Circle({
                    radius: 6,
                    fill: new Fill({color: [...color, 0.9]}),
                    stroke: new Stroke({color: "#fff", width: 1.5})
                })
            });
        },

        /**
         * Get trail style
         */
        getTrailStyle (properties) {
            const color = getCapabilityColor(properties.activeCapability);

            return new Style({
                stroke: new Stroke({
                    color: [...color, 0.4],
                    width: 2
                })
            });
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

            // Clear interpolator
            if (this.interpolator) {
                this.interpolator = new AgentInterpolator();
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

@media (max-width: 992px) {
    .visualization-layout {
        gap: 0.5rem;
    }

    .sidebar-left {
        padding: 0.25rem;
    }
}
</style>
