<script>
import PvObligationWizardStepScriptExtends from "./PvObligationWizardStepScriptExtends.vue";
import mapCollection from "@core/maps/js/mapCollection";
import {mapActions, mapGetters} from "vuex";
import {Style, Stroke, Fill} from "ol/style";

export default {
    name: "PvObligationWizardStepNetArea",
    extends: PvObligationWizardStepScriptExtends,
    data () {
        return {
            /** @override */
            componentFormData: {
                netRoofArea: null
            }
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
                    this.defineNetArea({layerName: "Module/pvObligation/layer/roofArea_pv_suitable"});

                    const layer = mapCollection.getMap("2D")?.getLayers()?.getArray().find(l => {
                        return l.get("id") === "Module/pvObligation/layer/roofArea_pv_suitable";
                    });

                    if (layer) {
                        layer.setVisible(true);
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
            this.obligatedArea = Math.round(this.componentFormData.netRoofArea * 0.3 * 10) / 10;
        }
    }
};
</script>

<template lang="html">
    <div id="pvObligationWizardStepNetArea">
        <div v-if="componentFormData.netRoofArea !== null">
            <p
                class="netRoofAreaText"
            >
                {{ $t("additional:modules.pvObligation.wizard.step.netArea.component.netRoofAreaText", {netRoofArea: componentFormData.netRoofArea, obligatedArea: obligatedArea}) }}
            </p>

            <strong
                class="netRoofAreaValue"
            >
                {{ componentFormData.netRoofArea }} m²
            </strong>

            <p
                class="netRoofAreaText"
            >
                {{ $t("additional:modules.pvObligation.wizard.step.netArea.component.additionalNetAreaText") }}
            </p>

            <p
                class="netRoofAreaText"
            >
                {{ $t("additional:modules.pvObligation.wizard.step.netArea.component.obligatedAreaText", {obligatedArea: obligatedArea}) }}
            </p>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #pvObligationWizardStepNetArea{
        p.netRoofAreaText {
            margin: 0.5rem 0;
        }

        strong.netRoofAreaValue {
            display: flex;
            justify-content: center;
            font-size: 1.25rem;
        }
    }
</style>

