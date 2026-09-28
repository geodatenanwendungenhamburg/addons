<script>
import {mapGetters, mapMutations} from "vuex";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import TableComponent from "@shared/modules/table/components/TableComponent.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import {TAB_SET_CURRENT} from "@shared/modules/tabs/components/TabContainer.vue";
import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";

export default {
    name: "LandRegistryFileResults",
    components: {
        FlatButton,
        TableComponent,
        IconButton,
        SwitchInput
    },
    inject: {
        setCurrentTab: {from: TAB_SET_CURRENT, default: null}
    },
    data () {
        return {
            showMoreFields: false,
            tableRenderKey: 0
        };
    },
    computed: {
        ...mapGetters("Modules/LandRegistryFile", [
            "landRegistryFileFeatures",
            "tableFields",
            "oafSchema"
        ]),
        /**
         * Prepares the data structure for the table component, including headers and items.
         * @returns {Object} - An object containing headers and items for the table.
         */
        tableData () {
            const headers = [
                      ...this.tableFields
                          .filter((field) => this.showMoreFields || field.showAlways)
                          .map((field, index) => ({
                              name: field.name,
                              displayName: this.oafSchema?.properties?.[field.name]?.title || field.name,
                              index
                          })),
                      {
                          name: "actions",
                          displayName: this.$t("additional:modules.landRegistryFile.tabs.tabResults.actionsHeader"),
                          index: this.tableFields.length
                      }
                  ],
                  items = (this.landRegistryFileFeatures || []).map(feature => {
                      return feature.properties;
                  });

            return {
                headers,
                items
            };
        }
    },
    watch: {
        landRegistryFileFeatures () {
            this.tableRenderKey += 1;
        }
    },
    methods: {
        ...mapMutations("Modules/LandRegistryFile", [
            "setSelectedDetail"
        ]),
        showPosition (row) {
            console.warn("showPosition noch nicht implementiert", row);
        },
        showDetails (row) {
            this.setSelectedDetail(row);
            this.setCurrentTab("tabDetails");
        }
    }
};
</script>

<template lang="html">
    <div
        id="LandRegistryFileResults"
        class="InnerLayoutFrame"
    >
        <div
            v-if="tableData.items.length === 0"
            class="ScrollableContent"
        >
            <p class="no-results-message">
                {{ $t("additional:modules.landRegistryFile.tabs.tabResults.noResultsMessage") }}
            </p>
        </div>
        <div
            v-else
            class="ScrollableContent table-wrapper"
        >
            <p class="number-of-results-wrapper">
                {{ $t("additional:modules.landRegistryFile.tabs.tabResults.numberOfResults") }}
                <span class="number-of-results">{{ landRegistryFileFeatures.length }}</span>
            </p>
            <div class="switch-container">
                <SwitchInput
                    id="idShowMoreFieldsSwitch"
                    class="showMoreFieldsSwitch"
                    name="showMoreFieldsSwitch"
                    :aria="$t('additional:modules.landRegistryFile.tabs.tabResults.showMoreFieldsLabel')"
                    :label="$t('additional:modules.landRegistryFile.tabs.tabResults.showMoreFieldsLabel')"
                    :checked="showMoreFields"
                    :interaction="(evt) => showMoreFields = evt.target.checked"
                />
            </div>

            <TableComponent
                :key="tableRenderKey"
                :data="tableData"
                :sortable="true"
            >
                <template #cell-actions="{ row }">
                    <div class="actions-wrapper">
                        <IconButton
                            :aria="$t('additional:modules.landRegistryFile.tabs.tabResults.actionsShowPosition')"
                            icon="bi-crosshair"
                            class="action-item"
                            @click.stop="showPosition(row)"
                        />
                        <IconButton
                            :aria="$t('additional:modules.landRegistryFile.tabs.tabResults.actionsShowDetails')"
                            icon="bi-arrow-right-circle"
                            class="action-item"
                            @click.stop="showDetails(row)"
                        />
                    </div>
                </template>
            </TableComponent>
        </div>

        <div class="FixedContent buttons-footer">
            <FlatButton
                :aria-label="$t('additional:modules.landRegistryFile.tabs.tabResults.backToSearchButtonLabel')"
                :text="$t('additional:modules.landRegistryFile.tabs.tabResults.backToSearchButtonLabel')"
                :secondary="true"
                @click="setCurrentTab('tabSearch')"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
    #LandRegistryFileResults{
        height: 100%;
        padding-top: 0.5rem;

        p.no-results-message {
            padding-top: 1rem;
            text-align: center;
        }

        div.table-wrapper {
            gap: 0.25rem;

            p.number-of-results-wrapper {
                margin-top: 0.5rem;
                margin-bottom: 0.5rem;

                span.number-of-results {
                    display: inline-block;
                    padding: 0.1rem 1rem;
                    border: 2px solid $secondary;
                    border-radius: 999px;
                    background: #fff;
                    font-weight: bold;
                    font-family: $font_family_accent;
                    margin-left: 1rem;
                }
            }

            div.switch-container {
                display: flex;
                flex-direction: column;
                align-items: end;

                .showMoreFieldsSwitch > * {
                    cursor: pointer;
                }
            }

            div.actions-wrapper {
                display: flex;
                align-items: center;
                gap: 0.25rem;

                :deep(.action-item .btn) {
                    width: 1.6rem;
                    height: 1.6rem;
                    z-index: 1;

                    > i {
                        font-size: 1.2rem;
                    }
                }
            }

            :deep(table) {
                width: auto;
                table-layout: fixed;

                th.fixedWidth {
                    min-width: 70px;
                    height: 1rem;
                    text-align: left;
                    background-color: $secondary;
                    color: $white;
                    vertical-align: middle;

                    > div {
                        margin: 0 !important;
                        padding-right: 0.5rem;
                    }

                    .sortable-icon {
                        font-size: 0.75rem;
                    }

                    .th-style {
                        font-size: clamp(0.8rem, 1.2vw, 0.875rem);
                        white-space: normal;
                        line-height: 1rem;
                        margin: 0 !important;
                        padding: 0.75rem 0.2rem;
                        hyphens: auto;
                    }

                    &:first-child .th-style {
                        padding-left: 0.5rem;
                    }

                    &:last-child {
                        .th-style {
                            padding-right: 0.5rem;
                        }

                        .sortable-icon {
                            display: none;
                        }
                    }
                }

                td {
                    vertical-align: middle;
                    padding: 0.5rem 0.2rem;
                    overflow-wrap: anywhere;
                    word-break: normal;
                    hyphens: auto;

                    &:first-child {
                        padding-left: 0.5rem;
                    }

                    &:last-child {
                        padding-right: 0.5rem;
                    }

                    p {
                        margin: 0;
                    }
                }

                tbody tr:nth-of-type(even):not(.fixed-row):not(.fixed) > td {
                    background-color: rgba(0, 0, 0, 0.05);
                }
            }
        }
    }
</style>
