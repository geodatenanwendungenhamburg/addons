<script>
import {mapActions} from "vuex";
import Draw from "ol/interaction/Draw";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Circle from "ol/style/Circle";
import GeoJSON from "ol/format/GeoJSON";
import layerCollection from "../../../../../src/core/layers/js/layerCollection";

/**
 * Custom input for Green4Bikes cycleTravelerLayer.
 * Allows drawing two polygons: source (orange) and target (purple).
 */
export default {
    name: "CycleTravelerLayerInput",
    props: {
        id: {
            type: String,
            required: true
        },
        label: {
            type: String,
            required: true
        },
        value: {
            type: String,
            default: null
        },
        startPoint: {
            type: String,
            default: null
        },
        endPoint: {
            type: String,
            default: null
        },
        agentCount: {
            type: Number,
            default: 50
        },
        spawningInterval: {
            type: Number,
            default: 30
        }
    },
    emits: ["update:value", "update:agentCount", "update:spawningInterval"],
    data () {
        return {
            drawInteraction: null,
            sourceFeature: null,
            targetFeature: null,
            sourceGeometry: null,
            targetGeometry: null,
            localAgentCount: 50,
            localSpawningInterval: 30
        };
    },
    computed: {
        layerSource () {
            const layer = layerCollection.getLayerById("planning-scenario");

            return layer ? layer.getLayerSource() : null;
        },
        hasSourceGeometry () {
            return Boolean(this.sourceGeometry);
        },
        hasTargetGeometry () {
            return Boolean(this.targetGeometry);
        }
    },
    watch: {
        value (newValue) {
            if (newValue) {
                this.parseExistingValue();
            }
        }
    },
    mounted () {
        this.localAgentCount = this.agentCount || 50;
        this.localSpawningInterval = this.spawningInterval || 30;
        this.parseExistingValue();
    },
    unmounted () {
        this.removeDrawInteraction();
        this.clearAllFeatures();
    },
    methods: {
        ...mapActions("Maps", ["addInteraction", "removeInteraction"]),

        /**
         * Parses the existing CSV value and renders geometries.
         */
        parseExistingValue () {
            if (!this.value || !this.layerSource) {
                return;
            }

            try {
                // Parse CSV format: "source_geojson;target_geojson"
                const parts = this.value.split(";");

                if (parts.length >= 1 && parts[0]) {
                    const sourceGeoJson = JSON.parse(parts[0]);

                    this.sourceGeometry = sourceGeoJson;
                    this.renderGeometry(sourceGeoJson, "source");
                }
                if (parts.length >= 2 && parts[1]) {
                    const targetGeoJson = JSON.parse(parts[1]);

                    this.targetGeometry = targetGeoJson;
                    this.renderGeometry(targetGeoJson, "target");
                }
            }
            catch (error) {
                console.warn("Error parsing cycleTravelerLayer value:", error);
            }
        },

        /**
         * Renders a geometry on the map.
         * @param {Object} geometry - GeoJSON geometry
         * @param {String} type - "source" or "target"
         */
        renderGeometry (geometry, type) {
            if (!this.layerSource) {
                return;
            }

            const colors = {
                source: {
                    fill: "rgba(255, 165, 0, 0.3)",
                    stroke: "rgba(255, 140, 0, 0.8)"
                },
                target: {
                    fill: "rgba(147, 112, 219, 0.3)",
                    stroke: "rgba(138, 43, 226, 0.8)"
                }
            };

            try {
                const geoJsonFormat = new GeoJSON(),
                    feature = geoJsonFormat.readFeature({
                        type: "Feature",
                        geometry: geometry
                    }, {
                        dataProjection: "EPSG:4326",
                        featureProjection: "EPSG:25832"
                    });

                let style;

                // Different style for Point vs Polygon
                if (geometry.type === "Point") {
                    style = new Style({
                        image: new Circle({
                            radius: 8,
                            fill: new Fill({color: colors[type].stroke}),
                            stroke: new Stroke({color: "#fff", width: 2})
                        })
                    });
                }
                else {
                    style = new Style({
                        fill: new Fill({color: colors[type].fill}),
                        stroke: new Stroke({color: colors[type].stroke, width: 2})
                    });
                }

                feature.setStyle(style);
                this.layerSource.addFeature(feature);

                if (type === "source") {
                    if (this.sourceFeature) {
                        this.layerSource.removeFeature(this.sourceFeature);
                    }
                    this.sourceFeature = feature;
                }
                else {
                    if (this.targetFeature) {
                        this.layerSource.removeFeature(this.targetFeature);
                    }
                    this.targetFeature = feature;
                }
            }
            catch (error) {
                console.warn("Error rendering geometry:", error);
            }
        },

        /**
         * Starts drawing a geometry.
         * @param {String} type - "source" or "target"
         * @param {String} geometryType - "Polygon" or "Point"
         */
        startDrawing (type, geometryType = "Polygon") {
            this.removeDrawInteraction();

            if (!this.layerSource) {
                console.warn("Layer source not found");
                return;
            }

            const colors = {
                source: {
                    fill: "rgba(255, 165, 0, 0.3)",
                    stroke: "rgba(255, 140, 0, 0.8)"
                },
                target: {
                    fill: "rgba(147, 112, 219, 0.3)",
                    stroke: "rgba(138, 43, 226, 0.8)"
                }
            };

            this.drawInteraction = new Draw({
                source: this.layerSource,
                type: geometryType
            });

            this.drawInteraction.on("drawend", (event) => {
                this.onDrawEnd(event, type, colors[type]);
            });

            this.addInteraction(this.drawInteraction);
        },

        /**
         * Handles draw end event.
         * @param {Object} event - Draw event
         * @param {String} type - "source" or "target"
         * @param {Object} colors - Fill and stroke colors
         */
        onDrawEnd (event, type, colors) {
            // Remove old feature first
            if (type === "source" && this.sourceFeature) {
                this.layerSource.removeFeature(this.sourceFeature);
            }
            if (type === "target" && this.targetFeature) {
                this.layerSource.removeFeature(this.targetFeature);
            }

            const feature = event.feature,
                geoJsonFormat = new GeoJSON(),
                geoJsonFeature = geoJsonFormat.writeFeatureObject(feature, {
                    dataProjection: "EPSG:4326",
                    featureProjection: "EPSG:25832"
                });

            // Set style based on geometry type
            let style;

            if (geoJsonFeature.geometry.type === "Point") {
                style = new Style({
                    image: new Circle({
                        radius: 8,
                        fill: new Fill({color: colors.stroke}),
                        stroke: new Stroke({color: "#fff", width: 2})
                    })
                });
            }
            else {
                style = new Style({
                    fill: new Fill({color: colors.fill}),
                    stroke: new Stroke({color: colors.stroke, width: 2})
                });
            }

            feature.setStyle(style);

            if (type === "source") {
                this.sourceFeature = feature;
                this.sourceGeometry = geoJsonFeature.geometry;
            }
            else {
                this.targetFeature = feature;
                this.targetGeometry = geoJsonFeature.geometry;
            }

            this.updateValue();
            this.removeDrawInteraction();
        },

        /**
         * Clears a specific geometry.
         * @param {String} type - "source" or "target"
         */
        clearGeometry (type) {
            if (type === "source") {
                if (this.sourceFeature && this.layerSource) {
                    this.layerSource.removeFeature(this.sourceFeature);
                }
                this.sourceFeature = null;
                this.sourceGeometry = null;
            }
            else {
                if (this.targetFeature && this.layerSource) {
                    this.layerSource.removeFeature(this.targetFeature);
                }
                this.targetFeature = null;
                this.targetGeometry = null;
            }
            this.updateValue();
        },

        /**
         * Clears all features from map.
         */
        clearAllFeatures () {
            if (this.layerSource) {
                if (this.sourceFeature) {
                    this.layerSource.removeFeature(this.sourceFeature);
                }
                if (this.targetFeature) {
                    this.layerSource.removeFeature(this.targetFeature);
                }
            }
        },

        /**
         * Updates the value prop with current geometries.
         * Creates a GeoJSON FeatureCollection with source and target polygon features.
         */
        updateValue () {
            if (!this.sourceGeometry || !this.targetGeometry) {
                this.$emit("update:value", null);
                return;
            }

            // Store both polygon geometries as a FeatureCollection with metadata
            const featureCollection = {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        id: "cycleTravelerSource",
                        geometry: this.sourceGeometry,
                        properties: {
                            type: "source",
                            spawningAmount: this.localAgentCount,
                            spawningIntervalInMinutes: this.localSpawningInterval
                        }
                    },
                    {
                        type: "Feature",
                        id: "cycleTravelerTarget",
                        geometry: this.targetGeometry,
                        properties: {
                            type: "target"
                        }
                    }
                ]
            };

            this.$emit("update:value", JSON.stringify(featureCollection));
        },

        /**
         * Calculates the centroid of a polygon geometry.
         * @param {Object} geometry - GeoJSON Polygon geometry
         * @returns {Array} [longitude, latitude]
         */
        calculateCentroid (geometry) {
            if (geometry.type !== "Polygon" || !geometry.coordinates || !geometry.coordinates[0]) {
                return [0, 0];
            }

            const coords = geometry.coordinates[0],
                count = coords.length - 1; // Exclude duplicate last point
            let sumLon = 0,
                sumLat = 0;

            for (let i = 0; i < count; i++) {
                sumLon += coords[i][0];
                sumLat += coords[i][1];
            }

            return [sumLon / count, sumLat / count];
        },

        /**
         * Removes the draw interaction.
         */
        removeDrawInteraction () {
            if (this.drawInteraction) {
                this.removeInteraction(this.drawInteraction);
                this.drawInteraction = null;
            }
        },

        /**
         * Updates the agent count and emits the change.
         * @param {Event} event - Input event
         */
        updateAgentCount (event) {
            const value = parseInt(event.target.value, 10);

            if (!isNaN(value) && value > 0) {
                this.localAgentCount = value;
                this.$emit("update:agentCount", value);
                this.updateValue();
            }
        },

        /**
         * Updates the spawning interval and emits the change.
         * @param {Event} event - Input event
         */
        updateSpawningInterval (event) {
            const value = parseInt(event.target.value, 10);

            if (!isNaN(value) && value > 0) {
                this.localSpawningInterval = value;
                this.$emit("update:spawningInterval", value);
                this.updateValue();
            }
        }
    }
};
</script>

<template>
    <div class="cycle-traveler-layer-input mb-4">
        <div class="mb-3">
            <strong>{{ label }}</strong>
        </div>

        <div class="mb-3 p-3 border rounded">
            <label
                for="agentCountInput"
                class="form-label mb-2"
            >
                <i class="bi bi-people-fill" />
                Anzahl der Agenten
            </label>
            <input
                id="agentCountInput"
                type="number"
                class="form-control mb-3"
                :value="localAgentCount"
                min="1"
                max="1000"
                @input="updateAgentCount"
            >
        </div>

        <div class="mb-3 p-3 border rounded">
            <label
                for="spawningIntervalInput"
                class="form-label mb-2"
            >
                <i class="bi bi-clock-fill" />
                Spawning Interval (Minuten)
            </label>
            <input
                id="spawningIntervalInput"
                type="number"
                class="form-control mb-3"
                :value="localSpawningInterval"
                min="1"
                max="120"
                @input="updateSpawningInterval"
            >
            <small class="text-muted">
                Alle {{ localSpawningInterval }} Minuten werden neue Agenten generiert
            </small>
        </div>

        <div class="mb-3 p-3 border rounded">
            <h6 class="mb-2">
                <i
                    class="bi bi-square-fill"
                    style="color: rgba(255, 140, 0, 0.8)"
                />
                Startbereich (Orange)
            </h6>
            <div class="d-flex gap-2 align-items-center mb-2">
                <button
                    type="button"
                    class="btn btn-primary btn-sm"
                    @click="startDrawing('source', 'Point')"
                >
                    <i class="bi bi-geo-alt-fill" />
                    Punkt
                </button>
                <button
                    type="button"
                    class="btn btn-primary btn-sm"
                    @click="startDrawing('source', 'Polygon')"
                >
                    <i class="bi bi-pentagon" />
                    Polygon
                </button>
                <button
                    v-if="hasSourceGeometry"
                    type="button"
                    class="btn btn-outline-secondary btn-sm"
                    @click="clearGeometry('source')"
                >
                    <i class="bi bi-trash" />
                    Löschen
                </button>
            </div>
            <div class="small text-muted">
                <span v-if="hasSourceGeometry">
                    ✓ {{ sourceGeometry?.type === 'Point' ? 'Startpunkt' : 'Startbereich' }} gezeichnet
                </span>
                <span v-else>
                    Kein Startbereich gezeichnet
                </span>
            </div>
        </div>

        <div class="p-3 border rounded">
            <h6 class="mb-2">
                <i
                    class="bi bi-square-fill"
                    style="color: rgba(138, 43, 226, 0.8)"
                />
                Zielbereich (Lila)
            </h6>
            <div class="d-flex gap-2 align-items-center mb-2">
                <button
                    type="button"
                    class="btn btn-primary btn-sm"
                    @click="startDrawing('target', 'Point')"
                >
                    <i class="bi bi-geo-alt-fill" />
                    Punkt
                </button>
                <button
                    type="button"
                    class="btn btn-primary btn-sm"
                    @click="startDrawing('target', 'Polygon')"
                >
                    <i class="bi bi-pentagon" />
                    Polygon
                </button>
                <button
                    v-if="hasTargetGeometry"
                    type="button"
                    class="btn btn-outline-secondary btn-sm"
                    @click="clearGeometry('target')"
                >
                    <i class="bi bi-trash" />
                    Löschen
                </button>
            </div>
            <div class="small text-muted">
                <span v-if="hasTargetGeometry">
                    ✓ {{ targetGeometry?.type === 'Point' ? 'Zielpunkt' : 'Zielbereich' }} gezeichnet
                </span>
                <span v-else>
                    Kein Zielbereich gezeichnet
                </span>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.cycle-traveler-layer-input {
    .border {
        background-color: #f8f9fa;
    }
}
</style>
