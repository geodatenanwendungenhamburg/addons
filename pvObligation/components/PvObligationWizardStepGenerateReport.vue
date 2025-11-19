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
                author: "Beispielnutzer",
                brutto: 120000,
                netto: 50000,
                pvObligation: 20000,
                restrictedAreaSum: 10000,
                finalPVArea: 10000,
                netto_reduce_areas: [
                    {
                        id: 1,
                        description: "Hier ist ein Dachflächenfenster"
                    },
                    {
                        id: 2,
                        description: "Hier ist ein Dachflächenfenster"
                    }
                ],
                restricted_areas: [
                    {
                        id: 3,
                        description: "Verschattung"
                    },
                    {
                        id: 4,
                        description: "Noch mehr Verschattung"
                    }
                ],
                personalData: {
                    owner: "Dagober Duck",
                    address: "Grünwaldweg 2, 20045 Hamburg",
                    mail: "dagobert@duck.de",
                    phone: ""
                },
                additionalInformation: "Hier kann noch ein langer Text stehen!"
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

