<script>
/**
 * Base functionality for a PvObligationWizardStep.
 *
 * To use, import and extend this in your WizardStep component:
 *
 * import PvObligationWizardStepScriptExtends from "./PvObligationWizardStepScriptExtends.vue";
 *
 * export default {
 *     name: "PvObligationWizardStepDemo",
 *     extends: PvObligationWizardStepScriptExtends
 * }
 */

export default {
    props: {
        // Read-only form data and form validation status from all wizard step siblings
        wizardStepsFormData: {
            type: Object,
            required: true
        },
        // Current step active or not, used in a watcher
        wizardStepIsActive: {
            type: Boolean,
            required: true
        }
    },
    emits: [
        "resetWizardData"
    ],
    data () {
        return {
            // Shared form data for this component, accessible by other wizard steps
            componentFormData: {},
            // Form error fields, should match keys in componentFormData for consistency
            componentFormErrors: {},
            wizardStepVisited: null
        };
    },
    computed: {
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
        /**
         * Returns true if this step is being visited for the first time.
         * Useful in wizardStepIsActive watcher to trigger actions only after initial visit.
         */
        wizardStepVisitedFirstTime () {
            if (!this.wizardStepVisited) {
                this.wizardStepVisited = true;

                return true;
            }

            return false;
        },
        /**
         * Called from PvObligationWizard.vue, see wizardStepIsValid()
         * Validates the component form data and add validation errors.
         * Must be implemented in the extending component, if needed.
         * @returns {Boolean} true, if data is valid, false if invalid
         */
        componentFormDataValidate () {
            return true;
        },
        /**
         * Resets the data for a wizard step.
         * Called from PvObligationWizard.vue when a reset is requested.
         * Can be implemented in the extending component, if needed.
         */
        resetWizardStepData () {
            // Implement in extending component if needed
        },
        /**
         * Emitts an event to reset all wizard steps form data.
         */
        resetWizardData () {
            this.$emit("resetWizardData");
        }
    }
};
</script>
