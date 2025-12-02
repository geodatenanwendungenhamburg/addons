<script>
import {mapGetters, mapActions, mapMutations} from "vuex";
import {GeoJSON} from "ol/format.js";
import layerCollection from "../../../../src/core/layers/js/layerCollection";
import layerFactory from "../../../../src/core/layers/js/layerFactory";
import mapCollection from "../../../../src/core/maps/js/mapCollection";
import {Select} from "ol/interaction";
import {singleClick} from "ol/events/condition";
import Style from "ol/style/Style";
import Circle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import {LineString} from "ol/geom";
import {Feature} from "ol";
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
import SectionHeader from "../SectionHeader.vue";
import TimeSlider from "./TimeSlider.vue";
import AgentHistogram from "./AgentHistogram.vue";

const AGENT_LAYER_ID = "green4bikes-agents";

export default {
    name: "AgentVisualization",
    components: {
        FlatButton,
        SectionHeader,
        TimeSlider,
        AgentHistogram
    },
    data () {
        return {
            agentData: null,
            timeSteps: [],
            timeIndex: {},
            currentTimeStep: 0,
            isPlaying: false,
            playInterval: null,
            playSpeed: 1000, // ms per step
            agentLayer: null,
            selectInteraction: null,
            selectedAgent: null,
            agentHistogram: {},
            agentTrails: {}, // Speichert Pfade pro Agent-ID
            showTrails: true,
            trailLength: 5 // Anzahl der letzten Positionen
        };
    },
    computed: {
        ...mapGetters("Modules/SimulationTool", [
            "mode"
        ]),

        /**
         * Get the formatted current time
         * @returns {String} The formatted time
         */
        currentTime () {
            if (this.timeSteps.length === 0) {
                return "";
            }
            return this.timeSteps[this.currentTimeStep] || "";
        },

        /**
         * Get the number of agents at current time step
         * @returns {Number} Number of agents
         */
        currentAgentCount () {
            return this.agentHistogram[this.currentTime] || 0;
        },

        /**
         * Get the maximum agent count for histogram scaling
         * @returns {Number} Maximum agent count
         */
        maxAgentCount () {
            return Math.max(...Object.values(this.agentHistogram), 1);
        }
    },
    mounted () {
        this.initializeLayer();
        // Example: Load agent data (in production, this would come from API/file upload)
        // this.loadAgentData(agentDataUrl);
    },
    unmounted () {
        this.cleanup();
    },
    methods: {
        ...mapActions("Maps", ["addInteraction", "removeInteraction"]),
        ...mapMutations("Modules/SimulationTool", ["setMode"]),

        /**
         * Initialize the agent layer
         * @returns {void}
         */
        initializeLayer () {
            if (!layerCollection.getLayerById(AGENT_LAYER_ID)) {
                const layer = layerFactory.createLayer({
                    typ: "VECTORBASE",
                    id: AGENT_LAYER_ID,
                    name: "Green4Bikes Agents"
                });

                layer.layer.setZIndex(9999999);
                layer.layer.setVisible(true);
                layerCollection.addLayer(layer);
                this.agentLayer = layer;
            }
            else {
                this.agentLayer = layerCollection.getLayerById(AGENT_LAYER_ID);
                this.agentLayer.layer.setVisible(true);
            }

            // Setup click interaction
            this.selectInteraction = new Select({
                style: this.getHighlightStyle(),
                layers: [this.agentLayer.layer],
                condition: singleClick
            });

            this.selectInteraction.on("select", this.onAgentSelect);
            this.addInteraction(this.selectInteraction);
        },

        /**
         * Load agent data from URL or file
         * @param {String|Object} dataSource - URL or FeatureCollection object
         * @returns {void}
         */
        async loadAgentData (dataSource) {
            try {
                let featureCollection;

                if (typeof dataSource === "string") {
                    const response = await fetch(dataSource);

                    featureCollection = await response.json();
                }
                else {
                    featureCollection = dataSource;
                }

                this.processAgentData(featureCollection);
            }
            catch (error) {
                console.error("Error loading agent data:", error);
            }
        },

        /**
         * Process and index agent data by time
         * @param {Object} featureCollection - GeoJSON FeatureCollection
         * @returns {void}
         */
        processAgentData (featureCollection) {
            this.agentData = featureCollection;
            this.timeIndex = {};
            this.agentHistogram = {};
            const timeSet = new Set();

            // Index features by time
            featureCollection.features.forEach(feature => {
                const time = feature.properties.time;

                if (!time) {
                    return;
                }

                timeSet.add(time);

                if (!this.timeIndex[time]) {
                    this.timeIndex[time] = [];
                }

                this.timeIndex[time].push(feature);
            });

            // Sort time steps
            this.timeSteps = Array.from(timeSet).sort();

            // Build histogram
            this.timeSteps.forEach(time => {
                this.agentHistogram[time] = this.timeIndex[time].length;
            });

            // Display first time step
            if (this.timeSteps.length > 0) {
                this.currentTimeStep = 0;
                this.updateVisualization();
            }
        },

        /**
         * Update visualization for current time step
         * @returns {void}
         */
        updateVisualization () {
            if (!this.agentLayer || this.timeSteps.length === 0) {
                return;
            }

            const layerSource = this.agentLayer.getLayerSource(),
                currentTime = this.timeSteps[this.currentTimeStep],
                features = this.timeIndex[currentTime] || [],
                mapProjection = mapCollection.getMap("2D").getView().getProjection().getCode(),
                geoJsonParser = new GeoJSON({
                    dataProjection: "EPSG:4326",
                    featureProjection: mapProjection
                });

            // Clear existing features
            layerSource.clear();

            // Add features for current time step
            features.forEach(feature => {
                const olFeature = geoJsonParser.readFeature(feature),
                    agentId = feature.id.split("-").slice(0, 2).join("-"); // Extract base agent ID

                olFeature.setStyle(this.getAgentStyle(feature.properties));
                layerSource.addFeature(olFeature);

                // Update trail for this agent
                if (this.showTrails) {
                    this.updateAgentTrail(agentId, feature, layerSource, geoJsonParser);
                }
            });
        },

        /**
         * Get style for agent based on properties
         * @param {Object} properties - Agent properties
         * @returns {ol/style/Style} OpenLayers style
         */
        getAgentStyle (properties) {
            let color = [100, 100, 100]; // default gray

            // Color by activeCapability
            if (properties.activeCapability === "walking") {
                color = [66, 135, 245]; // blue
            }
            else if (properties.activeCapability === "bike" || properties.hasBike) {
                color = [255, 153, 0]; // orange
            }

            return new Style({
                image: new Circle({
                    radius: 6,
                    fill: new Fill({color: [...color, 0.8]}),
                    stroke: new Stroke({color: "#fff", width: 1.5})
                })
            });
        },

        /**
         * Get highlight style for selected agent
         * @returns {ol/style/Style} Highlight style
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
         * Handle agent selection
         * @param {Object} event - Select event
         * @returns {void}
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
         * Close agent popup
         * @returns {void}
         */
        closePopup () {
            this.selectedAgent = null;
            if (this.selectInteraction) {
                this.selectInteraction.getFeatures().clear();
            }
        },

        /**
         * Update trail for an agent (comet tail effect)
         * @param {String} agentId - Agent ID
         * @param {Object} currentFeature - Current GeoJSON feature
         * @param {Object} layerSource - OpenLayers layer source
         * @param {Object} geoJsonParser - GeoJSON parser
         * @returns {void}
         */
        updateAgentTrail (agentId, currentFeature, layerSource, geoJsonParser) {
            // Initialize trail array for this agent if not exists
            if (!this.agentTrails[agentId]) {
                this.agentTrails[agentId] = [];
            }

            const currentCoords = geoJsonParser.readFeature(currentFeature).getGeometry().getCoordinates();

            // Add current position to trail
            this.agentTrails[agentId].push({
                coords: currentCoords,
                properties: currentFeature.properties
            });

            // Keep only last N positions
            if (this.agentTrails[agentId].length > this.trailLength) {
                this.agentTrails[agentId].shift();
            }

            // Draw trail if we have at least 2 points
            if (this.agentTrails[agentId].length >= 2) {
                const trailCoords = this.agentTrails[agentId].map(t => t.coords),
                    trailFeature = new Feature({
                        geometry: new LineString(trailCoords),
                        isTrail: true,
                        agentId: agentId
                    });

                // Get color based on agent capability
                const baseColor = this.getTrailColor(currentFeature.properties);

                trailFeature.setStyle(this.getTrailStyle(baseColor, this.agentTrails[agentId].length));
                layerSource.addFeature(trailFeature);
            }
        },

        /**
         * Get trail color based on agent properties
         * @param {Object} properties - Agent properties
         * @returns {Array} RGB color array
         */
        getTrailColor (properties) {
            if (properties.activeCapability === "walking") {
                return [66, 135, 245]; // blue
            }
            else if (properties.activeCapability === "bike" || properties.hasBike) {
                return [255, 153, 0]; // orange
            }
            return [100, 100, 100]; // gray
        },

        /**
         * Get trail style with gradient effect (comet tail)
         * @param {Array} baseColor - Base RGB color
         * @param {Number} trailPoints - Number of points in trail
         * @returns {ol/style/Style} Trail style
         */
        getTrailStyle (baseColor, trailPoints) {
            // Create gradient effect: more transparent at the beginning, opaque at the end
            const styles = [];

            // Main line with gradient-like opacity
            for (let i = 0; i < trailPoints - 1; i++) {
                const opacity = (i + 1) / trailPoints; // 0.2, 0.4, 0.6, 0.8, 1.0
                const width = 2 + (i / trailPoints) * 3; // 2 to 5 pixels

                styles.push(new Style({
                    stroke: new Stroke({
                        color: [...baseColor, opacity],
                        width: width,
                        lineCap: "round",
                        lineJoin: "round"
                    })
                }));
            }

            // Return the strongest style (most recent part of trail)
            return styles.length > 0 ? styles[styles.length - 1] : new Style({
                stroke: new Stroke({
                    color: [...baseColor, 0.6],
                    width: 3,
                    lineCap: "round",
                    lineJoin: "round"
                })
            });
        },

        /**
         * Toggle trail visibility
         * @returns {void}
         */
        toggleTrails () {
            this.showTrails = !this.showTrails;
            if (!this.showTrails) {
                // Clear all trails
                this.agentTrails = {};
            }
            this.updateVisualization();
        },

        /**
         * Change time step via slider
         * @param {Number} step - New time step index
         * @returns {void}
         */
        onTimeStepChange (step) {
            this.currentTimeStep = step;
            this.updateVisualization();
        },

        /**
         * Handle histogram bar click
         * @param {Number} index - Clicked bar index
         * @returns {void}
         */
        onHistogramClick (index) {
            this.currentTimeStep = index;
            this.updateVisualization();
        },

        /**
         * Play animation
         * @returns {void}
         */
        play () {
            if (this.isPlaying) {
                return;
            }

            this.isPlaying = true;
            this.playInterval = setInterval(() => {
                if (this.currentTimeStep < this.timeSteps.length - 1) {
                    this.currentTimeStep++;
                    this.updateVisualization();
                }
                else {
                    this.pause();
                }
            }, this.playSpeed);
        },

        /**
         * Pause animation
         * @returns {void}
         */
        pause () {
            this.isPlaying = false;
            if (this.playInterval) {
                clearInterval(this.playInterval);
                this.playInterval = null;
            }
        },

        /**
         * Reset to first time step
         * @returns {void}
         */
        reset () {
            this.pause();
            this.currentTimeStep = 0;
            this.updateVisualization();
        },

        /**
         * Cleanup when component is destroyed
         * @returns {void}
         */
        cleanup () {
            this.pause();

            if (this.selectInteraction) {
                this.removeInteraction(this.selectInteraction);
            }

            if (this.agentLayer) {
                this.agentLayer.getLayerSource().clear();
            }
        },

        /**
         * Format coordinate for display
         * @param {Number} coord - Coordinate value
         * @returns {String} Formatted coordinate
         */
        formatCoord (coord) {
            return coord ? coord.toFixed(6) : "---";
        },

        /**
         * Navigate back to home
         * @returns {void}
         */
        goBack () {
            this.setMode("home-panel");
        },

        /**
         * Handle file upload
         * @param {Event} event - File input change event
         * @returns {void}
         */
        onFileUpload (event) {
            const file = event.target.files[0];

            if (!file) {
                return;
            }

            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);

                    this.loadAgentData(data);
                }
                catch (error) {
                    console.error("Error parsing JSON file:", error);
                }
            };

            reader.readAsText(file);
        }
    }
};
</script>

<template>
    <div class="agent-visualization">
        <SectionHeader
            :title="$t('additional:modules.tools.simulationTool.agentVisualization')"
        />

        <!-- File Upload / Data Source -->
        <div class="data-source-section mb-3">
            <h5>{{ $t('additional:modules.tools.simulationTool.loadAgentData') }}</h5>
            <input
                type="file"
                accept=".json,.geojson"
                class="form-control"
                @change="onFileUpload"
            >
            <p class="text-muted mt-2">
                Upload a GeoJSON FeatureCollection with agent data. Each feature should have a 'time' property.
            </p>
        </div>

        <!-- Time Controls -->
        <div
            v-if="timeSteps.length > 0"
            class="time-controls-section"
        >
            <!-- Integrated TimeSlider Component -->
            <TimeSlider
                :time-steps="timeSteps"
                :current-step="currentTimeStep"
                :is-playing="isPlaying"
                @update:current-step="onTimeStepChange"
                @play="play"
                @pause="pause"
                @reset="reset"
            />

            <!-- Integrated Histogram Component -->
            <AgentHistogram
                :time-steps="timeSteps"
                :histogram="agentHistogram"
                :current-step="currentTimeStep"
                @step-click="onHistogramClick"
            />

            <!-- Trail Controls -->
            <div class="trail-controls mt-3">
                <div class="form-check form-switch">
                    <input
                        id="showTrailsToggle"
                        v-model="showTrails"
                        class="form-check-input"
                        type="checkbox"
                        @change="toggleTrails"
                    >
                    <label
                        class="form-check-label"
                        for="showTrailsToggle"
                    >
                        {{ $t('additional:modules.tools.simulationTool.showTrails') }}
                    </label>
                </div>
                <div
                    v-if="showTrails"
                    class="trail-length-control mt-2"
                >
                    <label for="trailLengthSlider">
                        {{ $t('additional:modules.tools.simulationTool.trailLength') }}: {{ trailLength }}
                    </label>
                    <input
                        id="trailLengthSlider"
                        v-model.number="trailLength"
                        type="range"
                        class="form-range"
                        min="2"
                        max="10"
                        step="1"
                    >
                </div>
            </div>
        </div>

        <!-- Agent Info Popup -->
        <div
            v-if="selectedAgent"
            class="agent-popup"
        >
            <div class="popup-header">
                <h5>{{ $t('additional:modules.tools.simulationTool.agentDetails') }}</h5>
                <button
                    type="button"
                    class="btn-close"
                    @click="closePopup"
                />
            </div>
            <div class="popup-content">
                <table class="table table-sm">
                    <tbody>
                        <tr>
                            <td><strong>ID:</strong></td>
                            <td>{{ selectedAgent.id || '---' }}</td>
                        </tr>
                        <tr>
                            <td><strong>{{ $t('additional:modules.tools.simulationTool.mode') }}:</strong></td>
                            <td>
                                <span
                                    class="badge"
                                    :class="selectedAgent.activeCapability === 'walking' ? 'bg-primary' : 'bg-warning'"
                                >
                                    {{ selectedAgent.activeCapability || '---' }}
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td><strong>{{ $t('additional:modules.tools.simulationTool.hasBike') }}:</strong></td>
                            <td>{{ selectedAgent.hasBike ? 'Yes' : 'No' }}</td>
                        </tr>
                        <tr>
                            <td><strong>{{ $t('additional:modules.tools.simulationTool.velocity') }}:</strong></td>
                            <td>{{ selectedAgent.velocity || '---' }} m/s</td>
                        </tr>
                        <tr>
                            <td><strong>{{ $t('additional:modules.tools.simulationTool.routeLength') }}:</strong></td>
                            <td>{{ selectedAgent.routeLength || '---' }} m</td>
                        </tr>
                        <tr>
                            <td><strong>{{ $t('additional:modules.tools.simulationTool.startCoords') }}:</strong></td>
                            <td>{{ formatCoord(selectedAgent.startX) }}, {{ formatCoord(selectedAgent.startY) }}</td>
                        </tr>
                        <tr>
                            <td><strong>{{ $t('additional:modules.tools.simulationTool.goalCoords') }}:</strong></td>
                            <td>{{ formatCoord(selectedAgent.goalX) }}, {{ formatCoord(selectedAgent.goalY) }}</td>
                        </tr>
                        <tr>
                            <td><strong>{{ $t('additional:modules.tools.simulationTool.step') }}:</strong></td>
                            <td>{{ selectedAgent.step || '---' }}</td>
                        </tr>
                        <tr>
                            <td><strong>{{ $t('additional:modules.tools.simulationTool.time') }}:</strong></td>
                            <td>{{ selectedAgent.time || '---' }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Back Button -->
        <div class="mt-3">
            <FlatButton
                :icon="'bi bi-arrow-left'"
                :text="$t('additional:modules.tools.simulationTool.back')"
                @click="goBack"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.agent-visualization {
    padding: 1rem;
}

.time-display {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem;
    background-color: #f8f9fa;
    border-radius: 0.5rem;
}

.play-controls {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
}

.time-slider {
    .form-range {
        width: 100%;
    }

    .slider-labels {
        display: flex;
        justify-content: space-between;
        font-size: 0.875rem;
        color: #6c757d;
        margin-top: 0.25rem;
    }
}

.histogram {
    background-color: #f8f9fa;
    padding: 1rem;
    border-radius: 0.5rem;

    h6 {
        margin-bottom: 0.75rem;
    }

    .histogram-bars {
        display: flex;
        align-items: flex-end;
        height: 100px;
        gap: 1px;
        background-color: #fff;
        border: 1px solid #dee2e6;
        border-radius: 0.25rem;
        padding: 0.25rem;
    }

    .histogram-bar {
        flex: 1;
        background-color: #0d6efd;
        opacity: 0.5;
        transition: opacity 0.2s;
        min-height: 2px;

        &.active {
            background-color: #ffc107;
            opacity: 1;
        }

        &:hover {
            opacity: 0.8;
        }
    }
}

.agent-popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 0.5rem;
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
            }

            td:first-child {
                width: 40%;
                white-space: nowrap;
            }
        }
    }
}

.data-source-section {
    padding: 1rem;
    background-color: #f8f9fa;
    border-radius: 0.5rem;
}

.trail-controls {
    padding: 1rem;
    background-color: #f8f9fa;
    border-radius: 0.5rem;

    .form-check-label {
        font-weight: 500;
    }

    .trail-length-control {
        label {
            font-size: 0.875rem;
            color: #495057;
            margin-bottom: 0.5rem;
            display: block;
        }

        .form-range {
            width: 100%;
        }
    }
}
</style>
