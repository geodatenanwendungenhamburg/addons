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
                restrictedListItems: []
            },
            obligatedArea: null,
            displayNetRoofArea: 0
        };
    },
    computed: {
        ...mapGetters("Modules/PvObligation", [
            "selectedRoofId"
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
        async defineNetArea (payload) {
            const roofId = this.selectedRoofId,
                outlineLayer = await this.addNewLayerIfNotExists({layerName: payload.layerName, alwaysOnTop: true});

            outlineLayer.setStyle(new Style({
                stroke: new Stroke({color: "rgba(192, 12, 247, 1)", width: 3}),
                fill: new Fill({color: "rgba(0, 0, 0, 0)"})
            }));

            this.componentFormData.netRoofArea = Math.round(await this.dissolveRoofFeaturesAndCalculateArea({roofId, outlineLayer, layerName: "PV-geeignete Dachflächen"}) * 10) / 10;
            this.obligatedArea = thousandsSeparator(Math.round(this.componentFormData.netRoofArea * 0.3 * 10) / 10);
            this.displayNetRoofArea = thousandsSeparator(this.componentFormData.netRoofArea);
        },
        onListItems (listItems) {
            this.componentFormData.restrictedListItems = listItems;
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
            <p>
                {{ $t("additional:modules.pvObligation.wizard.step.netArea.component.netRoofAreaText", {netRoofArea: componentFormData.netRoofArea, obligatedArea: obligatedArea}) }}
            </p>

            <strong class="netRoofAreaValue">
                {{ displayNetRoofArea }} m²
            </strong>

            <p>
                {{ $t("additional:modules.pvObligation.wizard.step.netArea.component.obligatedAreaText", {obligatedArea: obligatedArea}) }}
            </p>

            <p>
                {{ $t("additional:modules.pvObligation.wizard.step.netArea.component.additionalNetAreaText") }}
            </p>

            <PvObligationRestrictionList
                class="restrictionList"
                :is-disabled="false"
                index-prefix="N"
                @list-items="onListItems"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #pvObligationWizardStepNetArea{
        margin: 1rem 0;

        strong.netRoofAreaValue {
            display: block;
            margin-bottom: 1rem;
            text-align: center;
            font-size: 1.25rem;
        }

        div.restrictionList {
            margin-top: 1rem;
        }

        p.error {
            color: $light_red;
        }
    }
</style>
