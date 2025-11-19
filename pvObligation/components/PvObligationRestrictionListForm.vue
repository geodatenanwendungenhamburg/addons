<script>
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";

export default {
    name: "PvObligationRestrictionListForm",
    components: {
        FlatButton,
        IconButton
    },
    props: {
        // Set, if the form should handle create or edit.
        formMode: {
            type: String,
            required: true,
            validator: value => {
                return ["create", "edit"].includes(value);
            }
        },
        // Given form data, e.g. {id: "S1", description: "Description text", geometries: []}
        formDataItem: {
            type: Object,
            required: true
        }
    },
    emits: [
        "interaction"
    ],
    data () {
        return {
            formData: {
                id: this.formDataItem.id,
                description: this.formDataItem.description,
                geometries: this.formDataItem.geometries
            },
            formErrors: {
                id: null,
                description: null,
                geometries: null
            }
        };
    },
    methods: {
        onSave () {
            if (!this.validate()) {
                return;
            }

            this.$emit("interaction", {
                action: "save",
                mode: this.formMode,
                data: this.formData
            });
        },
        onCancel () {
            this.formData = {...this.formDataItem};

            this.$emit("interaction", {
                action: "cancel",
                mode: this.formMode,
                data: this.formData
            });
        },
        validate () {
            const errorMessageMissingValue = this.$t("additional:modules.pvObligation.formErrors.genericMissingValue");

            this.formErrors.description = !this.formData?.description
                ? errorMessageMissingValue
                : null;

            return !Object.values(this.formErrors).some(Boolean);
        }
    }
};
</script>

<template lang="html">
    <div id="pvObligationRestrictionListForm">
        <div class="formContainer">
            <div class="formElements">
                <div class="actionsDraw">
                    <div
                        class="number"
                        :title="$t('additional:modules.pvObligation.components.restrictionList.numberExplaination', {id: formData.id})"
                    >
                        {{ formData.id }}
                    </div>

                    <div
                        v-if="formMode === 'create'"
                        class="actionsDrawButtons"
                    >
                        <span>
                            {{ $t("additional:modules.pvObligation.components.restrictionList.selectDrawTool") }}
                        </span>

                        <div class="buttonGroup">
                            <IconButton
                                :aria="$t('additional:modules.pvObligation.components.restrictionList.drawTypes.polygon')"
                                icon="bi bi-pentagon"
                                :class-array="['btn-primary']"
                            />

                            <IconButton
                                :aria="$t('additional:modules.pvObligation.components.restrictionList.drawTypes.rectangle')"
                                icon="bi bi-circle"
                                :class-array="['btn-light']"
                            />

                            <IconButton
                                :aria="$t('additional:modules.pvObligation.components.restrictionList.drawTypes.circle')"
                                icon="bi bi-square"
                                :class-array="['btn-light']"
                            />
                        </div>
                    </div>
                </div>

                <div class="form-floating">
                    <textarea
                        :id="`list_item_${formData.id}`"
                        v-model="formData.description"
                        class="form-control"
                        rows="10"
                        :placeholder="$t('additional:modules.pvObligation.components.restrictionList.textareaPlaceholderNotes')"
                    />

                    <label :for="`list_item_${formData.id}`">
                        {{ $t("additional:modules.pvObligation.components.restrictionList.textareaPlaceholderNotes") }}
                    </label>
                </div>

                <span
                    v-if="formErrors.description"
                    class="invalid-feedback"
                >
                    {{ formErrors.description }}
                </span>

                <div class="actions">
                    <div class="actionsRight">
                        <FlatButton
                            :text="$t('additional:modules.pvObligation.components.restrictionList.buttonSave')"
                            :interaction="() => onSave()"
                        />

                        <FlatButton
                            :secondary="true"
                            :text="$t('additional:modules.pvObligation.components.restrictionList.buttonCancel')"
                            :interaction="() => onCancel()"
                        />
                    </div>
                </div>
            </div>
        </div>

        <p
            v-if="formMode === 'create'"
            class="helpDraw"
        >
            <strong>
                {{ $t("additional:modules.pvObligation.components.restrictionList.helpFormDrawCreate.hint") }}
            </strong>

            {{ $t("additional:modules.pvObligation.components.restrictionList.helpFormDrawCreate.text") }}
        </p>

        <p
            v-if="formMode === 'edit'"
            class="helpDraw"
        >
            <strong>
                {{ $t("additional:modules.pvObligation.components.restrictionList.helpFormDrawModify.hint") }}
            </strong>

            {{ $t("additional:modules.pvObligation.components.restrictionList.helpFormDrawModify.text") }}
        </p>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #pvObligationRestrictionListForm{
        border: solid 1px $light_grey;
        border-radius: 0.5rem;
        background-color: #EFEFEF;
        padding: 1rem 1rem 0 1rem;
        margin-bottom: 1rem;

        div.actionsDraw {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;

            div.actionsDrawButtons {
                display: flex;
                align-items: center;
                gap: 1rem;

                div.buttonGroup {
                    display: flex;
                    gap: 0.25rem;
                }
            }
        }

        div.formContainer {
            display: flex;
            gap: 1rem;

            div.number {
                font-weight: bold;
                border: solid 1px $light_grey;
                background-color: $white;
                padding: 0.5rem;
                align-self: flex-start;
                border-radius: 0.5rem;
            }

            div.formElements {
                display: flex;
                flex-direction: column;
                flex: 1;

                div.form-floating {
                    width: 100%;

                    textarea {
                        height: 10rem;
                    }
                }
            }
        }

        div.actions {
            display: flex;
            justify-content: flex-end;
            margin-top: 1rem;

            button:hover {
                background-color: $light_grey;
            }

            div.actionsLeft {
                display: flex;
                gap: 0.5rem;
            }

            div.actionsRight {
                display: flex;
                gap: 1rem;
            }
        }

        p.helpDraw {
            padding-top: 1rem;
            border-top: solid 1px $light_grey;
        }
    }
</style>

