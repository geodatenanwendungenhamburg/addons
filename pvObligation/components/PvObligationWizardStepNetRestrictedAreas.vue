<script>
import PvObligationRestrictionList from "./PvObligationRestrictionList.vue";
import PvObligationWizardStepScriptExtends from "./PvObligationWizardStepScriptExtends.vue";
import {mapGetters} from "vuex";

export default {
    name: "PvObligationWizardStepNetRestrictedAreas",
    components: {
        PvObligationRestrictionList
    },
    extends: PvObligationWizardStepScriptExtends,
    data () {
        return {
            /** @override */
            componentFormData: {
                restrictedListItems: []
            }
        };
    },
    computed: {
        ...mapGetters("Modules/PvObligation", [
            "isDrawing"
        ])
    },
    methods: {
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

            this.componentFormData.restrictedListItems.splice(0);
        },
        onListItems (listItems) {
            this.componentFormData.restrictedListItems = listItems;
        }
    }
};
</script>

<template lang="html">
    <div id="pvObligationWizardStepNetRestrictedAreas">
        <div v-if="!wizardStepsFormData?.PvObligationWizardStepGrossArea?.isValid">
            <p class="error">
                {{ $t("additional:modules.pvObligation.wizard.step.netRestrictedAreas.component.missingStepGrossAreaError") }}
            </p>

            <p>
                {{ $t("additional:modules.pvObligation.wizard.step.netRestrictedAreas.component.missingStepGrossAreaMessage") }}
            </p>
        </div>

        <div v-else>
            <div v-if="isDrawing">
                <p class="error">
                    {{ $t("additional:modules.pvObligation.wizard.step.netArea.component.drawingIsNotCompletedError") }}
                </p>
            </div>

            <p>
                {{ $t("additional:modules.pvObligation.wizard.step.netRestrictedAreas.component.introduction") }}
            </p>

            <p>
                {{ $t("additional:modules.pvObligation.wizard.step.netRestrictedAreas.component.additionalInfo") }}
            </p>

            <PvObligationRestrictionList
                class="restrictionList"
                index-prefix="S"
                :is-disabled="false"
                @list-items="onListItems"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #pvObligationWizardStepNetRestrictedAreas{
        margin: 1rem 0;

        p.error {
            color: $light_red;
        }
    }
</style>

