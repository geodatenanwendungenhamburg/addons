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
            "isCreatingReport"
        ])
    },
    methods: {
        ...mapActions("Modules/PvObligation", [
            "exportPDF"
        ]),
        createPDF () {
            this.exportPDF({
                author: this.wizardStepsFormData.PvObligationWizardStepBuildingDetails.formData.propertyOwnerFullName,
                brutto: this.wizardStepsFormData.PvObligationWizardStepGrossArea.formData.grossRoofArea,
                netto: this.wizardStepsFormData.PvObligationWizardStepNetArea.formData.netRoofArea,
                pvObligation: this.wizardStepsFormData.PvObligationWizardStepNetArea.formData.netRoofArea * 0.3,
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
        <p>
            {{ $t("additional:modules.pvObligation.wizard.step.generateReport.component.introduction") }}
        </p>

        <p
            v-if="!allWizardStepsValid"
            class="error"
        >
            {{ $t("additional:modules.pvObligation.wizard.step.generateReport.component.generalError") }}
        </p>

        <FlatButton
            :text="$t('additional:modules.pvObligation.wizard.step.generateReport.component.createReport')"
            :interaction="() => createPDF()"
            icon="bi bi-box"
            :disabled="!allWizardStepsValid || isCreatingReport"
        />
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #pvObligationWizardStepGenerateReport{
        margin: 1rem 0;

        p.error {
            color: $light_red;
        }
    }
</style>

