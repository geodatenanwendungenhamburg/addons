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
            wizardStepVisited: null,
            componentFormDataIsDirtyIgnore: [],
            initialComponentFormData: null
        };
    },
    computed: {
        allWizardStepsValid () {
            return Object.keys(this.wizardStepsFormData)
                .every(stepComponentName => this.wizardStepsFormData[stepComponentName].isValid);
        },
        isWizardFormDirty () {
            for (const stepName of Object.keys(this.wizardStepsFormData)) {
                if (this.wizardStepsFormData[stepName].isDirty) {
                    return true;
                }
            }

            return false;
        }
    },
    watch: {
        wizardStepIsActive: {
            /* eslint-disable-next-line */
            handler (isNowActive, wasActiveBefore) {},
            immediate: true
        }
    },
    mounted () {
        this.setInitialEmptyComponentFormData();
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
        },
        /**
         * Stores a deep-cloned snapshot of the current `componentFormData` as the
         * initial form state. This snapshot is used later to compare whether the
         * form data has changed (dirty check).
         *
         * @returns {void}
         */
        setInitialEmptyComponentFormData () {
            this.initialComponentFormData = JSON.parse(JSON.stringify(this.componentFormData));
        },
        /**
         * Compares the current `componentFormData` with the previously stored
         * `initialComponentFormData` and determines whether any field
         * has changed.Fields listed in `componentFormDataIsDirtyIgnore` are skipped.
         *
         * @returns {boolean} `true` when at least one field value
         * has changed compared to the initial snapshot, otherwise `false`.
         */
        checkComponentFormDataIsDirty () {
            if (!this.initialComponentFormData) {
                return false;
            }

            for (const fieldKey in this.componentFormData) {
                if (this.componentFormDataIsDirtyIgnore.includes(fieldKey)) {
                    continue;
                }

                if (JSON.stringify(this.initialComponentFormData[fieldKey]) !== JSON.stringify(this.componentFormData[fieldKey])) {
                    return true;
                }
            }

            return false;
        }
    }
};
</script>
