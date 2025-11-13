<script>
import PvObligationWizardStepScriptExtends from "./PvObligationWizardStepScriptExtends.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";

export default {
    name: "PvObligationWizardStepPersonalInformation",
    components: {
        InputText
    },
    extends: PvObligationWizardStepScriptExtends,
    data () {
        return {
            /** @override */
            componentFormData: {
                propertyOwnerFullName: "",
                street: "",
                postalCode: "",
                city: "",
                email: "",
                phoneNumber: "",
                reportCreatedBy: ""
            },
            /** @override */
            componentFormErrors: {
                propertyOwnerFullName: null,
                street: null,
                postalCode: null,
                city: null,
                email: null,
                phoneNumber: null,
                reportCreatedBy: null
            }
        };
    },
    methods: {
        /** @override */
        componentFormDataValidate () {
            const errorMessageMissingValue = this.$t("additional:modules.pvObligation.formErrors.genericMissingValue"),
                errorMessageInvalidValue = this.$t("additional:modules.pvObligation.formErrors.genericInvalidValue");

            this.componentFormErrors.propertyOwnerFullName = !this.componentFormData.propertyOwnerFullName.length
                ? errorMessageMissingValue
                : null;

            this.componentFormErrors.street = !this.componentFormData.street.length
                ? errorMessageMissingValue
                : null;

            if (!this.componentFormData.postalCode.length) {
                this.componentFormErrors.postalCode = errorMessageMissingValue;
            }
            else if (!(/^\d{5}$/).test(this.componentFormData.postalCode)) {
                this.componentFormErrors.postalCode = errorMessageInvalidValue;
            }
            else {
                this.componentFormErrors.postalCode = null;
            }

            this.componentFormErrors.city = !this.componentFormData.city.length
                ? errorMessageMissingValue
                : null;

            return !Object.values(this.componentFormErrors).some(Boolean);
        }
    }
};
</script>

<template lang="html">
    <div id="pvObligationWizardStepPersonalInformation">
        <div class="introduction">
            {{ $t("additional:modules.pvObligation.wizard.step.personalInformation.component.introduction") }}
        </div>

        <form>
            <InputText
                :id="'componentFormDataPropertyOwnerFullName'"
                v-model="componentFormData.propertyOwnerFullName"
                :label="$t('additional:modules.pvObligation.wizard.step.personalInformation.component.form.propertyOwnerFullName') + ' *'"
                :placeholder="$t('additional:modules.pvObligation.wizard.step.personalInformation.component.form.propertyOwnerFullName')"
                :error-message="componentFormErrors.propertyOwnerFullName"
            />

            <InputText
                :id="'componentFormDataStreet'"
                v-model="componentFormData.street"
                :label="$t('additional:modules.pvObligation.wizard.step.personalInformation.component.form.street') + ' *'"
                :placeholder="$t('additional:modules.pvObligation.wizard.step.personalInformation.component.form.street')"
                :error-message="componentFormErrors.street"
            />

            <div class="groupHorizontal">
                <div class="formField formFieldPostalCode">
                    <InputText
                        :id="'componentFormDataPostalCode'"
                        v-model="componentFormData.postalCode"
                        :label="$t('additional:modules.pvObligation.wizard.step.personalInformation.component.form.postalCode') + ' *'"
                        :placeholder="$t('additional:modules.pvObligation.wizard.step.personalInformation.component.form.postalCode')"
                        :error-message="componentFormErrors.postalCode"
                    />
                </div>

                <div class="formField">
                    <InputText
                        :id="'componentFormDataCity'"
                        v-model="componentFormData.city"
                        :label="$t('additional:modules.pvObligation.wizard.step.personalInformation.component.form.city') + ' *'"
                        :placeholder="$t('additional:modules.pvObligation.wizard.step.personalInformation.component.form.city')"
                        :error-message="componentFormErrors.city"
                    />
                </div>
            </div>

            <InputText
                :id="'componentFormEmail'"
                v-model="componentFormData.email"
                :label="$t('additional:modules.pvObligation.wizard.step.personalInformation.component.form.email')"
                :placeholder="$t('additional:modules.pvObligation.wizard.step.personalInformation.component.form.email')"
                :error-message="componentFormErrors.email"
            />

            <InputText
                :id="'componentFormPhoneNumber'"
                v-model="componentFormData.phoneNumber"
                :label="$t('additional:modules.pvObligation.wizard.step.personalInformation.component.form.phoneNumber')"
                :placeholder="$t('additional:modules.pvObligation.wizard.step.personalInformation.component.form.phoneNumber')"
                :error-message="componentFormErrors.phoneNumber"
            />

            <InputText
                :id="'componentFormReportCreatedBy'"
                v-model="componentFormData.reportCreatedBy"
                :label="$t('additional:modules.pvObligation.wizard.step.personalInformation.component.form.reportCreatedBy')"
                :placeholder="$t('additional:modules.pvObligation.wizard.step.personalInformation.component.form.reportCreatedBy')"
                :error-message="componentFormErrors.reportCreatedBy"
            />
        </form>

        <div class="dataPrivacyInfo">
            {{ $t("additional:modules.pvObligation.wizard.step.personalInformation.component.dataPrivacyInfo") }}
        </div>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #pvObligationWizardStepPersonalInformation {
        div.introduction {
            margin-bottom: 1rem;
        }

        form {
            .error {
                color: $light_red;
                font-size: 0.9rem;
                display: block;
                margin: -0.5rem 0 1rem 0.25rem;
            }

            .groupHorizontal {
                display: flex;
                flex-direction: row;
                gap: 1rem;

                .formField {
                    display: flex;
                    flex-direction: column;
                    width: 100%;

                    &.formFieldPostalCode {
                        width: 200px;
                    }
                }
            }
        }
    }
</style>
