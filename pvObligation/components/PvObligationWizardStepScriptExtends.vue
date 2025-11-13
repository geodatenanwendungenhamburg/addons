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
    data () {
        return {
            // Shared form data for this component, accessible by other wizard steps
            componentFormData: {},
            // Form error fields, should match keys in componentFormData for consistency
            componentFormErrors: {}
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
         * Called from PvObligationWizard.vue, see wizardStepIsValid()
         * Validates the component form data and add validation errors.
         * @returns {Boolean} true, if data is valid, false if invalid
         */
        componentFormDataValidate () {
            return true;
        }
    }
};
</script>
