<script>
import PvObligationWizardStepScriptExtends from "./PvObligationWizardStepScriptExtends.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import {mapActions, mapGetters} from "vuex";

export default {
    name: "PvObligationWizardStepBuildingDetails",
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
                houseNumber: ""
            },
            /** @override */
            componentFormErrors: {
                propertyOwnerFullName: null,
                street: null,
                postalCode: null,
                city: null,
                houseNumber: null
            }
        };
    },
    computed: {
        ...mapGetters("Modules/PvObligation", [
            "selectedRoofId"
        ])
    },
    watch: {
        wizardStepIsActive: {
            handler (isNowActive) {
                if (isNowActive && !this.wizardStepVisitedFirstTime()) {
                    this.componentFormDataValidate();
                }
            },
            immediate: true
        },
        selectedRoofId: {
            handler: async function (newValue) {
                if (!newValue) {
                    return;
                }

                try {
                    Object.assign(this.componentFormData, await this.getAddress() || this.componentFormData);
                }
                catch (error) {
                    console.error("Error in selectedRoofId watcher:", error);
                }
            },
            deep: false
        }
    },
    methods: {
        ...mapActions("Modules/PvObligation", [
            "getAddress"
        ]),
        /** @override */
        resetWizardStepData () {
            Object.keys(this.componentFormData).forEach(key => {
                this.componentFormData[key] = "";
            });

            Object.keys(this.componentFormErrors).forEach(key => {
                this.componentFormErrors[key] = null;
            });
        },
        /** @override */
        componentFormDataValidate () {
            const errorMessageMissingValue = this.$t("additional:modules.pvObligation.formErrors.genericMissingValue"),
                errorMessageInvalidValue = this.$t("additional:modules.pvObligation.formErrors.genericInvalidValue"),
                validations = [
                    {
                        field: "propertyOwnerFullName",
                        error: !this.componentFormData.propertyOwnerFullName.length ? errorMessageMissingValue : null
                    },
                    {
                        field: "street",
                        error: !this.componentFormData.street.length ? errorMessageMissingValue : null
                    },
                    {
                        field: "postalCode",
                        error: (() => {
                            if (!this.componentFormData.postalCode.length) {
                                return errorMessageMissingValue;
                            }
                            if (!(/^\d{5}$/).test(this.componentFormData.postalCode)) {
                                return errorMessageInvalidValue;
                            }
                            return null;
                        })()
                    },
                    {
                        field: "houseNumber",
                        error: !this.componentFormData.houseNumber.length ? errorMessageMissingValue : null
                    },
                    {
                        field: "city",
                        error: !this.componentFormData.city.length ? errorMessageMissingValue : null
                    }
                ];

            validations.forEach(({field, error}) => {
                this.componentFormErrors[field] = error;
            });

            return !Object.values(this.componentFormErrors).some(Boolean);
        }
    }
};
</script>

<template lang="html">
    <div id="pvObligationWizardStepBuildingDetails">
        <p>
            {{ $t("additional:modules.pvObligation.wizard.step.buildingDetails.component.introduction") }}
        </p>

        <form>
            <InputText
                id="componentFormDataPropertyOwnerFullName"
                v-model="componentFormData.propertyOwnerFullName"
                :label="$t('additional:modules.pvObligation.wizard.step.buildingDetails.component.form.propertyOwnerFullName') + ' *'"
                :placeholder="$t('additional:modules.pvObligation.wizard.step.buildingDetails.component.form.propertyOwnerFullName')"
                :error-message="componentFormErrors.propertyOwnerFullName"
            />

            <div class="groupHorizontal">
                <InputText
                    id="componentFormDataStreet"
                    v-model="componentFormData.street"
                    class="componentFormDataStreet"
                    :label="$t('additional:modules.pvObligation.wizard.step.buildingDetails.component.form.street') + ' *'"
                    :placeholder="$t('additional:modules.pvObligation.wizard.step.buildingDetails.component.form.street')"
                    :error-message="componentFormErrors.street"
                />

                <InputText
                    id="componentFormDataHouseNumber"
                    v-model="componentFormData.houseNumber"
                    :label="$t('additional:modules.pvObligation.wizard.step.buildingDetails.component.form.houseNumber') + ' *'"
                    :placeholder="$t('additional:modules.pvObligation.wizard.step.buildingDetails.component.form.houseNumber')"
                    :error-message="componentFormErrors.houseNumber"
                />
            </div>

            <div class="groupHorizontal">
                <InputText
                    id="componentFormDataPostalCode"
                    v-model="componentFormData.postalCode"
                    :label="$t('additional:modules.pvObligation.wizard.step.buildingDetails.component.form.postalCode') + ' *'"
                    :placeholder="$t('additional:modules.pvObligation.wizard.step.buildingDetails.component.form.postalCode')"
                    :error-message="componentFormErrors.postalCode"
                />

                <InputText
                    id="componentFormDataCity"
                    v-model="componentFormData.city"
                    class="componentFormDataCity"
                    :label="$t('additional:modules.pvObligation.wizard.step.buildingDetails.component.form.city') + ' *'"
                    :placeholder="$t('additional:modules.pvObligation.wizard.step.buildingDetails.component.form.city')"
                    :error-message="componentFormErrors.city"
                />
            </div>
        </form>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #pvObligationWizardStepBuildingDetails {
        margin-top: 0.5rem;

        form {
            .error {
                color: $light_red;
                font-size: 0.9rem;
                display: block;
                margin: -0.5rem 0 1rem 0.25rem;
            }

            div.groupHorizontal {
                display: flex;
                gap: 1rem;
                div.componentFormDataStreet,
                div.componentFormDataCity{
                    width: 80%;
                }
            }
        }
    }
</style>
