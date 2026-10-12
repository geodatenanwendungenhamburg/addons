<script>
import {mapActions, mapMutations, mapGetters} from "vuex";
import mapCollection from "@core/maps/js/mapCollection";
import epsgCodeToURI from "@modules/filter/utils/epsgCodeToURI.js";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import {TAB_SET_CURRENT} from "./shared/TabContainer.vue";
import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import ModalItem from "@shared/modules/modals/components/ModalItem.vue";
import InputText from "./shared/InputText.vue";
import Multiselect from "vue-multiselect";
import GeoJSON from "ol/format/GeoJSON";
import Style from "ol/style/Style";
import Circle from "ol/style/Circle";
import Fill from "ol/style/Fill";

import "vue-multiselect/dist/vue-multiselect.css";

export default {
    name: "LandRegistryFileSearch",
    components: {
        FlatButton,
        SwitchInput,
        InputText,
        Multiselect,
        IconButton,
        ModalItem
    },
    inject: {
        setCurrentTab: {from: TAB_SET_CURRENT, default: null}
    },
    data () {
        return {
            searchForm: {
                searchInExtent: true,
                yearFrom: "",
                yearTo: "",
                selectSelections: {},
                searchText: ""
            },
            activeSearchCriteria: {
                searchInExtent: true,
                yearFrom: "",
                yearTo: "",
                selectSelections: {},
                searchText: ""
            },
            errorMessages: {
                yearFrom: "",
                yearTo: "",
                searchText: ""
            },
            moveEndKey: null,
            map: null,
            searchInitiated: false,
            showTextSearchInfo: false,
            // eslint-disable-next-line no-useless-escape
            searchTextValidationRegex: "^[\\p{L}0-9 ,\.\/§()\-]+$"
        };
    },
    computed: {
        ...mapGetters("Modules/LandRegistryFile", [
            "showLoadingSpinner",
            "oafParams",
            "oafSchema",
            "onCenterMap"
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
        },
        /**
         * Gets the display titles of the fields configured for text search from the oafSchema.
         *
         * @returns {Array<string|undefined>} The configured field titles.
         */
        fieldNamesForTextSearch () {
            const propertiesToSearch = this.oafParams?.filters.textSearchFields,
                  fieldNamesToSearch = [];

            propertiesToSearch?.forEach(prop => {
                if (this.oafSchema?.properties?.[prop]?.title) {
                    fieldNamesToSearch.push(this.oafSchema?.properties?.[prop]?.title);
                }
            });

            return fieldNamesToSearch;
        },
        /**
         * Checks if the search form has been modified since the last search was initiated.
         * @returns {boolean} True if the search form has been modified, false otherwise.
         */
        showUnsubmittedSearchWarning () {
            const form = this.searchForm,
                  active = this.activeSearchCriteria,
                  selectSelectionKeys = new Set([
                      ...Object.keys(form.selectSelections || {}),
                      ...Object.keys(active.selectSelections || {})
                  ]),
                  selectedSelectionChanged = [...selectSelectionKeys].some(key => {
                      const formSelection = form.selectSelections?.[key],
                            activeSelection = active.selectSelections?.[key];

                      if (Array.isArray(formSelection) && Array.isArray(activeSelection)) {
                          return formSelection.length !== activeSelection.length ||
                              formSelection.some(value => !activeSelection.includes(value));
                      }

                      return formSelection !== activeSelection;
                  });

            return this.searchInitiated &&
                (form.searchInExtent !== active.searchInExtent ||
                    form.yearFrom !== active.yearFrom ||
                    form.yearTo !== active.yearTo ||
                    form.searchText !== active.searchText ||
                    selectedSelectionChanged);
        },
        /**
         * Returns the configured select filters with a display name resolved
         * from the OAF schema, falling back to the filter field name.
         *
         * @returns {Array<Object>} The select filters with their display names.
         */
        selectFilters () {
            return (this.oafParams?.filters?.select || []).map(select => ({
                ...select,
                fieldName: this.oafSchema?.properties?.[select.field]?.title || select.field
            }));
        }
    },
    created () {
        this.searchForm.selectSelections = Object.fromEntries(
            (this.oafParams?.filters?.select || []).map(({field, multiple}) => [
                field,
                multiple ? [] : null
            ])
        );

        this.activeSearchCriteria.selectSelections = Object.fromEntries(
            (this.oafParams?.filters?.select || []).map(({field, multiple}) => [
                field,
                multiple ? [] : null
            ])
        );
    },
    activated () {
        this.map = mapCollection.getMap("2D");
        this.moveEndKey = this.map?.on("moveend", () => {
            if (this.activeSearchCriteria.searchInExtent && this.searchInitiated && !this.onCenterMap) {
                this.prepareSearch();
            }
        });

        this.map.on("singleclick", this.handleMapFeatureClick);
    },
    deactivated () {
        if (this.map && this.moveEndKey) {
            this.map.un("moveend", this.moveEndKey.listener);
        }
        if (this.map && this.handleMapFeatureClick) {
            this.map.un("singleclick", this.handleMapFeatureClick);
        }
    },
    methods: {
        ...mapMutations("Modules/LandRegistryFile", [
            "setShowLoadingSpinner",
            "setLandRegistryFileFeatures",
            "setMapSelectionSource"
        ]),
        ...mapActions("Modules/LandRegistryFile", [
            "queryOaf",
            "updateSelectionLayer"
        ]),
        /**
        * Runs the queryOaf action with the provided parameters.
        * @param {Object} options - Query options
        * @param {Array<Number>|null} [options.bbox] - The bounding box for the filtering.
        * @param {string|null} [options.startDate] - The start date for filtering in YYYY-MM-DD format.
        * @param {string|null} [options.endDate] - The end date for filtering in YYYY-MM-DD format.
        * @param {string|null} [options.textValue] - The text value for text search filtering.
        * @param {Object|null} [options.selectedFilters] - The selected options for select filtering.
        * @param {boolean} [options.initiatedByUser] - Indicates if the search was initiated by the user.
        */
        async startSearch ({bbox, startDate, endDate, textValue, selectedFilters, initiatedByUser}) {
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
                        selectedFilters: selectedFilters,
                        bbox: bbox?.join(","),
                        crs
                    }
                });

                if (success && initiatedByUser) {
                    this.setCurrentTab("tabResults");
                }
            }
            finally {
                this.setShowLoadingSpinner(false);
            }
        },
        /**
         * Resets all search form fields, validation messages, and the search mode
         * and the search results on the map and in the table.
         *
         * @returns {void}
         */
        resetForm () {
            this.searchForm = {
                searchInExtent: true,
                yearFrom: "",
                yearTo: "",
                selectSelections: {},
                searchText: ""
            };

            (this.oafParams?.filters?.select || []).forEach(({field, multiple}) => {
                this.searchForm.selectSelections[field] = multiple ? [] : null;
            });

            this.activeSearchCriteria = JSON.parse(JSON.stringify(this.searchForm));

            Object.keys(this.errorMessages).forEach(key => {
                this.errorMessages[key] = "";
            });

            this.setLandRegistryFileFeatures([]);
            this.removeFeaturesFromMap();
            this.updateSelectionLayer({features: [], layerName: "Module/landRegistryFile/layer/selection"});
            this.searchInitiated = false;
        },
        /**
         * Validates all search input fields and updates their validation state.
         *
         * @returns {void}
         */
        validateInputs () {
            const regexForYear = new RegExp("^[0-9]{4}$"),
                  regexForText = new RegExp(this.searchTextValidationRegex, "u"),
                  yearFromString = String(this.searchForm.yearFrom).trim(),
                  yearToString = String(this.searchForm.yearTo).trim(),
                  textToCheck = String(this.searchForm.searchText).trim();

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
                else if (this.searchForm.yearFrom > this.searchForm.yearTo) {
                    this.errorMessages.yearTo = this.$t("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearOrder");
                }
            }

            if (textToCheck.length > 0) {
                const invalidCharacters = [...new Set(
                    [...textToCheck].filter(character => !regexForText.test(character))
                )];

                if (invalidCharacters.length > 0) {
                    this.errorMessages.searchText = this.$t("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorInvalidChars", {
                        invalidChars: invalidCharacters.join(" "),
                        interpolation: {
                            // Disabling i18next escaping is safe here because InputText.vue renders this value with Vue text interpolation, which escapes HTML.
                            // If the value is rendered with v-html, do not disable escaping; escape or sanitize the value instead.
                            escapeValue: false
                        }
                    });
                }
            }
        },
        /**
         * Prepares the search parameters based on the selected years,
         * map extent, and search mode, then starts the search.
         *
         * @param {boolean} [initiatedByUser=false] - Indicates if the search was initiated by the user.
         * @returns {void}
         */
        prepareSearch (initiatedByUser = false) {
            const criteria = this.activeSearchCriteria,
                  searchDateFrom = criteria.yearFrom !== "" ? `${criteria.yearFrom}-01-01` : false,
                  searchDateTo = criteria.yearTo !== "" ? `${criteria.yearTo}-12-31` : false,
                  searchInExtent = criteria.searchInExtent,
                  searchExtent = searchInExtent
                      ? this.getCurrentVisibleMapExtent()
                      : undefined,
                  searchText = criteria.searchText;

            this.startSearch({
                bbox: searchExtent,
                startDate: searchDateFrom,
                endDate: searchDateTo,
                textValue: searchText,
                initiatedByUser,
                selectedFilters: criteria.selectSelections
            });
        },
        /**
         * Initiates the search process when the user clicks the search button.
         * Validates the inputs and prepares the search if all inputs are valid.
         *
         * @returns {void}
         */
        initiateSearchByUser () {
            this.validateInputs();

            if (this.allInputsValid) {
                this.activeSearchCriteria = JSON.parse(JSON.stringify(this.searchForm));
                this.prepareSearch(true);
            }
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
        },
        /**
         * Get features clicked on the map.
         * @param {Object} evt - The map click event.
         * @returns {void}
         */
        handleMapFeatureClick (evt) {
            const map = evt?.map,
                  clickedFeatures = [],
                  clickedOlFeatures = [];

            if (!map) {
                return;
            }

            const format = new GeoJSON();

            map.forEachFeatureAtPixel(
                evt.pixel, feature => {
                    const geojsonFeature = JSON.parse(format.writeFeature(feature));

                    clickedFeatures.push(geojsonFeature);

                    const clonedFeature = feature.clone(),
                          clonedFeatureStyle = new Style({
                              image: new Circle({
                                  radius: 5,
                                  fill: new Fill({color: "#03ffff"})
                              })
                          });

                    clonedFeature.setStyle(clonedFeatureStyle);
                    clickedOlFeatures.push(clonedFeature);
                    return false; // continue iteration, or true to stop after first
                },
                {
                    hitTolerance: 5,
                    layerFilter: layer => layer.get("name") === "Module/landRegistryFile/layer/belegenheiten"
                }
            );

            this.updateSelectionLayer({features: clickedOlFeatures, layerName: "Module/landRegistryFile/layer/selection"});
            this.setMapSelectionSource("map");
            this.setCurrentTab("tabResults");
        },
        /**
         * Gets GeoJSON features from the specified map layer.
         *
         * @param {String} layerName Name of the layer to retrieve features from.
         * @returns {Array<Object>} GeoJSON features, or an empty array if the map is unavailable.
         */
        getGeoJsonFeaturesFromLayer (layerName) {
            const map = mapCollection.getMap("2D"),
                  features = [],
                  format = new GeoJSON();

            if (!map) {
                return features;
            }

            const layer = map.getLayers().getArray().find(l => l.get("name") === layerName);
            const source = layer.getSource();

            if (!layer || !source) {
                return features;
            }

            source.getFeatures().forEach(feature => {
                features.push(JSON.parse(format.writeFeature(feature)));
            });

            return features;
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
                :checked="searchForm.searchInExtent"
                :interaction="(evt) => searchForm.searchInExtent = evt.target.checked"
            />

            <div
                v-for="item in selectFilters"
                :key="item.field"
                class="typeSelectContainer"
            >
                <label :for="`type-select-${item.field}`">
                    {{ item.fieldName }}
                </label>

                <Multiselect
                    :id="`type-select-${item.field}`"
                    v-model="searchForm.selectSelections[item.field]"
                    :aria-label="item.fieldName"
                    :options="item.options"
                    :name="`type-select-${item.field}`"
                    :multiple="item.multiple"
                    :placeholder="$t('additional:modules.landRegistryFile.tabs.tabSearch.selectPlaceholder', {fieldName: item.fieldName})"
                    :show-labels="false"
                    open-direction="bottom"
                    :hide-selected="false"
                    :allow-empty="true"
                    :close-on-select="true"
                    :clear-on-select="false"
                    :internal-search="true"
                />
            </div>

            <p class="searchTextFormLabel">
                {{ $t('additional:modules.landRegistryFile.tabs.tabSearch.textSearchLabel') }}
            </p>

            <div class="searchTextContainer">
                <InputText
                    id="searchTextField"
                    key="searchTextField"
                    v-model="searchForm.searchText"
                    :class-obj="['form-control' + (errorMessages.searchText.length > 0 ? ' is-invalid': ' is-valid')]"
                    :label="$t('additional:modules.landRegistryFile.tabs.tabSearch.textSearchPlaceholder')"
                    placeholder=""
                    :error-message="errorMessages.searchText"
                    @input="validateInputs()"
                />

                <IconButton
                    :class-array="['btn-light', 'textSearchInfoButton']"
                    :aria="$t('additional:modules.landRegistryFile.tabs.tabSearch.textSearchInfo')"
                    icon="bi-info-circle"
                    @click="showTextSearchInfo = true"
                />
            </div>

            <p class="searchYearFormLabel">
                {{ $t('additional:modules.landRegistryFile.tabs.tabSearch.yearLabel') }}
            </p>

            <div class="searchYearContainer">
                <div class="searchYearFormInputs">
                    <InputText
                        id="searchYearFrom"
                        key="searchYearFrom"
                        v-model="searchForm.yearFrom"
                        :class-obj="['form-control' + (errorMessages.yearFrom.length > 0 ? ' is-invalid': ' is-valid')]"
                        :label="$t('additional:modules.landRegistryFile.tabs.tabSearch.yearFromLabel')"
                        placeholder="2023"
                        :error-message="errorMessages.yearFrom"
                        @input="validateInputs()"
                    />

                    <InputText
                        id="searchYearTo"
                        key="searchYearTo"
                        v-model="searchForm.yearTo"
                        :class-obj="['form-control' + (errorMessages.yearTo.length > 0 ? ' is-invalid': ' is-valid')]"
                        :label="$t('additional:modules.landRegistryFile.tabs.tabSearch.yearToLabel')"
                        placeholder="2024"
                        :error-message="errorMessages.yearTo"
                        @input="validateInputs()"
                    />
                </div>

                <p
                    v-if="errorMessages.yearFrom.length > 0"
                    class="errorInSearchYear"
                >
                    {{ errorMessages.yearFrom }}
                </p>

                <p
                    v-if="errorMessages.yearTo.length > 0"
                    class="errorInSearchYear"
                >
                    {{ errorMessages.yearTo }}
                </p>
            </div>
        </div>

        <div class="FixedContent buttons-footer">
            <div class="unsubmitted-search-warning">
                <p>
                    <span v-if="showUnsubmittedSearchWarning">
                        {{ $t("additional:modules.landRegistryFile.tabs.tabSearch.unsubmittedSearchWarning") }}
                    </span>
                </p>
            </div>
            <div class="searchExtentHint">
                <p v-if="searchForm.searchInExtent">
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
                    @click="initiateSearchByUser()"
                />

                <FlatButton
                    :aria-label="$t('additional:modules.landRegistryFile.tabs.tabSearch.resetButtonLabel')"
                    text="Zurücksetzen"
                    :secondary="true"
                    @click="resetForm()"
                />
            </div>
        </div>

        <ModalItem
            :show-modal="showTextSearchInfo"
            :title="$t('additional:modules.landRegistryFile.tabs.tabSearch.textSearchInfo')"
            @close="showTextSearchInfo = false"
            @modalHid="showTextSearchInfo = false"
        >
            <template #default>
                <h4>{{ $t("additional:modules.landRegistryFile.tabs.tabSearch.textSearchInfo") }}</h4>

                <p>{{ $t("additional:modules.landRegistryFile.tabs.tabSearch.textSearchInfoModal.searchIn") }}</p>

                <ul>
                    <li
                        v-for="(fieldName, fnIndex) in fieldNamesForTextSearch"
                        :key="fnIndex"
                    >
                        {{ fieldName }}
                    </li>
                </ul>

                <p>{{ $t("additional:modules.landRegistryFile.tabs.tabSearch.textSearchInfoModal.searchValidChars") }}</p>

                <span>, . / § - ( ) </span>
            </template>
        </ModalItem>
    </div>
</template>

<style lang="scss" scoped>
    #landRegistryFileSearch{
        height: 100%;

        div.ScrollableContent {
            overflow-x: hidden;
        }

        div.searchModeSwitch {
            margin: 1rem 0;

            > * {
                cursor: pointer;
            }
        }

        div.typeSelectContainer {
            margin: 0.5rem 0;

            :deep(.multiselect__selected),
            :deep(.multiselect__tags),
            :deep(.multiselect__option) {
                font-size: 1rem;
            }

            :deep(.multiselect__input::placeholder),
            :deep(.multiselect__placeholder) {
                color: #747474;
                font-weight: normal;
            }
        }

        div.searchTextContainer {
            display: flex;
            align-items: center;
            border: #222;
            border-style: solid;
            border-width: 1px;
            border-radius: 5px;
            padding: 1.5rem 1rem 1rem 1rem;
            margin-bottom: 0.5rem;

            div.InputText {
                margin-bottom: 0;
                flex: 1;
            }
        }

        p.searchYearFormLabel,
        p.searchTextFormLabel {
            background-color: white;
            z-index: 1;
            width: fit-content;
            font-size: 1rem;
            margin: 1rem 1rem -0.7rem 1rem;
            padding: 0 0.5rem;
        }

        div.searchYearContainer {
            border: #222;
            border-style: solid;
            border-width: 1px;
            border-radius: 5px;
            padding: 1.5rem 1rem 1rem 1rem;

            div.searchYearFormInputs {
                display: flex;
                gap: 1rem;

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

                &:first-of-type {
                    margin-top: 0.75rem;
                }
            }
        }

        div.unsubmitted-search-warning p {
            color: var(--bs-form-invalid-color);
            white-space: pre-line;
            text-align: right;
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
