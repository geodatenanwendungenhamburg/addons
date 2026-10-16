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
                searchText: "",
                needsExtraFilter: ""
            },
            moveEndKey: null,
            map: null,
            searchInitiated: false,
            showTextSearchInfo: false,
            // eslint-disable-next-line no-useless-escape
            searchTextValidationRegex: "^[\\p{L}0-9 ,\.\/§()\-]+$",
            focusedSelectField: null
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
         * Adds a Map from each option value to its configured color.
         *
         * @returns {Array<Object>} The select filters with their display names and color mappings.
         */
        selectFilters () {
            return (this.oafParams?.filters?.select || []).map(select => ({
                ...select,
                fieldName: this.oafSchema?.properties?.[select.field]?.title || select.field,
                colorByValue: new Map(select.options.map(option => [option.value, option.color]))
            }));
        },
        /**
         * Returns an array of selected filter values with their corresponding field names
         * and a flag indicating if they require an extra filter.
         *
         * @returns {Array<Object>} The selected filter values with field names and extra filter flags.
         */
        selectedFilterValues () {
            return Object.entries(this.searchForm.selectSelections || {}).flatMap(([field, selection]) => {

                let selectedValues = [];

                if (Array.isArray(selection)) {
                    selectedValues = selection;
                }
                else if (selection !== null && selection !== "") {
                    selectedValues = [selection];
                }

                const options = this.selectFilters
                    ?.find(select => select.field === field)?.options || [];

                return selectedValues.map(value => {
                    const option = options.find(o => o.value === value);

                    return {
                        field,
                        value,
                        needsExtraFilter: option?.needsExtraFilter ?? false
                    };
                });
            });
        },
        /**
         * Checks if there are any error messages in the errorMessages object
         * other than the "needsExtraFilter" message.
         *
         * @returns {boolean} True if there are other error messages, false otherwise.
         */
        hasOtherErrorMessage () {
            return Object.entries(this.errorMessages).some(
                ([key, message]) => key !== "needsExtraFilter" && message.length > 0
            );
        }
    },
    watch: {
        searchForm: {
            handler () {
                this.validateInputs();
            },
            deep: true
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

            const selectedValues = this.selectedFilterValues,
                  fieldsRequiringExtraFilter = new Set(
                      selectedValues
                          .filter(value => value.needsExtraFilter === true)
                          .map(value => value.field)
                  ),
                  noIndependentFilters = !selectedValues.some(value => value.needsExtraFilter === false && !fieldsRequiringExtraFilter.has(value.field));

            if (!this.searchForm.searchInExtent && yearFromString === "" && yearToString === "" && textToCheck === "" && noIndependentFilters) {
                const optionsRequiringAdditionalFilter = selectedValues.filter(v => v.needsExtraFilter === true);

                if (optionsRequiringAdditionalFilter.length > 0) {
                    this.errorMessages.needsExtraFilter = this.$t("additional:modules.landRegistryFile.tabs.tabSearch.errors.overallSearchOptionNeedsFilter", {
                        selectedOption: optionsRequiringAdditionalFilter.map(v => v.value).join(", ")
                    });
                }
                else {
                    this.errorMessages.needsExtraFilter = this.$t("additional:modules.landRegistryFile.tabs.tabSearch.errors.overallSearchNeedsFilter");
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
        },
        hasSelection (selection) {
            return Array.isArray(selection)
                ? selection.length > 0
                : selection !== null && selection !== "";
        }
    }
};
</script>

<template lang="html">
    <div
        id="landRegistryFileSearch"
        class="InnerLayoutFrame"
    >
        <div class="ScrollableContent searchForm">
            <div
                v-for="item in selectFilters"
                :key="item.field"
                class="typeSelectContainer"
                :class="{
                    'has-selection': hasSelection(searchForm.selectSelections[item.field])
                }"
            >
                <Multiselect
                    :id="`type-select-${item.field}`"
                    v-model="searchForm.selectSelections[item.field]"
                    :aria-label="item.fieldName"
                    :options="item.options.map(option => option.value)"
                    :name="`type-select-${item.field}`"
                    :multiple="item.multiple"
                    placeholder=""
                    :show-labels="false"
                    open-direction="bottom"
                    :hide-selected="false"
                    :allow-empty="true"
                    :close-on-select="true"
                    :clear-on-select="false"
                    :internal-search="true"
                    @open="focusedSelectField = item.field"
                    @close="focusedSelectField = null"
                >
                    <template #option="{ option }">
                        <div class="option-wrapper">
                            <span
                                v-if="item.colorByValue.get(option)"
                                class="option-legend"
                                :style="{
                                    borderBottomColor: item.colorByValue.get(option)
                                }"
                                aria-hidden="true"
                            />
                            <span>{{ option }}</span>
                        </div>
                    </template>
                    <template #tag="{ option, remove }">
                        <span
                            class="multiselect__tag"
                            :style="{
                                backgroundColor: `color-mix(in srgb, ${item.colorByValue.get(option) ?? 'transparent'} 20%, transparent)`,
                                borderColor: item.colorByValue.get(option)
                            }"
                            @mousedown.prevent
                        >
                            <span>{{ option }}</span>
                            <button
                                type="button"
                                class="multiselect__tag-icon"
                                :aria-label="$t('additional:modules.landRegistryFile.tabs.tabSearch.removeSelectedRecord', {record: option})"
                                @click.stop="remove(option)"
                            />
                        </span>
                    </template>
                </Multiselect>

                <span
                    class="multiselect-floating-label"
                    aria-hidden="true"
                >
                    {{ item.fieldName }}
                </span>
            </div>

            <div class="searchTextContainer">
                <InputText
                    id="searchTextField"
                    key="searchTextField"
                    v-model="searchForm.searchText"
                    :class-obj="['form-control' + (errorMessages.searchText.length > 0 ? ' is-invalid': ' is-valid')]"
                    :label="$t('additional:modules.landRegistryFile.tabs.tabSearch.textSearchPlaceholder')"
                    placeholder=""
                    :error-message="errorMessages.searchText"
                />

                <IconButton
                    :class-array="['btn-light', 'textSearchInfoButton']"
                    :aria="$t('additional:modules.landRegistryFile.tabs.tabSearch.textSearchInfo')"
                    icon="bi-info-circle"
                    @click="showTextSearchInfo = true"
                />
            </div>

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
                    />

                    <InputText
                        id="searchYearTo"
                        key="searchYearTo"
                        v-model="searchForm.yearTo"
                        :class-obj="['form-control' + (errorMessages.yearTo.length > 0 ? ' is-invalid': ' is-valid')]"
                        :label="$t('additional:modules.landRegistryFile.tabs.tabSearch.yearToLabel')"
                        placeholder="2024"
                        :error-message="errorMessages.yearTo"
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

            <SwitchInput
                id="idSearchInExtentSwitch"
                class="searchModeSwitch"
                :aria="$t('additional:modules.landRegistryFile.tabs.tabSearch.searchModeSwitchLabel')"
                :label="$t('additional:modules.landRegistryFile.tabs.tabSearch.searchModeSwitchLabel')"
                :checked="searchForm.searchInExtent"
                :interaction="(evt) => searchForm.searchInExtent = evt.target.checked"
            />
        </div>

        <div class="FixedContent buttons-footer">
            <div
                class="search-warning"
            >
                <p v-if="errorMessages.needsExtraFilter.length > 0 && !hasOtherErrorMessage">
                    {{ errorMessages.needsExtraFilter }}
                </p>

                <p v-else-if="showUnsubmittedSearchWarning">
                    {{ $t("additional:modules.landRegistryFile.tabs.tabSearch.unsubmittedSearchWarning") }}
                </p>
            </div>

            <div class="FixedContent">
                <div class="spacer-div" />
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
        padding-top: 1rem;

        div.searchForm {
            gap: 1.5rem;
        }

        div.typeSelectContainer {
            position: relative;

            div.option-wrapper {
                display: flex;
                flex-direction: row;
                gap: 0.5rem;

                span.option-legend {
                    width: 0;
                    height: 0;
                    border-left: 8px solid transparent;
                    border-right: 8px solid transparent;
                    border-bottom: 14px solid transparent;
                    flex: 0 0 auto;
                }
            }

            span.multiselect-floating-label {
                position: absolute;
                top: 0;
                left: 0;
                z-index: 2;
                padding: 0.75rem;
                color: #747474;
                font-size: 1rem;
                text-align: start;
                text-overflow: ellipsis;
                white-space: nowrap;
                pointer-events: none;
                border: var(--bs-border-width) solid transparent;
                transform-origin: 0 0;
                transition: opacity 0.1s ease-in-out, transform 0.1s ease-in-out;
            }

            &.has-selection .multiselect-floating-label,
            :deep(.multiselect:focus-within) + .multiselect-floating-label {
                transform: scale(0.85) translateY(-0.5rem) translateX(0.15rem);
            }

            :deep(.multiselect:focus-within) + .multiselect-floating-label {
                color: $secondary;
                z-index: 51;
            }

            :deep(.multiselect) {
                font-size: 1rem;
                color: var(--bs-body-color);

                .multiselect__input,
                .multiselect__single {
                    font-size: 1rem;
                    line-height: 1.25;
                    margin: 0;
                    padding: 0;
                }

                .multiselect__tags {
                    padding: 1.625rem 2.5rem 0.375rem 0.75rem;
                    border: 1px solid var(--bs-border-color);
                }

                .multiselect__selected,
                .multiselect__option,
                .multiselect__tags,
                .multiselect__tag {
                    color: var(--bs-body-color);
                }

                .multiselect__selected,
                .multiselect__option {
                     &:hover,
                     &.multiselect__option--highlight {
                        color: white;
                    }
                }

                .multiselect__tag {
                    border: 2px solid;
                }

                button.multiselect__tag-icon {
                    border: 0;
                    padding: 0;
                    background: transparent;
                    width: 1.2rem;
                    height: 1.2rem;
                    top: calc(50% - 0.6rem);
                    bottom: auto;
                    line-height: 1.2rem;
                    margin-right: 0.2rem;

                    &::after {
                        color: var(--bs-body-color);
                    }

                    &:hover,
                    &:focus-visible {
                        background-color: #001B3D;

                        &::after {
                            color: white;
                        }
                    }
                }
            }
        }

        div.searchTextContainer {
            display: flex;
            align-items: center;

            div.InputText {
                margin-bottom: 0;
                flex: 1;
            }
        }

        div.searchYearContainer {

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

        div.search-warning p {
            color: var(--bs-form-invalid-color);
            white-space: pre-line;
            text-align: right;
        }

        div.searchModeSwitch > *  {
            cursor: pointer;
        }

        div.spacer-div {
            flex: 1;
        }

        div.FixedContent.buttons-footer {
            flex-direction: column;
        }
    }
</style>
