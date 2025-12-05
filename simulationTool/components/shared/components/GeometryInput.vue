<script>
import {mapActions} from "vuex";
import Draw from "ol/interaction/Draw";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import GeoJSON from "ol/format/GeoJSON";
import layerCollection from "../../../../../src/core/layers/js/layerCollection";
import ConvertFeature from "../../../js/convertFeatures";

/**
 * GeometryInput component for drawing geometries on the map.
 * Supports Point and Polygon (Rectangle) geometry types.
 *
 * @vue-prop {String} id - The id for the input.
 * @vue-prop {String} label - The label to display.
 * @vue-prop {Object} value - The GeoJSON geometry value.
 * @vue-prop {String} geometryType - The geometry type ("Point" or "Polygon").
 * @vue-data {Object} drawInteraction - The current draw interaction.
 * @vue-data {Object} drawnFeature - The currently drawn feature.
 */
export default {
    name: "GeometryInput",
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
            type: Object,
            default: null
        },
        geometryType: {
            type: String,
            default: "Polygon",
            validator: (value) => ["Point", "Polygon"].includes(value)
        },
        fillColor: {
            type: String,
            default: "rgba(0, 123, 255, 0.3)"
        },
        strokeColor: {
            type: String,
            default: "rgba(0, 123, 255, 0.8)"
        }
    },
    emits: ["update:value"],
    data () {
        return {
            drawInteraction: null,
            drawnFeature: null
        };
    },
    computed: {
        /**
         * Gets the display text for the current geometry.
         * @returns {String} The geometry display text.
         */
        geometryDisplay () {
            if (!this.value || !this.value.coordinates) {
                return "Keine Geometrie ausgewählt";
            }

            if (this.geometryType === "Point") {
                const coords = this.value.coordinates;

                return `Punkt: ${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`;
            }
            else if (this.geometryType === "Polygon") {
                return "Polygon gezeichnet";
            }

            return "Geometrie ausgewählt";
        },

        /**
         * Gets the layer source for drawing.
         * @returns {Object} The layer source.
         */
        layerSource () {
            const layer = layerCollection.getLayerById("planning-scenario");

            return layer ? layer.getLayerSource() : null;
        }
    },
    mounted () {
        this.renderExistingGeometry();
    },
    unmounted () {
        this.removeDrawInteraction();
        this.clearFeatureFromMap();
    },
    watch: {
        value: {
            handler (newValue) {
                if (newValue) {
                    this.renderExistingGeometry();
                }
                else {
                    this.clearFeatureFromMap();
                }
            },
            deep: true
        }
    },
    methods: {
        ...mapActions("Maps", ["addInteraction", "removeInteraction"]),

        /**
         * Starts the drawing interaction.
         * @returns {void}
         */
        startDrawing () {
            this.removeDrawInteraction();

            if (!this.layerSource) {
                console.warn("Layer source not found for geometry drawing");
                return;
            }

            const drawType = this.geometryType === "Polygon" ? "Circle" : "Point",
                drawOptions = {
                    source: this.layerSource,
                    type: drawType
                };

            // For rectangles, use Circle with geometryFunction
            if (this.geometryType === "Polygon") {
                drawOptions.geometryFunction = Draw.createBox();
            }

            this.drawInteraction = new Draw(drawOptions);

            this.drawInteraction.on("drawend", (event) => {
                this.onDrawEnd(event);
            });

            this.addInteraction(this.drawInteraction);
        },

        /**
         * Handles the draw end event.
         * @param {Object} event The draw event.
         * @returns {void}
         */
        onDrawEnd (event) {
            // Remove previous feature if exists
            if (this.drawnFeature) {
                this.layerSource.removeFeature(this.drawnFeature);
            }

            this.drawnFeature = event.feature;

            // Apply custom style to the feature
            const style = new Style({
                fill: new Fill({
                    color: this.fillColor
                }),
                stroke: new Stroke({
                    color: this.strokeColor,
                    width: 2
                })
            });
            this.drawnFeature.setStyle(style);

            // Convert to GeoJSON
            const geoJsonFeatures = ConvertFeature.openlayersToGeoJson([event.feature]);

            if (geoJsonFeatures && geoJsonFeatures.length > 0) {
                const geometry = geoJsonFeatures[0].geometry;

                // For rectangles, ensure it's a proper Polygon
                if (this.geometryType === "Polygon" && geometry.type === "Polygon") {
                    this.$emit("update:value", geometry);
                }
                else if (this.geometryType === "Point" && geometry.type === "Point") {
                    this.$emit("update:value", geometry);
                }
            }

            this.removeDrawInteraction();
        },

        /**
         * Removes the current geometry.
         * @returns {void}
         */
        clearGeometry () {
            this.clearFeatureFromMap();
            this.$emit("update:value", null);
        },

        /**
         * Removes the draw interaction.
         * @returns {void}
         */
        removeDrawInteraction () {
            if (this.drawInteraction) {
                this.removeInteraction(this.drawInteraction);
                this.drawInteraction = null;
            }
        },

        /**
         * Clears the feature from the map without emitting update.
         * @returns {void}
         */
        clearFeatureFromMap () {
            if (this.drawnFeature && this.layerSource) {
                this.layerSource.removeFeature(this.drawnFeature);
                this.drawnFeature = null;
            }
        },

        /**
         * Renders an existing geometry value on the map.
         * @returns {void}
         */
        renderExistingGeometry () {
            if (!this.value || !this.layerSource) {
                return;
            }

            // Clear existing feature first
            this.clearFeatureFromMap();

            try {
                // Convert GeoJSON geometry to OpenLayers feature
                const geoJsonFormat = new GeoJSON();
                const feature = geoJsonFormat.readFeature({
                    type: "Feature",
                    geometry: this.value
                }, {
                    dataProjection: "EPSG:4326",
                    featureProjection: "EPSG:25832"
                });

                // Apply custom style
                const style = new Style({
                    fill: new Fill({
                        color: this.fillColor
                    }),
                    stroke: new Stroke({
                        color: this.strokeColor,
                        width: 2
                    })
                });
                feature.setStyle(style);

                // Add to layer and store reference
                this.layerSource.addFeature(feature);
                this.drawnFeature = feature;
            }
            catch (error) {
                console.warn("Error rendering existing geometry:", error);
            }
        }
    }
};
</script>

<template>
    <div class="geometry-input mb-3">
        <label :for="id">
            {{ label }}
        </label>
        <div class="d-flex gap-2 align-items-center mb-2">
            <button
                type="button"
                class="btn btn-primary btn-sm"
                @click="startDrawing"
            >
                <i class="bi bi-pencil" />
                {{ geometryType === 'Point' ? 'Punkt setzen' : 'Rechteck aufziehen' }}
            </button>
            <button
                v-if="value"
                type="button"
                class="btn btn-outline-secondary btn-sm"
                @click="clearGeometry"
            >
                <i class="bi bi-trash" />
                Löschen
            </button>
        </div>
        <div class="geometry-display small text-muted">
            {{ geometryDisplay }}
        </div>
    </div>
</template>

<style lang="scss" scoped>
.geometry-input {
    .geometry-display {
        padding: 0.5rem;
        background-color: #f8f9fa;
        border-radius: 0.25rem;
    }
}
</style>
