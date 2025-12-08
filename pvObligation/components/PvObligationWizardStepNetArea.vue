<script>
import PvObligationWizardStepScriptExtends from "./PvObligationWizardStepScriptExtends.vue";
import mapCollection from "@core/maps/js/mapCollection";
import {mapActions, mapGetters} from "vuex";
import {Style, Stroke, Fill} from "ol/style";
import PvObligationRestrictionList from "./PvObligationRestrictionList.vue";
import thousandsSeparator from "@shared/js/utils/thousandsSeparator";

export default {
    name: "PvObligationWizardStepNetArea",
    components: {
        PvObligationRestrictionList
    },
    extends: PvObligationWizardStepScriptExtends,
    data () {
        return {
            /** @override */
            componentFormData: {
                netRoofArea: null,
                netRoofAreaUpdated: null,
                userExlucedArea: 0,
                restrictedListItems: []
            },
            obligatedArea: null,
            displayNetRoofArea: 0
        };
    },
    computed: {
        ...mapGetters("Modules/PvObligation", [
            "selectedRoofId",
            "isDrawing"
        ])
    },
    watch: {
        /** @override */
        wizardStepIsActive: {
            // eslint-disable-next-line no-unused-vars
            handler (isNowActive, wasActiveBefore) {
                if (isNowActive) {
                    if (this.wizardStepsFormData?.PvObligationWizardStepGrossArea?.isValid) {
                        this.defineNetArea({layerName: "Module/pvObligation/layer/roofArea_pv_suitable"});

                        const layer = mapCollection.getMap("2D")?.getLayers()?.getArray().find(l => {
                            return l.get("id") === "Module/pvObligation/layer/roofArea_pv_suitable";
                        });

                        if (layer) {
                            layer.setVisible(true);
                        }
                    }
                }
            },
            immediate: true
        }
    },
    methods: {
        ...mapActions("Modules/PvObligation", [
            "dissolveRoofFeaturesAndCalculateArea"
        ]),
        ...mapActions("Maps", [
            "addNewLayerIfNotExists"
        ]),
        /** @override */
        resetWizardStepData () {
            if (!this.componentFormData.restrictedListItems.length) {
                return;
            }

            const drawLayer = mapCollection.getMap("2D").getLayers().getArray().find(layer => {
                return layer.get("id") === "module/pvObligation/drawLayer";
            });

            drawLayer.getSource().getFeatures().forEach(feature => {
                if (this.componentFormData.restrictedListItems.map(item => item.id).includes(feature.get("id"))) {
                    drawLayer.getSource().removeFeature(feature);
                }
            });

            this.componentFormData.netRoofArea = null;
            this.componentFormData.restrictedListItems.splice(0);
            this.obligatedArea = null;
        },
        async defineNetArea (payload) {
            const roofId = this.selectedRoofId,
                outlineLayer = await this.addNewLayerIfNotExists({layerName: payload.layerName, alwaysOnTop: true});

            outlineLayer.setStyle(new Style({
                stroke: new Stroke({color: "rgba(192, 12, 247, 1)", width: 3}),
                fill: new Fill({color: "rgba(0, 0, 0, 0)"})
            }));

            this.componentFormData.netRoofArea = await this.dissolveRoofFeaturesAndCalculateArea({roofId, outlineLayer, layerName: "PV-geeignete Dachflächen"});
            this.obligatedArea = this.componentFormData.netRoofArea * 0.3;
        },
        onListItems (listItems) {
            this.componentFormData.restrictedListItems = listItems;

            this.componentFormData.userExlucedArea = this.calculateUserExcludedArea(
                this.componentFormData.restrictedListItems
            );

            this.componentFormData.netRoofAreaUpdated = this.componentFormData.netRoofArea - this.componentFormData.userExlucedArea;
            this.obligatedArea = this.componentFormData.netRoofAreaUpdated * 0.3;
        },
        calculateUserExcludedArea (items) {
            let userExlucedArea = 0;

            items.forEach(item => {
                userExlucedArea += item.features.reduce((sum, feature) => {
                    return sum + feature.values_.area3D;
                }, 0);
            });

            return userExlucedArea;
        },
        formatNumberForArea (value) {
            return thousandsSeparator(Math.round(value * 10) / 10);
        }
    }
};
</script>

<template lang="html">
    <div id="pvObligationWizardStepNetArea">
        <div v-if="!wizardStepsFormData?.PvObligationWizardStepGrossArea?.isValid">
            <p class="error">
                {{ $t("additional:modules.pvObligation.wizard.step.netArea.component.missingStepGrossAreaError") }}
            </p>

            <p>
                {{ $t("additional:modules.pvObligation.wizard.step.netArea.component.missingStepGrossAreaMessage") }}
            </p>
        </div>

        <div v-else>
            <div v-if="isDrawing">
                <p class="error">
                    {{ $t("additional:modules.pvObligation.wizard.step.netArea.component.drawingIsNotCompletedError") }}
                </p>
            </div>

            <p>
                {{ $t("additional:modules.pvObligation.wizard.step.netArea.component.introduction") }}
            </p>

            <div class="netRoofData">
                <div class="highlight">
                    <template v-if="!componentFormData.userExlucedArea">
                        {{ $t("additional:modules.pvObligation.wizard.step.netArea.component.netRoofAreaText") }}

                        <em>
                            {{ formatNumberForArea(componentFormData.netRoofArea) }} m²
                        </em>
                    </template>

                    <template v-else>
                        {{ $t("additional:modules.pvObligation.wizard.step.netArea.component.netRoofAreaTextUpdated") }}

                        <em>
                            {{ formatNumberForArea(componentFormData.netRoofAreaUpdated) }} m²
                        </em>
                    </template>
                </div>

                <p v-if="componentFormData.userExlucedArea">
                    {{ $t("additional:modules.pvObligation.wizard.step.netArea.component.netRoofAreaTextAddedAreas") }}

                    <em>
                        {{ formatNumberForArea(componentFormData.userExlucedArea) }} m²
                    </em>
                </p>

                <div class="highlight">
                    {{ $t("additional:modules.pvObligation.wizard.step.netArea.component.obligatedAreaText", {obligatedArea: formatNumberForArea(obligatedArea)}) }}
                </div>
            </div>

            <p>
                {{ $t("additional:modules.pvObligation.wizard.step.netArea.component.additionalNetAreaText") }}
            </p>

            <p>
                {{ $t("additional:modules.pvObligation.wizard.step.netArea.component.netAreaNoteText") }}
            </p>

            <PvObligationRestrictionList
                class="restrictionList"
                index-prefix="N"
                :is-disabled="false"
                @list-items="onListItems"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #pvObligationWizardStepNetArea{
        margin: 1rem 0;

        div.netRoofData {
            text-align: center;
            margin-bottom: 1rem;

            div {
                margin-bottom: 1rem;
                font-size: 1.25rem;

                &.highlight {
                    font-weight: bold;
                }
            }
        }

        div.restrictionList {
            margin-top: 1rem;
        }

        p.error {
            color: $light_red;
        }
    }
</style>
