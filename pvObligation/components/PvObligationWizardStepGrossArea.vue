<script>
import PvObligationWizardStepScriptExtends from "./PvObligationWizardStepScriptExtends.vue";
import {mapActions, mapGetters, mapMutations} from "vuex";
import Select from "ol/interaction/Select";
import {Style, Stroke, Fill} from "ol/style";
import axios from "axios";

export default {
    name: "PvObligationWizardStepGrossArea",
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
            grossAreaStyle: {}
        };
    },
    computed: {
        ...mapGetters(["configJs"])
    },
    watch: {
        /** @override */
        wizardStepIsActive: {
            handler (isNowActive, wasActiveBefore) {
                if (wasActiveBefore) {
                    this.grossAreaSelection.setActive(false);

                    const roofLayer = mapCollection.getMap("2D").getLayers().getArray().find(l => {
                        return l.get("id") === "Module/pvObligation/layer/roofArea";
                    });

                    roofLayer.setVisible(false);
                }
                else if (isNowActive && this.grossAreaSelection) {
                    this.grossAreaSelection.setActive(true);

                    const grossAreaLayer = mapCollection.getMap("2D").getLayers().getArray().find(l => {
                            return l.get("id") === "Module/pvObligation/layer/roofArea";
                        }),
                        netAreaLayer = mapCollection.getMap("2D").getLayers().getArray().find(l => {
                            return l.get("id") === "Module/pvObligation/layer/roofArea_pv_suitable";
                        });

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

        this.defineGrossArea({layerName: "Module/pvObligation/layer/roofArea"});
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

                this.setSelectedRoofId(roofId);
                this.componentFormData.grossRoofArea = Math.round(await this.dissolveRoofFeaturesAndCalculateArea({roofId, outlineLayer, layerName: "Dachflächen"}) * 10) / 10;
            });
        },
        /** @override */
        componentFormDataValidate () {
            const errorMessageMissingValue = this.$t("additional:modules.pvObligation.formErrors.genericMissingValue");

            this.componentFormErrors.grossRoofArea = !this.componentFormData.grossRoofArea
                ? errorMessageMissingValue
                : null;

            return !Object.values(this.componentFormErrors).some(Boolean);
        }
    }
};
</script>

<template lang="html">
    <div id="pvObligationWizardStepGrossArea">
        <p>
            {{ $t("additional:modules.pvObligation.wizard.step.grossArea.component.introduction") }}
        </p>

        <p v-if="!componentFormData.grossRoofArea">
            {{ $t("additional:modules.pvObligation.wizard.step.grossArea.component.hintSearch") }}
        </p>

        <p
            v-if="componentFormData.grossRoofArea !== null"
            class="grossRoofAreaText"
        >
            {{ $t("additional:modules.pvObligation.wizard.step.grossArea.component.grossAreaText", {grossRoofArea: componentFormData.grossRoofArea}) }}
        </p>

        <strong
            v-if="componentFormData.grossRoofArea !== null"
            class="grossRoofAreaValue"
        >
            {{ componentFormData.grossRoofArea }} m²
        </strong>

        <p
            v-if="componentFormData.grossRoofArea < 50 && componentFormData.grossRoofArea !== null"
            class="noOblicagionText"
        >
            {{ $t("additional:modules.pvObligation.wizard.step.grossArea.component.tooSmallAreaText") }}
        </p>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #pvObligationWizardStepGrossArea {
        margin: 1rem 0;

        strong.grossRoofAreaValue {
            display: flex;
            justify-content: center;
            font-size: 1.25rem;
        }

        p.noOblicagionText {
            border: 0.125rem dotted grey;
            padding: 1rem;
            margin-top: 1rem;
        }
    }
</style>

