<script>
import PvObligationWizardStepScriptExtends from "./PvObligationWizardStepScriptExtends.vue";
import {mapActions, mapGetters, mapMutations} from "vuex";
import Select from "ol/interaction/Select";
import {Style, Stroke, Fill} from "ol/style";
import thousandsSeparator from "@shared/js/utils/thousandsSeparator";
import axios from "axios";
import ConfirmModalItem from "./shared/ConfirmModalItem.vue";
import PvObligationSimpleTable from "./PvObligationSimpleTable.vue";

import getOAFFeature from "@shared/js/api/oaf/getOAFFeature";

export default {
    name: "PvObligationWizardStepGrossArea",
    components: {
        ConfirmModalItem,
        PvObligationSimpleTable
    },
    extends: PvObligationWizardStepScriptExtends,
    data () {
        return {
            /** @override */
            componentFormData: {
                grossRoofArea: null
            },
            /** @override */
            componentFormErrors: {
                grossRoofArea: null
            },
            grossAreaSelection: null,
            displayGrossRoofArea: 0,
            grossAreaStyle: {},
            showConfirmModal: false,
            pendingRoofId: null,
            isClicked: false
        };
    },
    computed: {
        ...mapGetters(["configJs"]),
        ...mapGetters("Modules/PvObligation", [
            "selectedRoofId"
        ])
    },
    watch: {
        /** @override */
        wizardStepIsActive: {
            handler (isNowActive, wasActiveBefore) {
                if (wasActiveBefore) {
                    this.isClicked = false
                    // this.grossAreaSelection.setActive(false);

                    const roofLayer = mapCollection.getMap("2D").getLayers().getArray().find(l => {
                        return l.get("id") === "Module/pvObligation/layer/roofArea";
                    });

                    roofLayer.setVisible(false);
                }
                else if (isNowActive && this.isClicked) {
                    // this.grossAreaSelection.setActive(true);

                    const grossAreaLayer = mapCollection.getMap("2D").getLayers().getArray().find(l => {
                            return l.get("id") === "Module/pvObligation/layer/roofArea";
                        }),
                        netAreaLayer = mapCollection.getMap("2D").getLayers().getArray().find(l => {
                            return l.get("id") === "Module/pvObligation/layer/roofArea_pv_suitable";
                        });

                        console.log(netAreaLayer)

                    if (netAreaLayer) {
                        netAreaLayer.setVisible(false);
                    }

                    grossAreaLayer.setVisible(true);
                }
            },
            immediate: true
        }
    },
    async mounted () {
        const styleJson = await axios.get(this.configJs.styleConf);

        this.grossAreaStyle = styleJson.data.find(style => {
            return style.styleId === "dachflaechen";
        }).rules[0].style;

        this.addSingleClickToWMSLayer();
        // this.defineGrossArea({layerName: "Module/pvObligation/layer/roofArea"});
    },
    methods: {
        ...mapMutations("Modules/PvObligation", [
            "setSelectedRoofId"
        ]),
        ...mapActions("Modules/PvObligation", [
            "dissolveRoofFeaturesAndCalculateArea"
        ]),
        ...mapActions("Maps", [
            "addNewLayerIfNotExists",
            "addInteraction"
        ]),
        async defineGrossArea (payload) {
            const rgbStroke = this.grossAreaStyle?.polygonStrokeColor?.join(","),
                strokeColor = `rgb(${rgbStroke})`,
                rgbFill = this.grossAreaStyle?.polygonFillColor?.join(","),
                fillColor = `rgba(${rgbFill})`,
                selectInteraction = new Select({
                    style: new Style({
                        stroke: new Stroke({color: strokeColor, width: this.grossAreaStyle?.polygonStrokeWidth || 1}),
                        fill: new Fill({color: fillColor})
                    }),
                    filter: (feature, layer) => {
                        return layer && layer.get("name") === "Dachflächen";
                    }
                }),
                outlineLayer = await this.addNewLayerIfNotExists({layerName: payload.layerName, alwaysOnTop: true});

            outlineLayer.setStyle(new Style({
                stroke: new Stroke({color: "rgba(12, 247, 227, 1)", width: 3}),
                fill: new Fill({color: "rgba(0, 0, 0, 0)"})
            }));

            this.addInteraction(selectInteraction);
            this.grossAreaSelection = selectInteraction;

            selectInteraction.on("select", async (e) => {                
                const selectedFeature = e.selected[0],
                    roofId = selectedFeature ? selectedFeature.get("gebaeude_id") : null;

                // Show confirm modal if another roof is selected
                if (this.selectedRoofId && this.selectedRoofId !== roofId) {
                    this.pendingRoofId = roofId;
                    this.showConfirmModal = true;

                    return;
                }

                this.setAndDisolveRoofId(roofId, outlineLayer);
            });
        },
        /** @override */
        componentFormDataValidate () {
            const errorMessageMissingValue = this.$t("additional:modules.pvObligation.formErrors.genericMissingValue");

            this.componentFormErrors.grossRoofArea = !this.componentFormData.grossRoofArea
                ? errorMessageMissingValue
                : null;

            return !Object.values(this.componentFormErrors).some(Boolean);
        },
        handleClickedActionButtonCancel () {
            this.showConfirmModal = false;
            this.pendingRoofId = null;
        },
        async handleClickedActionButtonConfirm () {
            this.resetWizardData();

            this.setAndDisolveRoofId(this.pendingRoofId, mapCollection.getMap("2D").getLayers().getArray().find(l => l.get("id") === "Module/pvObligation/layer/roofArea"));

            this.showConfirmModal = false;
            this.pendingRoofId = null;
        },
        async setAndDisolveRoofId (roofId, outlineLayer) {
            this.setSelectedRoofId(roofId);

            const area = await this.dissolveRoofFeaturesAndCalculateArea({
                roofId: roofId,
                outlineLayer: outlineLayer,
                layerName: "Dachflächen"
            });

            this.componentFormData.grossRoofArea = Math.round(area * 10) / 10;
            this.displayGrossRoofArea = thousandsSeparator(this.componentFormData.grossRoofArea);
        },
        addSingleClickToWMSLayer () {
            const map = mapCollection.getMap("2D");

            map.on("singleclick", async (event) => {
                this.isClicked = true
                
                wmsLayer = map.getLayers().getArray().find(layer => layer.get("id") === "34754"),
                viewResolution = map.getView().getResolution(),
                url = wmsLayer?.getSource().getFeatureInfoUrl(
                    event.coordinate,
                    viewResolution,
                    map.getView().getProjection(),
                    {
                        'INFO_FORMAT': 'text/xml',
                        'FEATURE_COUNT': 1
                    }
                );

                try {
                    const response = await fetch(url),
                        xmlText = await response.text(),
                        buildingId = xmlText.split('<de.hh.up:gebaeude_id>')[1]?.split('</')[0];
                    
                    this.setSelectedRoofId(buildingId);



                    const features = await this.getFeatureById(buildingId)
                    const features2 = await this.getFeatureById2(buildingId)
                    this.addFeaturesToLayers(features2, "Dachflächen2")

                    this.addFeaturesToLayers(features, "Dachflächen")
                    this.addFeaturesToLayers(features, "Module/pvObligation/layer/roofArea", true)
                    this.addFeaturesToLayers(features, "Module/pvObligation/layer/roofArea_pv_suitable")
                    this.addFeaturesToLayers(features, "PV-geeignete Dachflächen")

                } catch (error) {
                    console.error("GetFeatureInfo error:", error);
                }
            })
        },

        async getFeatureById (buildingId) {
            const baseUrl = "https://qs-api.hamburg.de/datasets/v1/pv_geeignete_dachflaechen",
                collection = "pv_geeignete_dachflaechen",           
                filter = `gebaeude_id='${buildingId}'`;

             try {
                 const geoJson = await getOAFFeature.getOAFFeatureGet(baseUrl, collection, {
                            filter,
                            filterCrs: "http://www.opengis.net/def/crs/OGC/1.3/CRS84"
                        }),
                    features = getOAFFeature.readAllOAFToGeoJSON(geoJson, {
                        dataProjection: "EPSG:4326",
                        featureProjection: "EPSG:25832"
                    });

                    return features;
                }
             catch (error) {
                console.error("Error fetching features: ", error);
             }
        },

        // will be merged with 1
        async getFeatureById2 (buildingId) {
            const baseUrl = "https://qs-api.hamburg.de/datasets/v1/dachflaechen",
                collection = "dachflaechen",           
                filter = `gebaeude_id='${buildingId}'`;

             try {
                 const geoJson = await getOAFFeature.getOAFFeatureGet(baseUrl, collection, {
                            filter,
                            filterCrs: "http://www.opengis.net/def/crs/OGC/1.3/CRS84"
                        }),
                    features = getOAFFeature.readAllOAFToGeoJSON(geoJson, {
                        dataProjection: "EPSG:4326",
                        featureProjection: "EPSG:25832"
                    });

                    return features;
                }
             catch (error) {
                console.error("Error fetching features: ", error);
             }
        },

        async addFeaturesToLayers(features, layerName, alwaysOnTop=false) {
            const layer = await this.addNewLayerIfNotExists({layerName: layerName, alwaysOnTop: alwaysOnTop});
            
            layer.getSource().clear();
            layer.getSource().addFeatures(features)

            layer.setVisible(true)

            // style will be parametric..
            if (alwaysOnTop) {
                console.log(layer.name)
                layer.setStyle(new Style({
                    stroke: new Stroke({color: "rgba(12, 247, 227, 1)", width: 3}),
                    fill: new Fill({color: "rgba(0, 0, 0, 0)"})
                }));
            }

            // it can be checked differently....
            if(layerName === "Module/pvObligation/layer/roofArea") {
                this.setAndDisolveRoofId(this.selectedRoofId, layer);
            }
        },
    }
};
</script>

<template lang="html">
    <div id="pvObligationWizardStepGrossArea">
        <p>
            {{ $t("additional:modules.pvObligation.wizard.step.grossArea.component.introduction") }}
        </p>

        <p>
            {{ $t("additional:modules.pvObligation.wizard.step.grossArea.component.introductionHint") }}
        </p>

        <PvObligationSimpleTable
            v-if="componentFormData.grossRoofArea !== null && componentFormData.grossRoofArea >= 50"
            :rows="[
                {
                    label: $t('additional:modules.pvObligation.wizard.step.grossArea.component.tableCellGrossAreaLabel'),
                    value: `${displayGrossRoofArea} m²`
                }
            ]"
        />

        <p
            v-else-if="componentFormData.grossRoofArea !== null"
            class="noOblicagionText"
        >
            {{ $t("additional:modules.pvObligation.wizard.step.grossArea.component.tooSmallAreaText") }}
        </p>

        <ConfirmModalItem
            modal-inner-wrapper-style="max-width: 25rem"
            :show-modal="showConfirmModal"
            :modal-title="$t('additional:modules.pvObligation.wizard.step.grossArea.component.confirmModal.header')"
            :button-confirm-label="$t('additional:modules.pvObligation.wizard.step.grossArea.component.confirmModal.actionButtonConfirmLabel')"
            :button-cancel-label="$t('additional:modules.pvObligation.wizard.step.grossArea.component.confirmModal.actionButtonCancelLabel')"
            @clicked-confirm="handleClickedActionButtonConfirm()"
            @clicked-cancel="handleClickedActionButtonCancel()"
        >
            <p>
                {{ $t('additional:modules.pvObligation.wizard.step.grossArea.component.confirmModal.contentIntro') }}
            </p>

            <p>
                {{ $t('additional:modules.pvObligation.wizard.step.grossArea.component.confirmModal.contentQuestion') }}
            </p>
        </ConfirmModalItem>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #pvObligationWizardStepGrossArea {
        margin-top: 0.5rem;

        strong.grossRoofAreaValue {
            display: flex;
            justify-content: center;
            font-size: 1.25rem;
        }

        p.noOblicagionText {
            font-size: 1.125rem;
            border: solid 0.0625rem $light_grey;
            padding: 1rem;
            margin-top: 1.5rem;
        }
    }
</style>

