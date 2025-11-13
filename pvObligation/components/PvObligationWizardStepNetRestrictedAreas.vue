<script>
import PvObligationWizardStepScriptExtends from "./PvObligationWizardStepScriptExtends.vue";

export default {
    name: "PvObligationWizardStepNetRestrictedAreas",
    extends: PvObligationWizardStepScriptExtends
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
        div.introduction {
            margin-bottom: 1rem;
        }
    }
</style>

