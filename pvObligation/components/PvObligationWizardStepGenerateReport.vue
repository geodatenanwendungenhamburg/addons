<script>
import {mapGetters, mapActions} from "vuex";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";


export default {
    name: "PvObligationWizardStepGenerateReport",
    components: {
        FlatButton
    },
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
            componentFormData: {},
            componentFormErrors: {}
        };
    },
    computed: {
        ...mapGetters("Modules/PvObligation", [
            "isCreatingReport"
        ]),
        allWizardStepsValid () {
            return Object.keys(this.wizardStepsFormData)
                .every(stepComponentName => this.wizardStepsFormData[stepComponentName].isValid);
        }
    },
    watch: {
        wizardStepIsActive: {
            /* eslint-disable-next-line */
            handler (isNowActive, wasActiveBefore) {},
            immediate: true
        }
    },
    methods: {
        ...mapActions("Modules/PvObligation", [
            "exportPDF"
        ]),
        /**
         * Called from PvObligationWizard.vue, see wizardStepIsValid()
         * Validates the component form data and add validation errors.
         * @returns {Boolean} true, if data is valid, false if invalid
         */
        componentFormDataValidate () {
            return !Object.values(this.componentFormErrors).some(Boolean);
        },
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
        <div class="introduction">
            <p>
                {{ $t("additional:modules.pvObligation.wizard.step.generateReport.component.introduction") }}
            </p>
        </div>

        <div
            v-if="!allWizardStepsValid"
            class="error"
        >
            {{ $t("additional:modules.pvObligation.wizard.step.generateReport.component.generalError") }}
        </div>

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
        div.introduction {
            margin-bottom: 1rem;
        }

        div.error {
            color: $light_red;
            font-size: 0.9rem;
            display: block;
            margin: -0.5rem 0 1rem 0.25rem;
        }
    }
</style>

