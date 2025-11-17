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
        <div class="introduction">
            {{ $t("additional:modules.pvObligation.wizard.step.netRestrictedAreas.component.introduction") }}
        </div>

        <PvObligationRestrictionList
            class="restrictionList"
            :is-disabled="false"
            :index-prefix="'S'"
            @list-items="onListItems"
        />
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #pvObligationWizardStepNetRestrictedAreas{
        div.introduction {
            margin-bottom: 1rem;
        }
    }
</style>

