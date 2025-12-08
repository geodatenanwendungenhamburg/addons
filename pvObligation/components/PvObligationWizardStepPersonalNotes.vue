<script>
import PvObligationWizardStepScriptExtends from "./PvObligationWizardStepScriptExtends.vue";

export default {
    name: "PvObligationWizardStepPersonalNotes",
    extends: PvObligationWizardStepScriptExtends,
    data () {
        return {
            /** @override */
            componentFormData: {
                personalNote: ""
            }
        };
    },
    methods: {
        /** @override */
        resetWizardStepData () {
            this.componentFormData.personalNote = "";
        }
    }
};
</script>

<template lang="html">
    <div id="pvObligationWizardStepPersonalNotes">
        <p>
            {{ $t("additional:modules.pvObligation.wizard.step.personalNotes.component.introduction") }}
        </p>

        <form>
            <div class="form-floating">
                <div class="form-floating mb-3">
                    <textarea
                        id="componentFormDataPersonalNote"
                        v-model="componentFormData.personalNote"
                        class="form-control h-25"
                        rows="10"
                        :placeholder="$t('additional:modules.pvObligation.wizard.step.personalNotes.component.form.personalNote')"
                    />

                    <label for="componentFormDataPersonalNote">
                        {{ $t("additional:modules.pvObligation.wizard.step.personalNotes.component.form.personalNote") }}
                    </label>
                </div>
            </div>
        </form>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #pvObligationWizardStepPersonalNotes{
        margin-top: 0.5rem;
    }
</style>

