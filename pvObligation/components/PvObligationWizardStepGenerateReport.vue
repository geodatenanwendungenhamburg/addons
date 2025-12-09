<script>
import PvObligationWizardStepScriptExtends from "./PvObligationWizardStepScriptExtends.vue";
import {mapGetters, mapActions} from "vuex";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";

export default {
    name: "PvObligationWizardStepGenerateReport",
    components: {
        FlatButton
    },
    extends: PvObligationWizardStepScriptExtends,
    computed: {
        ...mapGetters("Modules/PvObligation", [
            "isCreatingReport",
            "selectedRoofExtent"
        ]),
        ...mapGetters("Menu", ["expanded"]),
        /**
         * Checks if the menu sides are open or closed and
         * calculates the padding for the zoomToExtent function, depending on the opening state
         * @returns {Number[]} Padding values for an extent, fitting inbetween the menu sides.
         */
        mapZoomToExtentPadding () {
            let rightPadding = 20,
                leftPadding = 20;

            if (this.expanded("secondaryMenu")) {
                const el = document.getElementById("mp-menu-secondaryMenu");

                rightPadding = el ? el.offsetWidth + 20 : 20;
            }

            if (this.expanded("mainMenu")) {
                const el = document.getElementById("mp-menu-mainMenu");

                leftPadding = el ? el.offsetWidth + 20 : 20;
            }

            return [20, rightPadding, 20, leftPadding];
        }
    },
    watch: {
        /** @override */
        wizardStepIsActive: {
            handler (isNowActive) {
                if (isNowActive && this.wizardStepsFormData?.PvObligationWizardStepGrossArea?.isValid) {
                    this.zoomToExtent({
                        extent: this.selectedRoofExtent,
                        options: {
                            padding: this.mapZoomToExtentPadding
                        }
                    });
                }
            },
            immediate: true
        }
    },
    methods: {
        ...mapActions("Modules/PvObligation", [
            "exportPDF",
            "calculateNetAreaAndRestrictedAreas",
            "calculateNetRestrictedAreaAndRestrictedAreas"
        ]),
        ...mapActions("Maps", [
            "addNewLayerIfNotExists",
            "zoomToExtent"
        ]),
        async createPDF () {
            const outlineLayer = await this.addNewLayerIfNotExists({
                layerName: "Module/pvObligation/layer/roofArea_pv_suitable",
                alwaysOnTop: true
            });

            outlineLayer.setStyle(null);

            // eslint-disable-next-line
            const stepNetAreaData = await this.calculateNetAreaAndRestrictedAreas({
                    layer: outlineLayer,
                    restrictedAreaItems: this.wizardStepsFormData?.PvObligationWizardStepNetArea?.formData?.restrictedListItems ?? []
                }),
                stepNetRestrictedAreaData = await this.calculateNetRestrictedAreaAndRestrictedAreas({
                    restrictedAreaItems: this.wizardStepsFormData?.PvObligationWizardStepNetRestrictedAreas?.formData?.restrictedListItems ?? [],
                    stepNetNetAreaWithoutRestrictedArea: stepNetAreaData?.netAreaWithoutRestrictedArea,
                    stepNetAreaDataObligatedArea: stepNetAreaData?.obligatedArea
                });

            this.exportPDF({
                author: this.wizardStepsFormData.PvObligationWizardStepBuildingDetails.formData.propertyOwnerFullName,
                brutto: this.wizardStepsFormData.PvObligationWizardStepGrossArea.formData.grossRoofArea,
                netto: stepNetAreaData.netAreaWithoutRestrictedArea,
                pvObligation: stepNetRestrictedAreaData.obligatedArea,
                nettoReduceAreas: this.wizardStepsFormData.PvObligationWizardStepNetArea.formData.restrictedListItems,
                restrictedAreas: this.wizardStepsFormData.PvObligationWizardStepNetRestrictedAreas.formData.restrictedListItems,
                personalData: this.wizardStepsFormData.PvObligationWizardStepBuildingDetails.formData,
                additionalInformation: this.wizardStepsFormData.PvObligationWizardStepPersonalNotes.formData.personalNote
            });
        }
    }
};
</script>

<template lang="html">
    <div id="pvObligationWizardStepGenerateReport">
        <p
            v-if="!allWizardStepsValid"
            class="error"
        >
            {{ $t("additional:modules.pvObligation.wizard.step.generateReport.component.generalError") }}
        </p>

        <p>
            {{ $t("additional:modules.pvObligation.wizard.step.generateReport.component.introduction") }}
        </p>

        <FlatButton
            :text="$t('additional:modules.pvObligation.wizard.step.generateReport.component.createReport')"
            :interaction="() => createPDF()"
            icon="bi bi-box"
            :disabled="!allWizardStepsValid || isCreatingReport"
        />

        <p>
            {{ $t("additional:modules.pvObligation.wizard.step.generateReport.component.introductionHint") }}
        </p>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #pvObligationWizardStepGenerateReport{
        margin-top: 0.5rem;

        p.error {
            color: $light_red;
        }
    }
</style>

