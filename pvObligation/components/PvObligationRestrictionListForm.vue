<script>
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";

import {mapActions, mapGetters} from "vuex";
import {Style, Stroke, Fill, Text as OlText} from "ol/style";
import {createBox} from "ol/interaction/Draw";
import {Draw} from "ol/interaction";
import {fromCircle} from "ol/geom/Polygon";
import GeoJSON from "ol/format/GeoJSON";
import booleanIntersects from "@turf/boolean-intersects";
import intersect from "@turf/intersect";
import difference from "@turf/difference";
import {featureCollection} from "@turf/helpers";

export default {
    name: "PvObligationRestrictionListForm",
    components: {
        FlatButton,
        IconButton
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
            shapes: {
                polygon: {
                    icon: "bi bi-pentagon",
                    geometryType: "Polygon"
                },
                circle: {
                    icon: "bi bi-circle",
                    geometryType: "Circle"
                },
                rectangle: {
                    icon: "bi bi-square",
                    geometryType: "Circle",
                    geometryFunction: createBox()
                }
            },
            drawState: {
                layer: null,
                interaction: null,
                activeShapeId: "polygon"
            }
        };
    },
    computed: {
        ...mapGetters("Modules/PvObligation", [
            "selectedRoofId"
        ])
    },
    async mounted () {
        await this.initializeDrawing();
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
        onSave () {
            if (!this.validate()) {
                return;
            }

            this.$emit("interaction", {
                action: "save",
                mode: this.formMode,
                data: this.formData
            });
        },
        onCancel () {
            this.formData = {...this.formDataItem};

            this.$emit("interaction", {
                action: "cancel",
                mode: this.formMode,
                data: this.formData
            });

            this.removeDrawnFeatures();
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
         * Sets the active shape used for drawing and recreates the draw interaction if changed.
         * @param {string} shapeId Identifier of the shape inside `shapes`.
         * @returns {void}
         */
        setSelectedShape (shapeId) {
            if (this.drawState.activeShapeId === shapeId) {
                return;
            }

            this.drawState.activeShapeId = shapeId;
            this.createDrawInteraction();
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
                type: this.shapes[this.drawState.activeShapeId].geometryType,
                geometryFunction: this.shapes[this.drawState.activeShapeId].geometryFunction,
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
         * Calculates area of given geometry. Supports polygons and circles.
         * @param {import('ol/geom/Geometry').default} geometry Geometry to calculate area from.
         * @returns {number|null} Area in map units or null if unsupported.
         */
        calculateArea (geometry) {
            if (typeof geometry.getArea === "function") {
                return geometry.getArea();
            }
            if (geometry.getType?.() === "Circle") {
                return fromCircle(geometry).getArea();
            }
            return null;
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

                if (netAreaFeature.getGeometry().getType() === "MultiPolygon") {
                    const featureGeoJson = olGeoJson.writeFeatureObject(netAreaFeature);

                    // Ensure featureGeoJson is valid
                    if (!featureGeoJson || !featureGeoJson.geometry) {
                        console.warn("Net area feature polygon is invalid or missing geometry.");
                        return;
                    }

                    intersectionFeature = await this.intersectFeature(featureGeoJson, drawFeatureGeoJson);

                    // eslint-disable-next-line one-var
                    const differenceFeature = await this.cutOverlappingFeatures(intersectionFeature);

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
            });
        },
        /**
         * Checks if the given feature intersects with any features in the net roof layer.
         * @param {GeoJson} featureGeoJson - The feature to check for intersection.
         * @param {GeoJson} drawFeatureGeoJson - The drawn feature to intersect with.
         * @returns {Feature} The intersection feature if an intersection exists, otherwise null.
         */
        async intersectFeature (featureGeoJson, drawFeatureGeoJson) {
            const intersection = intersect(featureCollection([featureGeoJson, drawFeatureGeoJson])),
                olGeoJson = new GeoJSON();

            let intersectionFeature = null;

            if (intersection && intersection.geometry) {
                // Convert Turf intersection (GeoJSON) to OpenLayers feature
                intersectionFeature = olGeoJson.readFeature(intersection);
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
         * @param {Feature} feature - The feature to process.
         * @returns {Promise<Array<Object>} The array of features with overlaps removed or cut.
         */
        async cutOverlappingFeatures (intersectionFeature) {
            if (!intersectionFeature) {
                return [];
            }

            const olGeoJson = new GeoJSON(),
                drawFeatures = this.drawState.layer.getSource().getFeatures(),
                differenceFeatures = [];

            let intersectionFeatureGeojson = olGeoJson.writeFeatureObject(intersectionFeature),
                differenceFeature = null;

            drawFeatures.forEach((feature, index) => {
                if (index === drawFeatures.length - 1) {
                    return;
                }
                const featureGeoJson = olGeoJson.writeFeatureObject(feature),
                    featuresIntersecting = booleanIntersects(intersectionFeatureGeojson, featureGeoJson);

                if (featuresIntersecting) {
                    const differenceResult = difference(featureCollection([intersectionFeatureGeojson, featureGeoJson]));

                    if (differenceResult && differenceResult.geometry) {
                        differenceFeature = olGeoJson.readFeature(differenceResult);
                        intersectionFeatureGeojson = differenceResult;
                    }
                }
            });

            if (differenceFeature) {
                differenceFeatures.push(differenceFeature);
            }
            else {
                differenceFeatures.push(intersectionFeature);
            }

            return differenceFeatures;
        },
        /**
         * Adds a new feature to the map with the specified properties.
         *
         * @param {Object} feature - The feature object to add.
         * @param {Object} featureGeoJson - The GeoJson of the original roof feature containing the required properties.
         * @returns {void}
         */
        addFeatureWithProperties (feature, featureGeoJson) {
            const area2D = this.calculateArea(feature.getGeometry());

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
                type: this.drawState.activeShapeId,
                id: this.formData.id,
                area2D: area2D,
                area3D: area2D / Math.cos((featureGeoJson.properties.dachneig * Math.PI) / 180)
            });

            this.drawState.layer.getSource().addFeature(feature);
            this.formData.features.push(feature);
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

                    <div
                        v-if="formMode === 'create'"
                        class="actionsDrawButtons"
                    >
                        <span>
                            {{ $t("additional:modules.pvObligation.components.restrictionList.selectDrawTool") }}
                        </span>

                        <div class="buttonGroup">
                            <IconButton
                                v-for="(shape, shapeId) in shapes"
                                :key="shapeId"
                                :aria="$t(`additional:modules.pvObligation.components.restrictionList.drawTypes.${shapeId}`)"
                                :icon="shape.icon"
                                :interaction="() => setSelectedShape(shapeId)"
                                :class-array="drawState.activeShapeId === shapeId ? ['btn-primary'] : ['btn-light']"
                            />
                        </div>
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
        border: solid 1px $light_grey;
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

            div.actionsDrawButtons {
                display: flex;
                align-items: center;
                gap: 1rem;

                div.buttonGroup {
                    display: flex;
                    gap: 0.25rem;
                }
            }
        }

        div.formContainer {
            display: flex;
            gap: 1rem;

            div.number {
                font-weight: bold;
                border: solid 1px $light_grey;
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
            border-top: solid 1px $light_grey;
        }
    }
</style>
