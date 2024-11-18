<script>
import Tool from "../../../../src/modules/tools/ToolTemplate.vue";
import {getComponent} from "../../../../src/utils/getComponent";
import {prepareDistrictLevels} from "../utils/prepareDistrictLevels";
import calculateExtent from "../../utils/features/calculateExtent.js";
import getBoundingGeometry from "../../utils/getBoundingGeometry.js";
import {setBBoxToGeom} from "../../utils/setBBoxToGeom.js";
import {mapGetters, mapActions, mapMutations, mapState} from "vuex";
import getters from "../store/gettersDistrictSelector";
import mutations from "../store/mutationsDistrictSelector";
import {DragBox, Select} from "ol/interaction";
import {singleClick} from "ol/events/condition";
import {Fill, Stroke, Style, Text} from "ol/style.js";
import {styleSelectedDistrictLevels} from "../utils/styleSelectedDistrictLevels";
import {getFeaturePOST as wfsGetFeature} from "../../../../src/api/wfs/getFeature.js";
import ToolInfo from "../../components/ToolInfo.vue";
import {onFeaturesLoaded, addModelsByAttributes, getModelByAttributes} from "../../utils/radioBridge.js";
import DistrictSelectorFilter from "./DistrictSelectorFilter.vue";
import DistrictSelectorLevel from "./DistrictSelectorLevel.vue";
import Feature from "ol/Feature";
import {union} from "../../utils/geomUtils.js";
import IconButton from "./IconButton.vue";
import AccordionItem from "./AccordionItem.vue";

export default {
    name: "DistrictSelector",
    components: {
        Tool,
        ToolInfo,
        DistrictSelectorFilter,
        DistrictSelectorLevel,
        IconButton,
        AccordionItem
    },
    data () {
        return {
            // A buffer for the extent of the selected district(s)
            bufferVal: 0,
            // color for the drag box button
            dragBoxButtonColor: "grey lighten-1",
            // display additional info layers by key true/false
            visibleInfoLayers: [],
            // shows whether the features for all districts have been loaded
            districtLevelLayersLoaded: false
        };
    },
    computed: {
        ...mapGetters("Language", ["currentLocale"]),
        ...mapGetters("Tools/DistrictSelector", Object.keys(getters)),
        ...mapGetters("Maps", ["getVisibleLayerList"]),
        ...mapState(["easyReadMode"]),
        ...mapGetters("Tools/AreaSelector", {areaSelectorGeom: "geometry"}),

        selectedNames: {
            get () {
                return this.selectedDistrictNames;
            },
            set (v) {
                this.setSelectedDistrictNames(v);
            }
        },

        selectedLevelId: {
            get () {
                return this.selectedDistrictLevelId;
            },
            set (v) {
                this.setSelectedDistrictLevelId(v);
            }
        },

        layerList () {
            return mapCollection.getMap("2D").getLayers().getArray();
        }
    },

    watch: {
        /**
         * If the tool is active, activate the select interaction and add overlay to the districtLayers if necessary
         * If the tool is not actvie, deactivate the interactions (select, drag box) and remove overlay if no districts are selected
         * and update the extent of the selected features (districts).
         * @param {boolean} newActive - Defines if the tool is active.
         * @returns {void}
         */
        active (newActive) {
            if (newActive) {
                this.select.setActive(true);
                document.addEventListener("keyup", this.checkKey);

                // add overlay if no districts are selected at this point
                if (this.selectedNames.length === 0) {
                    styleSelectedDistrictLevels(this.districtLevels, this.selectedLevelId, this.selectedDistrictLevel.activeStyle);
                }
            }
            else {
                const model = getComponent(this.id);

                this.updateExtent();
                this.dragBox.setActive(false);
                this.select.setActive(false);
                if (this.selectedFeatures.length > 0) {
                    this.addNewSelection({selection: this.selectedFeatures, source: this.$t("additional:modules.tools.cosi.districtSelector.title"), id: this.label + ": " + this.selectedFeatures[0].getProperties()[this.keyOfAttrName] + ", +" + (this.selectedFeatures.length - 1)});
                }
                document.removeEventListener("keyup", this.checkKey);

                if (model) {
                    model.set("isActive", false);
                }

                this.$watch("$store.state.Tools.Print.active", (newVal) => {
                    if (newVal) {
                        styleSelectedDistrictLevels(this.districtLevels, this.selectedLevelId, {
                            fill: {
                                color: [255, 255, 255, 0]
                            },
                            stroke: {
                                color: [51, 153, 204, 1],
                                width: 3
                            }
                        }, 0);
                    }
                    else if (this.selectedNames.length) {
                        styleSelectedDistrictLevels(this.districtLevels, this.selectedLevelId, {
                            fill: {
                                color: [255, 255, 255, 0]
                            },
                            stroke: {
                                color: [51, 153, 204, 1],
                                width: 3
                            }
                        }, 0.6);
                    }
                });

                // remove overlay if no districts are selected at this point
                if (this.selectedNames.length === 0) {
                    styleSelectedDistrictLevels(this.districtLevels);
                }

                if (this.selectedNames.length && typeof this.toolToOpen === "string") {
                    this.$store.dispatch("Tools/setToolActive", {id: this.toolToOpen, active: true});
                }
            }
        },
        /**
         * Every time the list of layers of the map changes the function prepareDistricts is called.
         * @param {module:ol/layer[]} newLayerList - An array of layers.
         * @returns {void}
         */
        layerList: function (newLayerList) {
            prepareDistrictLevels(this.districtLevels, newLayerList);
        },

        selectedDistrictsCollection: "transferFeatures",
        selectedLevelId: ["clearFeatures", "changeSelectedDistrictLevel"],

        visibleInfoLayers () {
            this.toggleAdditionalLayers();
        },

        /**
         * @description Watches Layer visiblity changes to determine whether the addtional info layers are active
         * @param {module:ol/layer[]} layerList - An array of visible layers.
         * @returns {void}
         */
        getVisibleLayerList (layerList) {
            this.checkAdditionalLayers(layerList);
        },

        /**
         * When the easyReadMode on the map is toggled on/off the overlay is removed and has to be refreshed
         * @returns {void}
         */
        easyReadMode () {
            if (this.selectedNames.length !== 0 || this.active) {
                styleSelectedDistrictLevels(this.districtLevels, this.selectedLevelId, this.selectedDistrictLevel.activeStyle);
            }
        },

        boundingGeometry () {
            this.bufferLayer.getSource().clear();
            if (this.bufferVal > 0 && typeof this.boundingGeometry !== "undefined") {
                const bufferedFeature = this.getBufferFeature(this.boundingGeometry.getGeometries());

                this.bufferLayer.getSource().addFeature(bufferedFeature);
            }
        }
    },
    created () {
        this.$on("close", () => {
            this.setActive(false);
        });
        prepareDistrictLevels(this.districtLevels, this.layerList);
        this.selectedLevelId = this.districtLevels[0].layerId;
        this.setNonReactiveData();
        this.initializeAdditionalInfoLayers();
    },
    mounted () {
        /**
         * @description Styles the selected district level when the layer is loaded, then unsubsubscribes the call
         * @todo refactor to vuex, there should be an event on the map calling out loaded features
         * @deprecated
         */
        onFeaturesLoaded((layerId) => {
            if (!this.districtLevelLayersLoaded && this.selectedLevelId === layerId) {
                styleSelectedDistrictLevels(this.districtLevels, this.selectedLevelId, this.selectedDistrictLevel.activeStyle);
                this.districtLevelLayersLoaded = true;
                this.$forceUpdate();
            }
        });

        if (this.active) {
            document.addEventListener("keyup", this.checkKey);
        }

        this.loadMapping();
    },

    methods: {
        ...mapMutations("Tools/DistrictSelector", Object.keys(mutations)),
        ...mapMutations("Tools/Filter", ["setFilterGeometry"]),
        ...mapActions("Alerting", ["addSingleAlert", "cleanup"]),
        ...mapActions("Tools/DistrictSelector", ["loadStatFeatures", "loadMapping"]),
        ...mapActions("Maps", ["addInteraction", "removeInteraction", "zoomToExtent", "resetView", "addNewLayerIfNotExists"]),
        ...mapActions("Tools/SelectionManager", ["addNewSelection"]),
        /**
         * quickly checks the key evt code
         * and executes createNewScenario
         * @param {Event} evt - the key event
         * @returns {void}
         */
        checkKey (evt) {
            if (evt.code === "Enter") {
                this.setActive(false);
            }
        },

        /**
         * Get a feature to display the buffer. Merges the geometries of the districts.
         * @param {ol/geom/Geometry[]} geometries - An array of buffered district geometries.
         * @returns {ol/Feature} The bufferd feature.
         */
        getBufferFeature (geometries) {
            const features = [];

            geometries.forEach(geom => {
                const feature = new Feature({
                    geometry: geom
                });

                features.push(feature);
            });
            return union(features, false, true);
        },

        /**
         * Remove all features from the features collection of the select interaction.
         * @returns {void}
         */
        clearFeatures () {
            this.select.getFeatures().clear();
        },

        /**
         * Sets the district level to the given id.
         * @param {String} id - The layer id of the selected district lelvel.
         * @returns {void}
         */
        changeSelectedDistrictLevel (id) {
            const districtLevel = this.getDistrictLevelById(id);

            this.setSelectedDistrictLevel(districtLevel);
            styleSelectedDistrictLevels(this.districtLevels, id, districtLevel.activeStyle);
        },

        /**
         * Gets the selected district level to the given id.
         * @param {String} layerId - The layer id of the selected district level.
         * @returns {Object} The selected district level.
         */
        getDistrictLevelById (layerId) {
            return this.districtLevels.find(district => {
                return district.layerId === layerId;
            });
        },

        /**
         * Registers listener for drag box interaction events.
         * On "boxend" all features that intersect the box are added to the feature collection.
         * On "boxstart" calls the clearFeatures function.
         * @param {module:ol/interaction/DragBox} dragBox - Interaction for drawing a vector box.
         * @param {module:ol/Collection} featureCollection - The feature collection of the select interaction.
         * @returns {void}
         */
        registerDragBoxListener (dragBox, featureCollection) {
            dragBox.on("boxend", (evt) => {
                const extent = evt.target.getGeometry().getExtent(),
                    source = this.getDistrictLevelById(this.selectedLevelId).layer.getSource();

                source.forEachFeatureIntersectingExtent(extent, (feature) => {
                    featureCollection.push(feature);
                });
            });

            dragBox.on("boxstart", () => this.clearFeatures());
        },

        /**
         * Registers listener for the feature collection of the select interaction.
         * On "change:length" (add or remove a feautre to/from the collection) the names of the selected districts are saved to the store.
         * On "change:add" the district is set to selected.
         * On "change:remove" the district is set to unselected.
         * @param {module:ol/Collection} featureCollection - The feature collection of the select interaction.
         * @returns {void}
         */
        registerFeatureCollectionListener (featureCollection) {
            featureCollection.on("change:length", (evt) => {
                const selectedNames = evt.target.getArray().map(feature => {
                    return feature.get(this.keyOfAttrName);
                });

                this.setSelectedDistrictsCollection(evt.target);
                this.selectedNames = [...new Set(selectedNames)];
            });

            featureCollection.on("remove", (evt) => {
                // evt.element -> feature that was removed
                const foundDistrict = this.selectedDistrictLevel.districts.find(district => {
                    return district.adminFeature.getId() === evt.element.getId();
                });

                foundDistrict.isSelected = false;
            });

            featureCollection.on("add", (evt) => {
                // evt.element -> feature that was added
                const foundDistrict = this.selectedDistrictLevel.districts.find(district => {
                    return district.adminFeature.getId() === evt.element.getId();
                });

                foundDistrict.isSelected = true;
            });
        },

        /**
         * Shows an alert message.
         * @param {String} content - The content of the message.
         * @param {String} [category="Info"] - The category (Info, Warnung, Error) of the message.
         * @param {String} [cssClass="info"] - The style (info, warning, error) of the message.
         * @returns {void}
         */
        showAlert (content, category = "Info", cssClass = "info") {
            this.addSingleAlert({
                category: category,
                content: content,
                displayClass: cssClass
            });
        },

        /**
         * Sets all needed non reactive data.
         * @returns {void}
         */
        async setNonReactiveData () {
            // select interaction
            this.select = new Select({
                // select only features of the selected district level
                filter: (feature, layer) => {
                    const keyOfAttrName = this.selectedDistrictLevel.keyOfAttrName;

                    return layer.get("id") === this.selectedLevelId && this.selectedDistrictLevel.filterableValues.includes(feature.get(keyOfAttrName));
                },
                style: new Style({
                    fill: new Fill({color: "rgba(255, 255, 255, 0)"}),
                    stroke: new Stroke({color: "#3399CC", width: 5})
                }),
                addCondition: singleClick,
                removeCondition: singleClick
            });
            this.registerFeatureCollectionListener(this.select.getFeatures());
            this.addInteraction(this.select);

            // drag box interaction
            this.dragBox = new DragBox();
            this.dragBox.setActive(false);
            this.registerDragBoxListener(this.dragBox, this.select.getFeatures());
            this.addInteraction(this.dragBox);

            // buffer layer
            this.bufferLayer = await this.addNewLayerIfNotExists({layerName: "district-selection-buffer"});
            this.bufferLayer.setStyle(() => {
                return new Style({
                    stroke: new Stroke({
                        color: [66, 66, 66, 1],
                        width: 1,
                        lineDash: [10, 4]
                    }),
                    text: new Text({
                        textAlign: "start",
                        textBaseline: "middle",
                        text: "Puffer",
                        fill: new Fill({color: "white"}),
                        stroke: new Stroke({color: [66, 66, 66, 1], width: 4}),
                        placement: "line",
                        font: "12px Arial",
                        repeat: 500
                    })
                });
            });
        },

        /**
         * Activates/deactivates the dragbox interaction and toggles the css class for the drag box button.
         * @returns {void}
         */
        toggleDragBox () {
            if (this.dragBox.getActive()) {
                this.dragBox.setActive(false);
                this.dragBoxButtonColor = "grey lighten-1";
            }
            else {
                this.dragBox.setActive(true);
                this.dragBoxButtonColor = "primary";
            }
        },

        /**
         * If the collection are set outside this component,
         * the features of this collection are transferred to the feature collection of the select interaction.
         * Then the updateExtent function is called.
         * Otherwise nothing else happens.
         * @param {module:ol/Collection} featureCollection - The feature collection of the select interaction.
         * @returns {void}
         */
        transferFeatures (featureCollection) {
            if (featureCollection.get("fromExternal")) {
                // if no districts have been selected
                // and the tool is closed
                // shade all not selected districts
                // before applying the new selection
                if (this.selectedNames.length === 0 && !this.active) {
                    styleSelectedDistrictLevels(this.districtLevels, this.selectedDistrictLevel.layerId, this.selectedDistrictLevel.activeStyle);
                }
                this.select.getFeatures().clear();
                featureCollection.forEach(feature => {
                    this.select.getFeatures().push(feature);
                });
                this.updateExtent(featureCollection.get("zoomToExtent"));
            }
        },

        /**
         * Sets the extent and zoom to it, if not empty.
         * Sets the BBox of all Vector Layers to the selected districts
         * If the extent is empty (this means no features are selected), a warning appears.
         * @param {Boolean} zoomToExtent - Should the camera zoom to the selection?
         * @returns {void}
         */
        updateExtent (zoomToExtent = true) {
            const extent = calculateExtent(this.selectedFeatures, parseInt(this.bufferVal, 10)),
                bboxGeom = getBoundingGeometry(this.selectedFeatures, this.bufferVal),
                selectedDistricts = this.selectedDistrictLevel.districts.filter(district => district.isSelected === true);

            if (extent) {
                this.setBufferValue(this.bufferVal);
                this.setExtent(extent);
                this.setBoundingGeometry(bboxGeom);
                setBBoxToGeom.call(this, this.areaSelectorGeom || bboxGeom);
                this.setFilterGeometry(this.areaSelectorGeom || bboxGeom);

                if (zoomToExtent) {
                    this.zoomToExtent({extent, options: {}});
                }

                this.loadStatFeatures({
                    districts: selectedDistricts,
                    districtLevel: this.selectedDistrictLevel,
                    getStatFeatures: wfsGetFeature
                });
            }
            else {
                this.setExtent([]);
                this.resetView();
                this.setBoundingGeometry(undefined);
                setBBoxToGeom.call(this, this.areaSelectorGeom || undefined);
                this.setFilterGeometry(this.areaSelectorGeom || false);
                this.showAlert(this.$t("additional:modules.tools.cosi.districtSelector.warning"), "Warnung", "warning");
            }
        },

        /**
         * @description Display additional info layers according to layerId List from config.
         * @todo Refactor to vue when MP Core is updated
         * @param {String} key the infolayer groups key
         * @returns {void}
         */
        toggleAdditionalLayers () {
            for (const key in this.additionalInfoLayers) {
                const state = this.visibleInfoLayers.includes(key);

                for (const layerId of this.additionalInfoLayers[key]) {
                    const model = getModelByAttributes({id: layerId});

                    if (model) {
                        model.set("isSelected", state);
                    }
                }
            }
        },

        /**
         * @description Checks if the additional info layers are visible on mounted.
         * @todo Refactor to vue when MP Core is updated
         * @param {module:ol/layer[]} layerList - An array of visible layers.
         * @returns {boolean} the state of at least one of the addtional layers
         */
        checkAdditionalLayers (layerList) {
            let state, states, oldState, newState;

            for (const key in this.additionalInfoLayers) {
                states = [];

                for (const layerId of this.additionalInfoLayers[key]) {
                    state = layerList.some(layer => typeof layer?.get === "function" && layer.get("id") === layerId);
                    states = states.includes(state) ? states : [...states, state];
                }

                if (states.length === 1 || states.includes(true)) {
                    oldState = this.visibleInfoLayers.includes(key);
                    newState = states[0];
                    if (newState && !oldState) {
                        this.visibleInfoLayers.push(key);
                    }
                    else if (!newState && oldState) {
                        this.visibleInfoLayers = this.visibleInfoLayers.filter(e => e !== key);
                    }
                }
                else {
                    this.visibleInfoLayers = [];
                }
            }
        },

        /**
         * @description Checks if the additional info layers are added to the ModelList and adds them if not.
         * @todo Refactor to vue when MP Core is updated
         * @returns {void}
         */
        initializeAdditionalInfoLayers () {
            for (const key in this.additionalInfoLayers) {
                for (const layerId of this.additionalInfoLayers[key]) {
                    if (!getModelByAttributes({id: layerId})) {
                        addModelsByAttributes({id: layerId});
                    }
                }
            }
        },

        /**
         * Find the district features by the given names
         * and add them to the feature collection of the select interaction.
         * @param {String[]} namesOfDistricts - Names of the districts to be selected.
         * @returns {void}
         */
        updateSelectedFeatures (namesOfDistricts) {
            this.clearFeatures();

            if (namesOfDistricts.length > 0) {
                const districtFeatures = this.layer.getSource().getFeatures(),
                    namesAssoc = {};

                namesOfDistricts.forEach(name => {
                    namesAssoc[name] = true;
                });

                districtFeatures.forEach(feature => {
                    if (Object.prototype.hasOwnProperty.call(namesAssoc, feature.get(this.keyOfAttrName))) {
                        this.select.getFeatures().push(feature);
                    }
                });
            }
        }
    }
};
</script>

<template lang="html">
    <Tool
        :title="$t('additional:modules.tools.cosi.districtSelector.title')"
        :icon="icon"
        :active="active"
        :render-to-window="renderToWindow"
        :resizable-window="resizableWindow"
        :deactivate-gfi="deactivateGFI"
    >
        <template
            v-if="active"
            #toolBody
        >
            <v-app id="district-selector">
                <ToolInfo
                    :url="readmeUrl"
                    :locale="currentLocale"
                    :summary="$t('additional:modules.tools.cosi.districtSelector.description')"
                />
                <DistrictSelectorLevel
                    :district-levels="districtLevels"
                    :selected-level-id="selectedLevelId"
                    @setSelectedDistrictLevelId="setSelectedDistrictLevelId"
                />
                <DistrictSelectorFilter
                    :district-levels="districtLevels"
                    :selected-level-id="selectedLevelId"
                    :selected-district-names-by-map="selectedNames"
                    @updateSelectedFeatures="updateSelectedFeatures"
                />
                <hr class="my-4 mx-0 text-black-50">
                <AccordionItem
                    id="hidden-objects"
                    :title="$t('additional:modules.tools.cosi.districtSelector.drawLabel')"
                    icon="bi bi-plus-square-dotted"
                >
                    <div class="d-flex align-items-center">
                        <IconButton
                            :id="'drawButton'"
                            :aria="'Rechteck zeichnen'"
                            :class-array="['btn-primary', 'me-3', dragBox.getActive() ? 'active': '']"
                            :icon="'bi bi-square'"
                            :interaction="() => toggleDragBox()"
                        />
                    </div>
                </AccordionItem>
                <div v-if="Object.keys(additionalInfoLayers).length">
                    <AccordionItem
                        id="hidden-objects2"
                        :title="$t('additional:modules.tools.cosi.districtSelector.additionalLayer')"
                        icon="bi bi-layers-half"
                    >
                        <div class="mb-2">
                            {{ $t('additional:modules.tools.cosi.districtSelector.additionalInfoLayersHelp') }}
                        </div>
                        <div
                            v-for="(ids, key) in additionalInfoLayers"
                            :key="key"
                            class="form-check form-switch fs-5 me-3"
                        >
                            <input
                                id="layerSwitcher"
                                v-model="visibleInfoLayers"
                                class="form-check-input rounded-pill me-1"
                                type="checkbox"
                                :value="key"
                                role="switch"
                                aria-checked="false"
                            >
                            <label
                                class="form-check-label"
                                for="layerSwitcher"
                            >
                                {{ key }}
                            </label>
                        </div>
                    </AccordionItem>
                </div>
                <AccordionItem
                    id="hidden-objects3"
                    :title="$t('additional:modules.tools.cosi.districtSelector.inputLabel')"
                    icon="bi bi-record-circle"
                >
                    <input
                        v-if="enableBuffer"
                        id="input-buffer"
                        v-model="bufferVal"
                        class="form-control w-25"
                        type="number"
                        step="250"
                        min="0"
                    >
                </AccordionItem>
                <div class="d-grid d-flex justify-content-between mt-5">
                    <button
                        id="confirmButton"
                        class="btn btn-outline lh-1 fs-5"
                        @click="setActive(false);"
                    >
                        <i class="bi bi-check-lg pe-2" />{{ $t("additional:modules.tools.cosi.districtSelector.buttonConfirm") }}
                    </button>
                    <button
                        id="resetButton"
                        class="btn btn-outline lh-1 fs-5"
                        @click="clearFeatures"
                    >
                        <i class="bi bi-arrow-counterclockwise pe-2" />{{ $t("additional:modules.tools.cosi.districtSelector.buttonReset") }}
                    </button>
                </div>
            </v-app>
        </template>
    </Tool>
</template>

<style lang="scss">
    @import "~variables";
    @import "~/css/mixins.scss";

    #district-selector {
        font-family: $font_family_default;
        max-width: 460px;

        .btn-outline {
            border-color: $light_blue;
            color: $light_blue;
        }
       .btn-outline:hover {
            cursor: pointer;
            background-color: $light_blue;
            color: $white;
       }
    }

    .ol-dragbox {
        background-color: rgba(255, 255, 255, 0.4);
        border-color: rgba(51, 153, 204, 1);
        border-width: 1.25
    }
</style>
