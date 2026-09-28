<script>
import {mapActions, mapMutations, mapGetters} from "vuex";
import mapCollection from "@core/maps/js/mapCollection";
import epsgCodeToURI from "@modules/filter/utils/epsgCodeToURI.js";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import {TAB_SET_CURRENT} from "@shared/modules/tabs/components/TabContainer.vue";
import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";
import InputText from "./shared/InputText.vue";

export default {
    name: "LandRegistryFileSearch",
    components: {
        FlatButton,
        SwitchInput,
        InputText
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
            }
        };
    },
    computed: {
        ...mapGetters("Modules/LandRegistryFile", [
            "showLoadingSpinner"
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
    methods: {
        ...mapMutations("Modules/LandRegistryFile", [
            "setShowLoadingSpinner"
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
            }
        },
        /**
         * Resets all search form fields, validation messages, and the search mode.
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
                    this.errorMessages.yearFrom = this.$t("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearDigit");
                }

                if ((yearFromString.length > 0 && yearToString.length === 0) || (yearToString.length > 0 && yearFromString.length === 0)) {
                    if (yearFromString.length === 0) {
                        this.errorMessages.yearFrom = this.$t("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearBoth");

                        if (!regexForYear.test(yearToString)) {
                            this.errorMessages.yearTo = this.$t("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearDigit");
                        }
                    }
                    else {
                        this.errorMessages.yearTo = this.$t("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearBoth");
                    }
                }
                else if (!regexForYear.test(yearToString)) {
                    this.errorMessages.yearTo = this.$t("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearDigit");
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
                      : undefined;

            this.startSearch({
                bbox: searchExtent,
                startDate: searchDateFrom,
                endDate: searchDateTo
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

            <p class="searchYearFormLabel">
                {{ $t('additional:modules.landRegistryFile.tabs.tabSearch.yearLabel') }}
            </p>

            <div id="searchYearForm">
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

<style lang="scss" scoped>
    #landRegistryFileSearch{
        height: 100%;

        div.searchModeSwitch {
            margin-top: 1rem;
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
            padding: 1.5rem 1rem 0 1rem;
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
