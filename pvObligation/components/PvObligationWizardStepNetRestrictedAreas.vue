<script>
import PvObligationRestrictionList from "./PvObligationRestrictionList.vue";
import PvObligationWizardStepScriptExtends from "./PvObligationWizardStepScriptExtends.vue";

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
    methods: {
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
            <p>
                {{ $t("additional:modules.pvObligation.wizard.step.netRestrictedAreas.component.introduction") }}
            </p>

            <PvObligationRestrictionList
                class="restrictionList"
                :is-disabled="false"
                index-prefix="S"
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

