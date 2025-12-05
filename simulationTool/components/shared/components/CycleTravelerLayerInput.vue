<script>
import {mapActions} from "vuex";
import Draw from "ol/interaction/Draw";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import GeoJSON from "ol/format/GeoJSON";
import layerCollection from "../../../../../src/core/layers/js/layerCollection";

/**
 * Custom input for Green4Bikes cycleTravelerLayer.
 * Allows drawing two rectangles: source (orange) and target (purple).
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
        }
    },
    emits: ["update:value"],
    data () {
        return {
            drawInteraction: null,
            sourceFeature: null,
            targetFeature: null,
            sourceGeometry: null,
            targetGeometry: null
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
                    }),
                    style = new Style({
                        fill: new Fill({color: colors[type].fill}),
                        stroke: new Stroke({color: colors[type].stroke, width: 2})
                    });

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
         * Starts drawing a rectangle.
         * @param {String} type - "source" or "target"
         */
        startDrawing (type) {
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
                type: "Circle",
                geometryFunction: Draw.createBox()
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
                style = new Style({
                    fill: new Fill({color: colors.fill}),
                    stroke: new Stroke({color: colors.stroke, width: 2})
                }),
                geoJsonFormat = new GeoJSON(),
                geoJsonFeature = geoJsonFormat.writeFeatureObject(feature, {
                    dataProjection: "EPSG:4326",
                    featureProjection: "EPSG:25832"
                });

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
         */
        updateValue () {
            if (!this.sourceGeometry && !this.targetGeometry) {
                this.$emit("update:value", null);
                return;
            }

            // Format as CSV: "source_geojson;target_geojson"
            const sourceJson = this.sourceGeometry ? JSON.stringify(this.sourceGeometry) : "",
                targetJson = this.targetGeometry ? JSON.stringify(this.targetGeometry) : "",
                csvValue = `${sourceJson};${targetJson}`;

            this.$emit("update:value", csvValue);
        },

        /**
         * Removes the draw interaction.
         */
        removeDrawInteraction () {
            if (this.drawInteraction) {
                this.removeInteraction(this.drawInteraction);
                this.drawInteraction = null;
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
                    @click="startDrawing('source')"
                >
                    <i class="bi bi-pencil" />
                    Rechteck aufziehen
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
                {{ hasSourceGeometry ? 'Startbereich gezeichnet' : 'Kein Startbereich gezeichnet' }}
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
                    @click="startDrawing('target')"
                >
                    <i class="bi bi-pencil" />
                    Rechteck aufziehen
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
                {{ hasTargetGeometry ? 'Zielbereich gezeichnet' : 'Kein Zielbereich gezeichnet' }}
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
