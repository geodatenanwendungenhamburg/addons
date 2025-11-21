<script>
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import PvObligationRestrictionListForm from "./PvObligationRestrictionListForm.vue";

export default {
    name: "PvObligationRestrictionList",
    components: {
        PvObligationRestrictionListForm,
        FlatButton,
        IconButton
    },
    props: {
        // Prefix for the list item number, e.g. N1, N2, or S1, S2
        indexPrefix: {
            type: String,
            required: true
        },
        // Set button disabled or not
        isDisabled: {
            type: Boolean,
            required: true
        }
    },
    emits: [
        "listItems"
    ],
    data () {
        return {
            itemSelectedCreate: null,
            itemSelectedEdit: null,
            listItems: [],
            blueprintIdIndex: 0
        };
    },
    methods: {
        formDataItemBlueprint () {
            this.blueprintIdIndex++;

            return {
                id: `${this.indexPrefix}${this.blueprintIdIndex}`,
                description: "",
                features: []
            };
        },
        onButtonAdd () {
            this.itemSelectedCreate = this.formDataItemBlueprint();
            this.itemSelectedEdit = null;
        },
        onButtonEdit (item) {
            this.itemSelectedEdit = JSON.parse(JSON.stringify(item));
            this.itemSelectedCreate = null;
        },
        onButtonDelete (itemSelectedEdit) {
            this.listItems.splice(this.listItems.findIndex(item => item === itemSelectedEdit), 1);

            this.$emit("listItems", this.listItems);

            const drawLayer = mapCollection.getMap("2D").getLayers().getArray().find(layer => {
                    return layer.get("id") === "module/pvObligation/drawLayer";
                }),
                removeFeatures = drawLayer.getSource().getFeatures().filter(feature => {
                    return feature.get("id") === itemSelectedEdit.id;
                });

            removeFeatures.forEach(feature => {
                drawLayer.getSource().removeFeature(feature);
            });
        },
        onListFormInteractionCreate (interaction) {
            if (interaction.action === "save") {
                this.listItems.push(interaction.data);

                this.$emit("listItems", this.listItems);
            }

            this.itemSelectedCreate = null;
        },
        onListFormInteractionEdit (interaction) {
            if (interaction.action === "save") {
                this.listItems[this.listItems.findIndex(item => item.id === interaction.data.id)] = interaction.data;

                this.$emit("listItems", this.listItems);
            }

            this.itemSelectedEdit = null;
        }
    }
};
</script>

<template lang="html">
    <div id="pvObligationRestrictionList">
        <FlatButton
            v-if="!itemSelectedCreate"
            class="buttonAdd"
            :text="$t('additional:modules.pvObligation.components.restrictionList.buttonAdd')"
            :interaction="() => onButtonAdd()"
            icon="bi bi-plus-circle"
            :disabled="isDisabled"
        />

        <template v-else>
            <h4 class="listFormCreateIntroduction">
                {{ $t("additional:modules.pvObligation.components.restrictionList.formHeaderCreate") }}
            </h4>

            <p>
                {{ $t("additional:modules.pvObligation.components.restrictionList.formHeaderCreateDescription") }}
            </p>

            <PvObligationRestrictionListForm
                form-mode="create"
                :form-data-item="itemSelectedCreate"
                @interaction="onListFormInteractionCreate"
            />
        </template>

        <h4 v-if="listItems.length">
            {{ $t("additional:modules.pvObligation.components.restrictionList.listHeader") }}
        </h4>

        <div
            v-if="listItems.length"
            class="list"
        >
            <div
                v-for="listItem in listItems"
                :key="`list_item_${listItem.id}`"
                class="listItem"
            >
                <PvObligationRestrictionListForm
                    v-if="itemSelectedEdit && itemSelectedEdit.id === listItem.id"
                    form-mode="edit"
                    :form-data-item="itemSelectedEdit"
                    @interaction="onListFormInteractionEdit"
                />

                <template v-else>
                    <div class="formContainer">
                        <div
                            class="number"
                            :title="$t('additional:modules.pvObligation.components.restrictionList.numberExplaination', {id: listItem.id})"
                        >
                            {{ listItem.id }}
                        </div>

                        <div class="lineClampText">
                            {{ listItem.description }}
                        </div>
                    </div>

                    <div class="actions">
                        <FlatButton
                            :secondary="true"
                            :text="$t('additional:modules.pvObligation.components.restrictionList.buttonEdit')"
                            :interaction="() => onButtonEdit(listItem)"
                        />

                        <IconButton
                            class="buttonDelete"
                            :aria="$t('additional:modules.pvObligation.components.restrictionList.buttonDelete')"
                            :interaction="() => onButtonDelete(listItem)"
                            icon="bi bi-x-circle"
                        />
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #pvObligationRestrictionList{
        button.buttonAdd {
            margin-top: 1rem;
        }

        h4.listFormCreateIntroduction {
            margin-bottom: 1.25rem;
        }

        div.list {
            border: solid 1px $light_grey;
            border-radius: 0.5rem;
            margin: 1rem 0;

            div.listItem {
                border-bottom: solid 1px $light_grey;
                padding: 1rem 1rem 0 1rem;

                &:last-child {
                    border-bottom: none;
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

                    div.lineClampText {
                        display: -webkit-box;
                        -webkit-box-orient: vertical;
                        -webkit-line-clamp: 2;
                        line-clamp: 2;
                        overflow: hidden;
                        margin-bottom: 1rem;
                    }
                }

                div.actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: end;

                    div.buttonDelete:hover {
                        color: $light_red;
                    }

                    button:hover {
                        background-color: $light_grey;
                    }
                }
            }
        }
    }
</style>

