<script>
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";

import {mapActions, mapGetters, mapMutations} from "vuex";
import {Style, Stroke, Fill, Text as OlText} from "ol/style";
import {Draw} from "ol/interaction";
import GeoJSON from "ol/format/GeoJSON";
import booleanIntersects from "@turf/boolean-intersects";
import intersect from "@turf/intersect";
import difference from "@turf/difference";
import {featureCollection} from "@turf/helpers";
import booleanEqual from "@turf/boolean-equal";

export default {
    name: "PvObligationRestrictionListForm",
    components: {
        FlatButton
    },
    props: {
        // Set, if the form should handle create or edit.
        formMode: {
            type: String,
            required: true,
            validator: value => {
                return ["create", "edit"].includes(value);
            }
        },
        // Given form data, e.g. {id: "S1", description: "Description text", features: []}
        formDataItem: {
            type: Object,
            required: true
        }
    },
    emits: [
        "interaction"
    ],
    data () {
        return {
            formData: {
                id: this.formDataItem.id,
                description: this.formDataItem.description,
                features: this.formDataItem.features
            },
            formErrors: {
                id: null,
                description: null,
                features: null
            },
            drawState: {
                layer: null,
                interaction: null
            }
        };
    },
    computed: {
        ...mapGetters("Modules/PvObligation", [
            "selectedRoofId"
        ])
    },
    mounted () {
        this.initializeDrawing();
    },
    beforeUnmount () {
        this.removeDrawInteraction();
    },
    methods: {
        ...mapActions("Maps", [
            "addNewLayerIfNotExists",
            "addInteraction",
            "removeInteraction"
        ]),
        ...mapMutations("Modules/PvObligation", [
            "setIsDrawing"
        ]),
        onSave () {
            if (!this.validate()) {
                return;
            }

            this.$emit("interaction", {
                action: "save",
                mode: this.formMode,
                data: this.formData
            });

            this.setIsDrawing(false);
        },
        onCancel () {
            this.formData = {...this.formDataItem};

            this.$emit("interaction", {
                action: "cancel",
                mode: this.formMode,
                data: this.formData
            });

            this.removeDrawnFeatures();
            this.setIsDrawing(false);
        },
        validate () {
            const errorMessageMissingValue = this.$t("additional:modules.pvObligation.formErrors.genericMissingValue");

            this.formErrors.description = !this.formData?.description
                ? errorMessageMissingValue
                : null;

            this.formErrors.features = !this.formData?.features.length
                ? this.$t("additional:modules.pvObligation.components.restrictionList.missingAreaText")
                : null;

            return !Object.values(this.formErrors).some(Boolean);
        },
        /**
         * Ensures a vector layer for drawing exists and initializes the draw interaction.
         * @returns {Promise<void>} Resolves when the layer is ready and interaction created.
         */
        async initializeDrawing () {
            this.drawState.layer = await this.addNewLayerIfNotExists({
                layerName: "module/pvObligation/drawLayer",
                id: "module/pvObligation/drawLayer"
            });

            this.createDrawInteraction();
        },
        /**
         * Destroys any existing draw interaction and creates a new one based on current active shape.
         * Registers the drawend handler and adds the interaction to the map.
         * @returns {void}
         */
        createDrawInteraction () {
            this.removeDrawInteraction();

            this.drawState.interaction = new Draw({
                source: this.drawState.layer.getSource(),
                type: "Polygon",
                stopClick: true,
                style: new Style({
                    fill: new Fill({color: "rgba(37, 34, 226, 0.3)"}),
                    stroke: new Stroke({color: "rgba(9, 237, 245, 1)", width: 2})
                })
            });

            this.drawState.interaction.on("drawend", this.handleDrawEnd);
            this.addInteraction(this.drawState.interaction);
        },
        /**
         * Handles the end of a drawing operation: sets properties on the drawn feature
         * @param {Object} event Draw end event object containing the created feature.
         * @param {import('ol/Feature').default} event.feature The drawn feature instance.
         * @returns {void}
         */
        handleDrawEnd (event) {
            this.cutDrawnFeatures(event.feature);
        },
        /**
         * Removes current draw interaction from map and unregisters the drawend listener.
         * @returns {void}
         */
        removeDrawInteraction () {
            if (this.drawState.interaction) {
                this.removeInteraction(this.drawState.interaction);
                this.drawState.interaction.un("drawend", this.handleDrawEnd);
            }
        },
        /**
         * Removes all features associated with the current formData from the drawing layer.
         * @returns {void}
         */
        removeDrawnFeatures () {
            const removeFeature = this.drawState.layer.getSource().getFeatures().filter(feature => {
                return feature.get("id") === this.formData.id;
            });

            removeFeature.forEach(feature => {
                this.drawState.layer.getSource().removeFeature(feature);
            });
        },
        /**
         * Cuts the currently drawn features on the map using the specified geometry.
         * This method processes the drawn features and applies the cut operation,
         * updating the map with the resulting geometries.
         *
         * @param {Geometry} cutGeometry - The geometry used to cut the drawn features.
         * @returns {void}
         */
        cutDrawnFeatures (drawFeature) {
            const netAreaLayer = mapCollection.getMap("2D").getLayers().getArray().find(layer => {
                    return layer.get("name") === "PV-geeignete Dachflächen";
                }),
                netAreaFeatures = netAreaLayer.getSource().getFeatures().filter(feature => {
                    return feature.get("gebaeude_id") === this.selectedRoofId;
                }),
                // Convert OpenLayers feature to GeoJSON for turf processing
                olGeoJson = new GeoJSON(),
                drawFeatureGeoJson = olGeoJson.writeFeatureObject(drawFeature);

            netAreaFeatures.forEach(async netAreaFeature => {
                let intersectionFeature = null;

                try {
                    if (netAreaFeature.getGeometry().getType() === "MultiPolygon") {
                        const featureGeoJson = olGeoJson.writeFeatureObject(netAreaFeature);

                        // Ensure featureGeoJson is valid
                        if (!featureGeoJson || !featureGeoJson.geometry) {
                            console.warn("Net area feature polygon is invalid or missing geometry.");
                            return;
                        }

                        intersectionFeature = await this.intersectFeature(featureGeoJson, drawFeatureGeoJson);

                        // eslint-disable-next-line one-var
                        const differenceFeature = await this.cutOverlappingFeatures(intersectionFeature, drawFeature);

                        if (differenceFeature) {
                            differenceFeature.forEach(feature => {
                                this.addFeatureWithProperties(feature, featureGeoJson);
                            });
                        }
                    }
                    else if (netAreaFeature.getGeometry().getType() === "Polygon") {
                        const polyFeature = netAreaFeature.clone();

                        polyFeature.setGeometry(netAreaFeature.getGeometry().clone());

                        // eslint-disable-next-line one-var
                        const featureGeoJson = olGeoJson.writeFeatureObject(polyFeature);

                        intersectionFeature = this.intersectFeature(featureGeoJson, drawFeatureGeoJson);

                        // eslint-disable-next-line one-var
                        const differenceFeature = this.cutOverlappingFeatures(intersectionFeature);

                        if (differenceFeature) {
                            differenceFeature.forEach(feature => {
                                this.addFeatureWithProperties(feature, featureGeoJson);
                            });
                        }
                    }
                }
                catch (error) {
                    // Remove the invalid drawn feature so user can draw again
                    this.drawState.layer.getSource().removeFeature(drawFeature);
                    console.error("Error processing net area feature:", error);
                }
            });
        },
        /**
         * Checks if the given feature intersects with any features in the net roof layer.
         * @param {GeoJson} featureGeoJson - The feature to check for intersection.
         * @param {GeoJson} drawFeatureGeoJson - The drawn feature to intersect with.
         * @returns {Feature} The intersection feature if an intersection exists, otherwise null.
         */
        async intersectFeature (featureGeoJson, drawFeatureGeoJson) {
            const olGeoJson = new GeoJSON();

            let intersectionFeature = null;

            try {
                const intersection = intersect(featureCollection([featureGeoJson, drawFeatureGeoJson]));

                if (intersection && intersection.geometry) {
                    // Convert Turf intersection (GeoJSON) to OpenLayers feature
                    intersectionFeature = olGeoJson.readFeature(intersection);
                }
            }
            catch (error) {
                console.error("Error during intersection calculation:", error);
            }

            // Remove the original drawn feature from the layer
            setTimeout(() => {
                const source = this.drawState.layer.getSource();

                source.getFeatures().forEach(f => {
                    if (f && !f.get("id")) {
                        source.removeFeature(f);
                    }
                });
            }, 0);

            if (intersectionFeature) {
                return intersectionFeature;
            }

            return null;
        },
        /**
         * Removes or cuts overlapping features from a given set of features.
         * @param {Feature} intersectionFeature - The feature to process.
         * @param {Feature} drawFeature - The original drawn feature for comparison.
         * @returns {Promise<Array<Object>} The array of features with overlaps removed or cut.
         */
        async cutOverlappingFeatures (intersectionFeature, drawFeature) {
            if (!intersectionFeature) {
                return [];
            }

            const olGeoJson = new GeoJSON(),
                drawFeatures = this.drawState.layer.getSource().getFeatures();
            // Start with the intersection geometry
            let currentGeoJson = olGeoJson.writeFeatureObject(intersectionFeature);

            // Subtract each overlapping drawn feature
            for (const feature of drawFeatures) {
                // Skip the feature if it's the same as the current drawFeature
                const drawFeatureGeoJson = olGeoJson.writeFeatureObject(drawFeature),
                    featureGeoJson = olGeoJson.writeFeatureObject(feature);

                if (booleanEqual(drawFeatureGeoJson, featureGeoJson)) {
                    continue;
                }

                if (booleanIntersects(currentGeoJson, featureGeoJson)) {
                    let differenceResult = null;

                    try {
                        // check if the feature geometries overlap and keep the non-overlapping part
                        differenceResult = difference(featureCollection([currentGeoJson, featureGeoJson]));
                    }
                    catch (error) {
                        console.error("Error during difference calculation:", error);
                        this.drawState.layer.getSource().removeFeature(drawFeature);
                        return [];
                    }

                    // check for invalid result
                    if (!differenceResult || !differenceResult.geometry || !this.isValidPolygon(differenceResult)) {
                        this.drawState.layer.getSource().removeFeature(drawFeature);
                        return [];
                    }

                    const validFeatures = this.extractValidPolygons(differenceResult);

                    if (validFeatures.length) {
                        currentGeoJson = validFeatures[0];
                    }
                    else {
                        this.drawState.layer.getSource().removeFeature(drawFeature);
                        return [];
                    }
                }
            }

            if (currentGeoJson && currentGeoJson.geometry && this.isValidPolygon(currentGeoJson)) {
                const validFeatures = this.extractValidPolygons(currentGeoJson);

                if (validFeatures.length) {
                    return validFeatures.map(f => olGeoJson.readFeature(f));
                }
            }
            return [];
        },
        /**
         * Adds a new feature to the map with the specified properties.
         *
         * @param {Object} feature - The feature object to add.
         * @param {Object} featureGeoJson - The GeoJson of the original roof feature containing the required properties.
         * @returns {void}
         */
        addFeatureWithProperties (feature, featureGeoJson) {
            const area2D = feature.getGeometry().getArea();

            // Add a text label style
            feature.setStyle(new Style({
                fill: new Fill({color: "rgba(37, 34, 226, 0.3)"}),
                stroke: new Stroke({color: "rgba(9, 237, 245, 1)", width: 2}),
                text: new OlText({
                    text: this.formData.id,
                    font: "bold 14px Arial",
                    fill: new Fill({color: "#222"}),
                    stroke: new Stroke({color: "#fff", width: 3}),
                    overflow: true
                })
            }));

            feature.setProperties({
                type: "polygon",
                id: this.formData.id,
                area2D: area2D,
                area3D: area2D / Math.cos((featureGeoJson.properties.dachneig * Math.PI) / 180)
            });

            this.drawState.layer.getSource().addFeature(feature);
            this.formData.features.push(feature);
        },
        /**
         * Checks if the given geoJson contains a valid polygon.
         * A valid polygon must have at least three distinct points.
         *
         * @param {GeoJson}} geoJson - GeoJson containing the feature to check.
         * @returns {boolean} True if the polygon is valid, false otherwise.
         */
        isValidPolygon (geoJson) {
            if (!geoJson) {
                return false;
            }

            // Helper to count distinct points in a ring
            // A valid polygon must have at least three distinct points.
            // eslint-disable-next-line
            function distinctPoints (ring) {
                const unique = new Set(ring.slice(0, -1).map(coord => coord.join(",")));

                return unique.size;
            }

            // Handle FeatureCollection
            if (geoJson.type === "FeatureCollection" && Array.isArray(geoJson.features)) {
                return geoJson.features.some(f => this.isValidPolygon(f));
            }

            // Handle GeometryCollection
            if (geoJson.type === "GeometryCollection" && Array.isArray(geoJson.geometries)) {
                return geoJson.geometries.some(g => this.isValidPolygon({type: "Feature", geometry: g}));
            }

            // Handle Feature
            if (geoJson.type === "Feature" && geoJson.geometry) {
                return this.isValidPolygon(geoJson.geometry);
            }

            // Polygon: all rings must have at least 4 points and at least 3 distinct points
            if (geoJson.type === "Polygon") {
                return Array.isArray(geoJson.coordinates) &&
                    geoJson.coordinates.length > 0 &&
                    geoJson.coordinates.every(ring => Array.isArray(ring) &&
                        ring.length >= 4 &&
                        distinctPoints(ring) >= 3
                    );
            }

            // MultiPolygon: all rings of all polygons must have at least 4 points and at least 3 distinct points
            if (geoJson.type === "MultiPolygon") {
                return Array.isArray(geoJson.coordinates) &&
                    geoJson.coordinates.length > 0 &&
                    geoJson.coordinates.every(
                        poly => Array.isArray(poly) &&
                            poly.length > 0 &&
                            poly.every(ring => Array.isArray(ring) &&
                                ring.length >= 4 &&
                                distinctPoints(ring) >= 3
                            )
                    );
            }
            return false;
        },
        /**
         * Extracts valid polygons from a given array of polygon objects.
         * A valid polygon is determined based on custom validation logic.
         *
         * @param {GeoJson} geoJson - The GeoJson containing the polygon to be validated and extracted.
         * @returns {Array<Object>} An array containing only the valid polygon objects.
         */
        extractValidPolygons (geoJson) {
            const validFeatures = [];

            // FeatureCollection
            if (geoJson.type === "FeatureCollection") {
                geoJson.features.forEach(f => {
                    if (this.isValidPolygon(f)) {
                        validFeatures.push(f);
                    }
                });
            }
            // GeometryCollection
            else if (geoJson.type === "GeometryCollection") {
                geoJson.geometries.forEach(g => {
                    if (this.isValidPolygon({type: "Feature", geometry: g})) {
                        validFeatures.push({type: "Feature", geometry: g});
                    }
                });
            }
            // Single Feature
            else if (geoJson.type === "Feature" && this.isValidPolygon(geoJson)) {
                validFeatures.push(geoJson);
            }
            // Single Polygon/MultiPolygon
            else if ((geoJson.type === "Polygon" || geoJson.type === "MultiPolygon") && this.isValidPolygon(geoJson)) {
                validFeatures.push({type: "Feature", geometry: geoJson});
            }

            return validFeatures;
        }
    }
};
</script>

<template lang="html">
    <div id="pvObligationRestrictionListForm">
        <div class="formContainer">
            <div class="formElements">
                <div class="actionsDraw">
                    <div
                        class="number"
                        :title="$t('additional:modules.pvObligation.components.restrictionList.numberExplaination', {id: formData.id})"
                    >
                        {{ formData.id }}
                    </div>
                </div>

                <div class="form-floating">
                    <textarea
                        :id="`list_item_${formData.id}`"
                        v-model="formData.description"
                        class="form-control"
                        rows="10"
                        :placeholder="$t('additional:modules.pvObligation.components.restrictionList.textareaPlaceholderNotes')"
                    />

                    <label :for="`list_item_${formData.id}`">
                        {{ $t("additional:modules.pvObligation.components.restrictionList.textareaPlaceholderNotes") }}
                    </label>
                </div>

                <span
                    v-if="formErrors.description"
                    class="invalid-feedback"
                >
                    {{ formErrors.description }}
                </span>

                <span
                    v-if="formErrors.features"
                    class="invalid-feedback"
                >
                    {{ formErrors.features }}
                </span>

                <div class="actions">
                    <div class="actionsRight">
                        <FlatButton
                            :text="$t('additional:modules.pvObligation.components.restrictionList.buttonSave')"
                            :interaction="() => onSave()"
                        />

                        <FlatButton
                            :secondary="true"
                            :text="$t('additional:modules.pvObligation.components.restrictionList.buttonCancel')"
                            :interaction="() => onCancel()"
                        />
                    </div>
                </div>
            </div>
        </div>

        <p
            v-if="formMode === 'create'"
            class="helpDraw"
        >
            <strong>
                {{ $t("additional:modules.pvObligation.components.restrictionList.helpFormDrawCreate.hint") }}
            </strong>

            {{ $t("additional:modules.pvObligation.components.restrictionList.helpFormDrawCreate.text") }}
        </p>

        <p
            v-if="formMode === 'edit'"
            class="helpDraw"
        >
            <strong>
                {{ $t("additional:modules.pvObligation.components.restrictionList.helpFormDrawModify.hint") }}
            </strong>

            {{ $t("additional:modules.pvObligation.components.restrictionList.helpFormDrawModify.text") }}
        </p>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #pvObligationRestrictionListForm{
        border: solid 0.0625rem $light_grey;
        border-radius: 0.5rem;
        background-color: #EFEFEF;
        padding: 1rem 1rem 0 1rem;
        margin-bottom: 1rem;

        div.actionsDraw {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
        }

        div.formContainer {
            display: flex;
            gap: 1rem;

            div.number {
                font-weight: bold;
                border: solid 0.0625rem $light_grey;
                background-color: $white;
                padding: 0.5rem;
                align-self: flex-start;
                border-radius: 0.5rem;
            }

            div.formElements {
                display: flex;
                flex-direction: column;
                flex: 1;

                div.form-floating {
                    width: 100%;

                    textarea {
                        height: 10rem;
                    }
                }
            }
        }

        div.actions {
            display: flex;
            justify-content: flex-end;
            margin-top: 1rem;

            button:hover {
                background-color: $light_grey;
            }

            div.actionsLeft {
                display: flex;
                gap: 0.5rem;
            }

            div.actionsRight {
                display: flex;
                gap: 1rem;
            }
        }

        p.helpDraw {
            padding-top: 1rem;
            border-top: solid 0.0625rem $light_grey;
        }
    }
</style>
