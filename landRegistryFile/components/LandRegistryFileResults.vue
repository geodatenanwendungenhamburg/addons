<script>
import {mapGetters, mapMutations, mapActions} from "vuex";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import TableComponent from "./shared/TableComponent.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import {TAB_SET_CURRENT} from "@shared/modules/tabs/components/TabContainer.vue";
import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import Style from "ol/style/Style";
import Circle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import {isWebLink} from "@shared/js/utils/urlHelper.js";

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
            scrollPending: false,
            selectedRowId: null
        };
    },
    computed: {
        ...mapGetters("Modules/LandRegistryFile", [
            "selectedDetailFeatureId",
            "tableFields",
            "oafSchema",
            "sorting",
            "getSortedFeatures",
            "showLoadingSpinner"
        ]),
        ...mapGetters("Menu", [
            "expanded"
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
                  items = (this.getSortedFeatures || []).map(feature => ({
                      ...feature.properties,
                      id: feature.id
                  }));

            return {
                headers,
                items
            };
        }
    },
    watch: {
        getSortedFeatures () {
            this.scrollPending = true;
            this.performPendingScroll();
            this.selectedRowId = null;
        },
        showLoadingSpinner (isLoading) {
            if (!isLoading) {
                this.performPendingScroll();
            }
        }
    },
    methods: {
        ...mapMutations("Modules/LandRegistryFile", [
            "setSelectedDetailFeatureId",
            "setSorting"
        ]),
        ...mapActions("Modules/LandRegistryFile", [
            "updateSelectionLayer"
        ]),
        ...mapActions("Maps", [
            "setCenter",
            "setZoom"
        ]),
        /**
         * Displays the position of the table row on the map.
         * @param {Object} row - The table row containing UTM coordinates.
         * @returns {void}
         */
        showMapPosition (row) {
            let feature = null;

            if (this.selectedRowId === row.id) {
                this.selectedRowId = null;
            }
            else {
                this.selectedRowId = row.id;

                feature = new Feature({
                    geometry: new Point([row.utm_rw, row.utm_hw])
                });

                const selectionStyle = new Style({
                    image: new Circle({
                        radius: 5,
                        fill: new Fill({color: "#03ffff"})
                    })
                });

                feature.setStyle(selectionStyle);
                this.zoomToSelectedFeature(feature);
            }

            this.updateSelectionLayer({features: feature ? [feature] : [], layerName: "Module/landRegistryFile/layer/selection"});
        },
        /**
         * Sets the selected feature ID and switches to the details tab.
         * @param {Object} row - The row object containing the feature ID.
         * @returns {void}
         */
        showDetails (row) {
            if (this.selectedDetailFeatureId === row.id) {
                this.setSelectedDetailFeatureId(null);
                return;
            }

            this.setSelectedDetailFeatureId(row.id);
            this.setCurrentTab("tabDetails");
        },
        /**
         * Scrolls to the selected row or the top, but only if a scroll is pending and the table is visible.
         * @returns {void}
         */
        performPendingScroll () {
            this.$nextTick(() => {
                if (!this.scrollPending || this.$el.offsetParent === null) {
                    return;
                }
                this.scrollPending = false;

                if (this.selectedDetailFeatureId) {
                    this.scrollToSelectedDetail();
                }
                else {
                    this.scrollToTop();
                }
            });
        },
        /**
         * Scrolls the results table back to the top after new results are loaded.
         * @returns {void}
         */
        scrollToTop () {
            this.$nextTick(() => {
                this.$el
                    .querySelectorAll(".table-wrapper, .land-registry-table-scroll")
                    .forEach(el => el.scrollTo({top: 0, behavior: "smooth"}));
            });
        },
        /**
         * Scrolls the selected detail row into view after the the selected feature or the table sorting changes.
         * @returns {void}
         */
        scrollToSelectedDetail () {
            this.$nextTick(() => {
                const selectedButton = this.$el.querySelector(".selected-button"),
                      selectedRow = selectedButton?.closest("tr");

                selectedRow?.scrollIntoView({behavior: "smooth", block: "center"});
            });
        },
        /** Centers the map on the given coordinate, accounting for visible menus.
         * @param {Array<number>|null} coord - The coordinate to center the map on.
         * @returns {void}
         */
        centerVisibleMap (coord = null) {
            const coordinates = coord;

            const map = mapCollection.getMap("2D"),
                  pixelAtCoordinates = map?.getPixelFromCoordinate(coordinates);

            if (!map || !pixelAtCoordinates) {
                return;
            }

            const rightPadding = this.expanded("secondaryMenu")
                      ? document.getElementById("mp-menu-secondaryMenu").offsetWidth + 20
                      : 20,
                  leftPadding = this.expanded("mainMenu")
                      ? document.getElementById("mp-menu-mainMenu").offsetWidth + 20
                      : 20,
                  offset = (rightPadding - leftPadding) / 2,
                  shiftedPixel = [pixelAtCoordinates[0] + offset, pixelAtCoordinates[1]],
                  shiftedCoordinate = map.getCoordinateFromPixel(shiftedPixel);

            this.setCenter(shiftedCoordinate);
        },
        /**
         * Zooms to the selected feature and centers it in the visible map area.
         * @param {Feature|null} feature - The feature to zoom to.
         * @returns {void}
         */
        zoomToSelectedFeature (feature) {
            if (feature) {
                const map = mapCollection.getMap("2D"),
                      view = map?.getView(),
                      setZoom = 7;

                if (!map || !view) {
                    return;
                }

                if (view.getZoom() === setZoom) {
                    this.centerVisibleMap(feature.getGeometry().getCoordinates());
                }
                else {
                    const onMoveEnd = () => {
                        this.centerVisibleMap(feature.getGeometry().getCoordinates());
                        map.un("moveend", onMoveEnd);
                    };

                    map.on("moveend", onMoveEnd);
                    view.setZoom(setZoom);
                }
            }
        },
        /**
         * Opens the link to the record in ELDORADO by opening it in a new window
         * @returns {void}
         */
        goToEldorado (row) {
            if (row?.eldorado && isWebLink(row.eldorado)) {
                window.open(row.eldorado, "_blank", "noopener,noreferrer");
            }
            else {
                console.warn("Der Datensatz hat keinen ELDORADO-Link");
            }
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
                <span class="number-of-results">{{ getSortedFeatures.length }}</span>
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
                table-class="land-registry-table-scroll"
                :data="tableData"
                :sortable="true"
                :sorting="sorting"
                :manual-sorting="true"
                @update:sorting="(newSorting) => setSorting(newSorting)"
            >
                <template #cell-actions="{ row }">
                    <div class="actions-wrapper">
                        <IconButton
                            v-if="row.eldorado"
                            :aria="$t('additional:modules.landRegistryFile.tabs.tabResults.actionsOpenLink')"
                            icon="bi-folder-symlink"
                            :class-array="['action-button']"
                            @click.stop="goToEldorado(row)"
                        />
                        <IconButton
                            :aria="$t('additional:modules.landRegistryFile.tabs.tabResults.actionsShowPosition')"
                            icon="bi-crosshair"
                            :class-array="['action-button', row.id === selectedRowId ?'map-selected-button' : '']"
                            @click.stop="showMapPosition(row)"
                        />
                        <IconButton
                            :aria="$t('additional:modules.landRegistryFile.tabs.tabResults.actionsShowDetails')"
                            icon="bi-arrow-right-circle"
                            :class-array="['action-button', row.id === selectedDetailFeatureId ?'selected-button' : '']"
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

                :deep(.action-button) {
                    width: 1.6rem;
                    height: 1.6rem;
                    z-index: 1;

                    &.selected-button {
                        background-color: rgb(214, 227, 255);
                        border-color: rgb(60, 95, 148);
                    }

                    &.map-selected-button {
                        background-color: #03ffff;
                    }

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
