<script>
import {mapActions, mapMutations} from "vuex";
import Select from "ol/interaction/Select";
import {Style, Stroke, Fill} from "ol/style";

export default {
    name: "PvObligationWizardStepGrossArea",
    components: {},
    props: {
        // Read-only form data from all wizard step siblings
        wizardStepsFormData: {
            type: Object,
            required: true
        },
        wizardStepIsActive: {
            type: Boolean,
            required: true
        }
    },
    data () {
        return {
            // This data is made available to all other wizard step siblings
            componentFormData: {
                grossRoofArea: null
            },
            componentFormErrors: {
                grossRoofArea: null
            },
            grossAreaSelection: null
        };
    },
    watch: {
        wizardStepIsActive: {
            handler (isNowActive, wasActiveBefore) {
                if (wasActiveBefore) {
                    this.grossAreaSelection.setActive(false);

                    const layer = mapCollection.getMap("2D").getLayers().getArray().find(l => {
                        return l.get("id") === "Module/pvObligation/layer/roofArea";
                    });

                    layer.setVisible(false);
                }
                else if (isNowActive && this.grossAreaSelection) {
                    this.grossAreaSelection.setActive(true);

                    const grossAreaLayer = mapCollection.getMap("2D").getLayers().getArray().find(l => {
                            return l.get("id") === "Module/pvObligation/layer/roofArea";
                        }),
                        netAreaLayer = mapCollection.getMap("2D").getLayers().getArray().find(l => {
                            return l.get("id") === "Module/pvObligation/layer/roofArea_pv_suitable";
                        });

                    netAreaLayer.setVisible(false);
                    grossAreaLayer.setVisible(true);
                }
            },
            immediate: true
        }
    },
    mounted () {
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
            const selectInteraction = new Select({
                    style: new Style({
                        stroke: new Stroke({color: "rgba(0, 0, 0, 0)", width: 1}),
                        fill: new Fill({color: "rgba(0, 0, 0, 0)"})
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
        /**
         * Called from PvObligationWizard.vue, see wizardStepIsValid()
         * Validates the component form data and add validation errors.
         * @returns {Boolean} true, if data is valid, false if invalid
         */
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
        <div class="introduction">
            {{ $t("additional:modules.pvObligation.wizard.step.grossArea.component.introduction") }}
        </div>

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
        p.grossRoofAreaText {
            margin: 0.5rem 0;
        }

        strong.grossRoofAreaValue {
            display: flex;
            justify-content: center;
            font-size: 1.25rem;
        }

        p.noOblicagionText {
            border: 0.125rem dotted grey;
            padding: 0.5rem;
        }

        div.introduction {
            margin-bottom: 1rem;
        }
    }
</style>

