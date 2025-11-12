<script>
import {mapGetters} from "vuex";

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
            componentFormData: {},
            componentFormErrors: {}
        };
    },
    computed: {
        ...mapGetters("Modules/PvObligation", [])
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
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #pvObligationWizardStepGrossArea{
        div.introduction {
            margin-bottom: 1rem;
        }
    }
</style>

