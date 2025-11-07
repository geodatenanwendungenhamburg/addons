<script>
import {mapGetters} from "vuex";

export default {
    name: "PvObligationWizardStepNetRestrictedAreas",
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
            componentFormData: {}
        };
    },
    computed: {
        ...mapGetters("Modules/PvObligation", [])
    },
    watch: {
        wizardStepIsActive: {
            /* eslint-disable-next-line */
            handler (isNowActive, wasActiveBefore) {
                // console.log(`Step "${this.$options.name}" isNowActive: ${isNowActive} (wasActiveBefore: ${wasActiveBefore})`);
            },
            immediate: true
        }
    }
};
</script>

<template lang="html">
    <div id="pvObligationWizardStepNetRestrictedAreas">
        <div class="introduction">
            {{ $t("additional:modules.pvObligation.wizard.step.netRestrictedAreas.component.introduction") }}
        </div>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #pvObligationWizardStepNetRestrictedAreas{
    }
</style>

