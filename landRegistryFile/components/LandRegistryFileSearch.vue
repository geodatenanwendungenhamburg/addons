<script>
import {mapActions, mapMutations, mapGetters} from "vuex";
import mapCollection from "@core/maps/js/mapCollection";
import epsgCodeToURI from "@modules/filter/utils/epsgCodeToURI.js";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import {TAB_SET_CURRENT} from "@shared/modules/tabs/components/TabContainer.vue";
import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";
import InputText from "./shared/InputText.vue";
import Multiselect from "vue-multiselect";

export default {
    name: "LandRegistryFileSearch",
    components: {
        FlatButton,
        SwitchInput,
        InputText,
        Multiselect
    },
    inject: {
        setCurrentTab: {from: TAB_SET_CURRENT, default: null}
    },
    data () {
        return {
            searchInExtent: true,
            yearFrom: "",
            yearTo: "",
            errorMessages: {
                yearFrom: "",
                yearTo: ""
            },
            selectedRecords: [],
            moveEndKey: null,
            map: null,
            searchInitiated: false
        };
    },
    computed: {
        ...mapGetters("Modules/LandRegistryFile", [
            "showLoadingSpinner",
            "oafParams"
        ]),
        ...mapGetters("Maps", [
            "extent"
        ]),
        ...mapGetters("Menu", [
            "expanded"
        ]),
        /**
         * Checks if any errorMessage has been set in the errorMessages object
         *  returns 'false' if an errorMessage is available and 'true' if there is none
         *
         * @returns {Boolean} are all inputs valid?
         */
        allInputsValid () {
            return Object.values(this.errorMessages).every(message => message.length === 0);
        }
    },
    activated () {
        this.map = mapCollection.getMap("2D");
        this.moveEndKey = this.map?.on("moveend", () => {
            if (!this.searchedOnFullExtent && this.searchInitiated) {
                this.prepareSearch();
            }
        });
    },
    deactivated () {
        if (this.map && this.moveEndKey) {
            this.map.un("moveend", this.moveEndKey.listener);
        }
    },
    methods: {
        ...mapMutations("Modules/LandRegistryFile", [
            "setShowLoadingSpinner",
            "setLandRegistryFileFeatures"
        ]),
        ...mapActions("Modules/LandRegistryFile", [
            "queryOaf"
        ]),
        /**
        * Runs the queryOaf action with the provided parameters.
        * @param {Object} options - Query options
        * @param {Array<Number>|null} [options.bbox] - The bounding box for the filtering.
        * @param {string|null} [options.startDate] - The start date for filtering in YYYY-MM-DD format.
        * @param {string|null} [options.endDate] - The end date for filtering in YYYY-MM-DD format.
        * @param {string|null} [options.textValue] - The text value for text search filtering.
        * @param {Array<string>|null} [options.selectedOptions] - The selected options for select filtering.
        */
        async startSearch ({bbox, startDate, endDate, textValue, selectedOptions}) {
            const map = mapCollection.getMap("2D"),
                  view = map?.getView(),
                  projectionCode = view?.getProjection()?.getCode(),
                  crs = epsgCodeToURI(projectionCode);

            this.setShowLoadingSpinner(true);
            this.searchInitiated = true;

            try {
                const success = await this.queryOaf({
                    params: {
                        startDate: startDate,
                        endDate: endDate,
                        textValue: textValue,
                        selectedOptions: selectedOptions,
                        bbox: bbox?.join(","),
                        crs
                    }
                });

                if (success) {
                    this.setCurrentTab("tabResults");
                }
            }
            finally {
                this.setShowLoadingSpinner(false);
                this.searchedOnFullExtent = !this.searchInExtent;
            }
        },
        /**
         * Resets all search form fields, validation messages, and the search mode
         * and the search results on the map and in the table.
         *
         * @returns {void}
         */
        resetForm () {
            this.searchInExtent = true;
            this.yearFrom = "";
            this.yearTo = "";
            Object.keys(this.errorMessages).forEach(key => {
                this.errorMessages[key] = "";
            });
            this.selectedRecords = [];

            this.setLandRegistryFileFeatures([]);
            this.removeFeaturesFromMap();
            this.searchInitiated = false;
        },
        /**
         * Validates all search input fields and updates their validation state.
         *
         * @returns {void}
         */
        validateInputs () {
            const regexForYear = new RegExp("^[0-9]{4}$"),
                  yearFromString = String(this.yearFrom).trim(),
                  yearToString = String(this.yearTo).trim();

            Object.keys(this.errorMessages).forEach(key => {
                this.errorMessages[key] = "";
            });

            if (yearFromString.length > 0 || yearToString.length > 0) {
                if (!regexForYear.test(yearFromString)) {
                    this.errorMessages.yearFrom = this.$t("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearDigit", {
                        fieldname: this.$t("additional:modules.landRegistryFile.tabs.tabSearch.yearFromLabel")
                    });
                }

                if ((yearFromString.length > 0 && yearToString.length === 0) || (yearToString.length > 0 && yearFromString.length === 0)) {
                    if (yearFromString.length === 0) {
                        this.errorMessages.yearFrom = this.$t("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearBoth");

                        if (!regexForYear.test(yearToString)) {
                            this.errorMessages.yearTo = this.$t("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearDigit", {
                                fieldname: this.$t("additional:modules.landRegistryFile.tabs.tabSearch.yearToLabel")
                            });
                        }
                    }
                    else {
                        this.errorMessages.yearTo = this.$t("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearBoth");
                    }
                }
                else if (!regexForYear.test(yearToString)) {
                    this.errorMessages.yearTo = this.$t("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearDigit", {
                        fieldname: this.$t("additional:modules.landRegistryFile.tabs.tabSearch.yearToLabel")
                    });
                }
                else if (this.yearFrom > this.yearTo) {
                    this.errorMessages.yearTo = this.$t("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearOrder");
                }
            }
        },
        /**
         * Prepares the search parameters based on the selected years,
         * map extent, and search mode, then starts the search.
         *
         * @returns {void}
         */
        prepareSearch () {
            const searchDateFrom = this.yearFrom !== "" ? `${this.yearFrom}-01-01` : false,
                  searchDateTo = this.yearTo !== "" ? `${this.yearTo}-12-31` : false,
                  searchExtent = this.searchInExtent
                      ? this.getCurrentVisibleMapExtent()
                      : undefined,
                  searchRecords = this.selectedRecords.length > 0 ? this.selectedRecords : undefined;

            this.startSearch({
                bbox: searchExtent,
                startDate: searchDateFrom,
                endDate: searchDateTo,
                selectedOptions: searchRecords
            });
        },
        /**
         * Gets the current map extent and if needed adjusts it for expanded menus
         *
         *  @returns {Array<Array<number[]>>} The coordinates of the visible map extent as a polygon.
         */
        getCurrentVisibleMapExtent () {
            const map = mapCollection.getMap("2D"),
                  bottomLeftPixelAtCoordinates = map?.getPixelFromCoordinate([this.extent[0], this.extent[1]]),
                  topRightPixelAtCoordinates = map?.getPixelFromCoordinate([this.extent[2], this.extent[3]]),
                  rightPadding = this.expanded("secondaryMenu")
                      ? document.getElementById("mp-menu-secondaryMenu").offsetWidth
                      : 20,
                  leftPadding = this.expanded("mainMenu")
                      ? document.getElementById("mp-menu-mainMenu").offsetWidth
                      : 20,
                  shiftedBottomLeftPixelX = bottomLeftPixelAtCoordinates[0] + leftPadding,
                  shiftedBottomLeftCoordinate = map.getCoordinateFromPixel([shiftedBottomLeftPixelX, bottomLeftPixelAtCoordinates[1]]),
                  shiftedTopRightPixelX = topRightPixelAtCoordinates[0] - rightPadding,
                  shiftedTopRightCoordinate = map.getCoordinateFromPixel([shiftedTopRightPixelX, topRightPixelAtCoordinates[1]]),
                  visibleExtentCoordinates = [[
                      shiftedBottomLeftCoordinate[0],
                      shiftedBottomLeftCoordinate[1],
                      shiftedTopRightCoordinate[0],
                      shiftedTopRightCoordinate[1]
                  ]];

            return visibleExtentCoordinates;
        },
        /**
         * Removes all features from the land registry layer on the map.
         */
        removeFeaturesFromMap () {
            const map = mapCollection.getMap("2D");

            if (!map) {
                return;
            }

            const layer = map.getLayers().getArray().find(l => l.get("name") === "Module/landRegistryFile/layer/belegenheiten");

            if (layer) {
                layer.getSource().clear();
            }
        }
    }
};
</script>

<template lang="html">
    <div
        id="landRegistryFileSearch"
        class="InnerLayoutFrame"
    >
        <div class="ScrollableContent">
            <SwitchInput
                id="idSearchInExtentSwitch"
                class="searchModeSwitch"
                :aria="$t('additional:modules.landRegistryFile.tabs.tabSearch.searchModeSwitchLabel')"
                :label="$t('additional:modules.landRegistryFile.tabs.tabSearch.searchModeSwitchLabel')"
                :checked="searchInExtent"
                :interaction="(evt) => searchInExtent = evt.target.checked"
            />

            <div class="recordtype-select-container">
                <label for="recordtype-select">
                    {{ $t("additional:modules.landRegistryFile.tabs.tabSearch.selectRecordLabel") }}
                </label>

                <Multiselect
                    id="recordtype-select"
                    v-model="selectedRecords"
                    :aria-label="$t('additional:modules.landRegistryFile.tabs.tabSearch.selectRecordLabel')"
                    :options="oafParams?.filters?.select?.options"
                    name="recordtype-select"
                    :multiple="true"
                    :placeholder="$t('additional:modules.landRegistryFile.tabs.tabSearch.selectRecordPlaceholder')"
                    :show-labels="false"
                    open-direction="bottom"
                    :hide-selected="false"
                    :allow-empty="true"
                    :close-on-select="true"
                    :clear-on-select="false"
                    :internal-search="true"
                />
            </div>

            <p class="searchYearFormLabel">
                {{ $t('additional:modules.landRegistryFile.tabs.tabSearch.yearLabel') }}
            </p>

            <div id="searchYearForm">
                <div class="searchYearFormInputs">
                    <InputText
                        id="searchYearFrom"
                        key="searchYearFrom"
                        v-model="yearFrom"
                        :class-obj="['form-control' + (errorMessages.yearFrom.length > 0 ? ' is-invalid': ' is-valid')]"
                        :label="$t('additional:modules.landRegistryFile.tabs.tabSearch.yearFromLabel')"
                        placeholder="2023"
                        :error-message="errorMessages.yearFrom"
                        @input="validateInputs()"
                    />

                    <InputText
                        id="searchYearTo"
                        key="searchYearTo"
                        v-model="yearTo"
                        :class-obj="['form-control' + (errorMessages.yearTo.length > 0 ? ' is-invalid': ' is-valid')]"
                        :label="$t('additional:modules.landRegistryFile.tabs.tabSearch.yearToLabel')"
                        placeholder="2024"
                        :error-message="errorMessages.yearTo"
                        @input="validateInputs()"
                    />
                </div>

                <p class="errorInSearchYear">
                    {{ errorMessages.yearFrom }}
                </p>

                <p class="errorInSearchYear">
                    {{ errorMessages.yearTo }}
                </p>
            </div>
        </div>

        <div class="FixedContent buttons-footer">
            <div class="searchExtentHint">
                <p v-if="searchInExtent">
                    {{ $t("additional:modules.landRegistryFile.tabs.tabSearch.searchModeInExtent") }}
                </p>

                <p v-else>
                    {{ $t("additional:modules.landRegistryFile.tabs.tabSearch.searchModeOverall") }}
                </p>
            </div>

            <div class="FixedContent">
                <div
                    class="spacer-div"
                />
                <FlatButton
                    id="landRegistrySearchButton"
                    :aria-label="$t('additional:modules.landRegistryFile.tabs.tabSearch.searchButtonLabel')"
                    text="Suche"
                    :disabled="!allInputsValid"
                    @click="prepareSearch()"
                />

                <FlatButton
                    :aria-label="$t('additional:modules.landRegistryFile.tabs.tabSearch.resetButtonLabel')"
                    text="Zurücksetzen"
                    :secondary="true"
                    @click="resetForm()"
                />
            </div>
        </div>
    </div>
</template>

<style src="vue-multiselect/dist/vue-multiselect.css"></style>

<style lang="scss" scoped>
    #landRegistryFileSearch{
        height: 100%;

        div.searchModeSwitch {
            margin-top: 1rem;
        }

        div.recordtype-select-container {
            margin-top: 1.5rem;
            margin-bottom: 0.5rem;
        }

        p.searchYearFormLabel {
            background-color: white;
            z-index: 1;
            width: fit-content;
            font-size: 1rem;
            margin: 1rem 1rem -0.7rem 1rem;
            padding-left: 0.5rem;
            padding-right: 0.5rem;
        }

        div#searchYearForm {
            border: #222;
            border-style: solid;
            border-width: 1px;
            border-radius: 5px;
            padding: 1.5rem 1rem 1rem 1rem;

            div.searchYearFormInputs {
                display: flex;
                gap: 1rem;
                margin-bottom: 0.5rem;

                div.InputText {
                    flex: 1;
                    margin-bottom: 0;

                    :deep(span.invalid-feedback) {
                        display: none;
                    }
                }
            }

            p.errorInSearchYear {
                color: var(--bs-form-invalid-color);
                width: 100%;
                margin-top: 0.25rem;
                font-size: 0.875em;
            }
        }

        div.searchExtentHint {
            p {
                background-color: white;
                white-space: pre-line;
                text-align: right;
            }
        }

        div.spacer-div {
            flex: 1;
        }

        div.FixedContent.buttons-footer {
            flex-direction: column;
        }
    }
</style>
