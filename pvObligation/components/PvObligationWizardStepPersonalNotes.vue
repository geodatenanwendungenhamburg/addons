<script>
import {mapGetters} from "vuex";

export default {
    name: "PvObligationWizardStepPersonalNotes",
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
            componentFormData: {
                personalNote: ""
            },
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
    <div id="pvObligationWizardStepPersonalNotes">
        <div class="introduction">
            {{ $t("additional:modules.pvObligation.wizard.step.personalNotes.component.introduction") }}
        </div>

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

        <div class="dataPrivacyInfo">
            {{ $t("additional:modules.pvObligation.wizard.step.personalInformation.component.dataPrivacyInfo") }}
        </div>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #pvObligationWizardStepPersonalNotes{
        div.introduction {
            margin-bottom: 1rem;
        }
    }
</style>

