<script>
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import SpinnerItem from "@shared/modules/spinner/components/SpinnerItem.vue";
import {TAB_SET_CURRENT} from "./shared/TabContainer.vue";

import {mapGetters, mapActions, mapMutations} from "vuex";

export default {
    name: "TabSearch",
    components: {
        FlatButton,
        InputText,
        SpinnerItem
    },
    inject: {
        setCurrentTab: {from: TAB_SET_CURRENT, default: null}
    },
    data () {
        return {
            activeContent: "searchOptionsList",
            selectedArchiv: "",
            searchWithAttributeFormData: {},
            archives: {},
            showSpinner: false,
            isAttributeSearchFormValid: true,
            selectedArchivIds: [],
            selectedYears: [],
            showNoCommonYearError: false
        };
    },
    computed: {
        ...mapGetters("Modules/LzsResearchClient", [
            "dataClassList",
            "placeholderDataClassList",
            "yearsList",
            "archiveList"
        ])
    },
    watch: {
        yearsList (newValue) {
            if (newValue) {
                this.showNoCommonYearError = this.selectedArchivIds.length > 0 && this.yearsList?.length === 0;
            }
        },
        selectedArchiv (newValue) {
            if (newValue) {
                this.validateSearchWithAttributeForm();
            }
        }
    },
    async mounted () {
        await this.fetchDataClassList();
        await this.fetchPlaceholders();

        this.initializeSearchForm();
    },
    methods: {
        ...mapActions("Modules/LzsResearchClient", [
            "fetchDataClassList",
            "searchByAttribute",
            "fetchPlaceholders",
            "fetchYears"
        ]),
        ...mapMutations("Modules/LzsResearchClient", [
            "setYearsList"
        ]),
        /**
         * Update the active content section to the given `contentId`.
         * @param {string} contentId - The id of the content to activate.
         */
        changeSearchContent (contentId) {
            this.activeContent = contentId;
        },
        /**
         * Set the selected archive identifier.
         * @param {string} archiv - The archive name to select.
         */
        setSelectedArchiv (archiv) {
            this.selectedArchiv = archiv;
        },
        /**
         * Initialize archive and form data structures from `dataClassList`.
         */
        initializeSearchForm () {
            const formData = {},
                archives = {};

            this.dataClassList?.forEach(element => {
                const archivName = element.name,
                    attributes = element.highestActiveDataclassVersion.dataclassAttributs
                        .filter(attribute => attribute.usage === "I")
                        .map(attribute => ({
                            ...attribute,
                            value: this.placeholderDataClassList?.[archivName]?.[attribute.name].PLACEHOLDER || "",
                            placeholder: this.placeholderDataClassList?.[archivName]?.[attribute.name].PLACEHOLDER || "",
                            label: this.$t(`additional:modules.lzsResearchClient.tabs.tabSearch.${attribute.name.toLowerCase()}`),
                            pattern: this.placeholderDataClassList?.[archivName]?.[attribute.name].PATTERN || "",
                            errorMessage: ""
                        }));

                formData[archivName] = [
                    ...attributes,
                    {
                        name: "maxValueCount",
                        value: "10",
                        label: this.$t("additional:modules.lzsResearchClient.tabs.tabSearch.maxValueCount"),
                        pattern: "[0-9]{1,4}",
                        placeholder: "10",
                        errorMessage: ""
                    }
                ];

                archives[element.name] = element.id;
            });

            this.searchWithAttributeFormData = formData;
            this.archives = archives;
            this.setSelectedArchiv(this.dataClassList[0]?.name);
        },
        /**
         * Build a search payload from the form data, show a spinner and perform the search.
         * After search, switch to the result tab.
         */
        async searchWithAttribute () {
            if (!this.isAttributeSearchFormValid) {
                return;
            }

            const payload = {
                dataclassIds: [this.archives[this.selectedArchiv]],
                maxvaluecount: "",
                fachattribute: []
            };

            this.searchWithAttributeFormData[this.selectedArchiv].forEach(formItem => {
                if (formItem.usage === "I") {
                    payload.fachattribute.push({
                        id: formItem.name.toUpperCase(),
                        value: formItem.value, type: formItem.usage
                    });
                }

                if (formItem.name === "maxValueCount") {
                    payload.maxvaluecount = formItem.value;
                }
            });

            this.showSpinner = true;

            await this.searchByAttribute(payload);

            this.showSpinner = false;

            this.setCurrentTab("tabResult");
        },
        /**
         * Validate form fields against their patterns and set error messages accordingly.
         */
        validateSearchWithAttributeForm () {
            const attributes = this.searchWithAttributeFormData[this.selectedArchiv];

            this.isAttributeSearchFormValid = true;

            attributes.forEach(attribute => {
                attribute.errorMessage = "";

                if (attribute.pattern && attribute.value !== null && String(attribute.value) !== "") {
                    const regex = new RegExp(`^${attribute.pattern}$`);

                    if (!regex.test(String(attribute.value))) {
                        attribute.errorMessage = this.$t("additional:modules.lzsResearchClient.tabs.tabSearch.patternError",
                            {digitNumber: attribute.placeholder.length}
                        );
                        this.isAttributeSearchFormValid = false;
                    }
                }
            });
        },
        /**
         * Reset the form to its initial state and run validation.
         */
        resetForm () {
            this.initializeSearchForm();
            this.validateSearchWithAttributeForm();
        },
        async onSelectedArchivIdsChange (archiveId, event) {
            const checked = event.target.checked;

            if (checked) {
                if (!this.selectedArchivIds.includes(archiveId)) {
                    this.selectedArchivIds = [...this.selectedArchivIds, archiveId];
                }
            }
            else {
                this.selectedArchivIds = this.selectedArchivIds.filter(id => id !== archiveId);
            }

            if (this.selectedArchivIds.length > 0) {
                await this.fetchYears(this.selectedArchivIds);

                this.selectedYears = this.selectedYears.filter(y => this.yearsList.includes(y));
            }
            else {
                this.setYearsList([]);
                this.selectedYears = [];
            }
        },
        onSelectedYearsChange (year, event) {
            const checked = event.target.checked;

            if (checked) {
                if (!this.selectedYears.includes(year)) {
                    this.selectedYears = [...this.selectedYears, year];
                }
            }
            else {
                this.selectedYears = this.selectedYears.filter(y => y !== year);
            }
        }
    }
};
</script>

<template>
    <div id="TabSearch">
        <transition
            name="slide"
            mode="out-in"
        >
            <ul
                v-if="activeContent === 'searchOptionsList'"
                id="searchOptionsList"
                class="list-group"
            >
                <li
                    class="list-group-item d-flex justify-content-between align-items-center"
                    role="button"
                    tabindex="0"
                    @click="changeSearchContent('searchFormWithAttributes')"
                    @keydown.enter="changeSearchContent('searchFormWithAttributes')"
                >
                    {{ $t('additional:modules.lzsResearchClient.tabs.tabSearch.searchWithAttributeHeading') }}

                    <i class="bi bi-arrow-right-circle" />
                </li>

                <li
                    class="list-group-item d-flex justify-content-between align-items-center"
                    role="button"
                    tabindex="0"
                    @click="changeSearchContent('searchFormWithGeometry')"
                    @keydown.enter="changeSearchContent('searchFormWithGeometry')"
                >
                    {{ $t("additional:modules.lzsResearchClient.tabs.tabSearch.searchWithGeometryHeading") }}

                    <i class="bi bi-arrow-right-circle" />
                </li>
            </ul>

            <div
                v-else
                id="searchAttributes"
                class="searchAttributes"
            >
                <div
                    v-if="showSpinner"
                    class="loadingSpinner"
                >
                    <SpinnerItem
                        custom-class="spinner"
                        class="ms-3"
                    />
                </div>

                <div v-else>
                    <div
                        v-if="activeContent === 'searchFormWithAttributes'"
                        id="searchFormWithAttributes"
                        class="searchFormWithAttributes"
                    >
                        <label for="archiv">
                            {{ $t("additional:modules.lzsResearchClient.tabs.tabSearch.selectArchivLabel") }}
                        </label>

                        <select
                            id="archiv"
                            class="form-select archiv"
                            :value="selectedArchiv"
                            @change="setSelectedArchiv($event.target.value)"
                        >
                            <option
                                v-for="(_, name) in searchWithAttributeFormData"
                                :key="name"
                                :value="name"
                            >
                                {{ name }}
                            </option>
                        </select>

                        <div class="searchWithAttributeForm">
                            <InputText
                                v-for="attribute in searchWithAttributeFormData[selectedArchiv]"
                                :id="attribute.name"
                                :key="attribute.name"
                                v-model="attribute.value"
                                :class-obj="['form-control' + (attribute.errorMessage.length > 0 ? ' is-invalid': ' is-valid')]"
                                :label="attribute.name"
                                :placeholder="attribute.placeholder"
                                :error-message="attribute.errorMessage"
                                @input="validateSearchWithAttributeForm()"
                            />
                        </div>
                    </div>

                    <div
                        v-if="activeContent === 'searchFormWithGeometry'"
                        id="searchFormWithGeometry"
                        class="searchFormWithGeometry"
                    >
                        <div class="archiveSelection">
                            <span>
                                {{ $t('additional:modules.lzsResearchClient.tabs.tabSearch.selectArchivLabel') }}
                            </span>

                            <div
                                class="archiveSelectionList"
                                role="group"
                                aria-label="archives"
                            >
                                <div
                                    v-for="archive in archiveList"
                                    :key="archive.id"
                                    class="archiveCheckboxList"
                                >
                                    <input
                                        :id="`archiveCheckbox-${archive.id}`"
                                        type="checkbox"
                                        :value="archive.id"
                                        :checked="selectedArchivIds.includes(archive.id)"
                                        @change="onSelectedArchivIdsChange(archive.id, $event)"
                                    >

                                    <label :for="`archiveCheckbox-${archive.id}`">
                                        {{ archive.name }}
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div class="yearsSelection">
                            <span>
                                {{ $t('additional:modules.lzsResearchClient.tabs.tabSearch.selectYearsLabel') }}
                            </span>

                            <div
                                class="yearsSelectionList"
                                role="group"
                                aria-label="years"
                            >
                                <div
                                    v-for="year in yearsList"
                                    :key="year"
                                    class="yearCheckboxItem"
                                >
                                    <input
                                        :id="`yearCheckbox-${year}`"
                                        type="checkbox"
                                        :value="year"
                                        :checked="selectedYears.includes(year)"
                                        @change="onSelectedYearsChange(year, $event)"
                                    >

                                    <label :for="`yearCheckbox-${year}`">{{ year }}</label>
                                </div>
                            </div>
                        </div>

                        <div
                            v-if="showNoCommonYearError"
                            class="noCommonYearError"
                        >
                            {{ $t('additional:modules.lzsResearchClient.tabs.tabSearch.noCommonYearErrorMessage') }}
                        </div>
                    </div>

                    <div class="searchButtons">
                        <FlatButton
                            :aria-label="$t('additional:modules.lzsResearchClient.tabs.tabSearch.dossiersButtonLabel')"
                            :text="$t('additional:modules.lzsResearchClient.tabs.tabSearch.dossiersButtonLabel')"
                        />

                        <FlatButton
                            id="backButton"
                            :aria-label="$t('additional:modules.lzsResearchClient.tabs.tabSearch.backButtonLabel')"
                            :text="$t('additional:modules.lzsResearchClient.tabs.tabSearch.backButtonLabel')"
                            @click="changeSearchContent('searchOptionsList')"
                        />

                        <FlatButton
                            :aria-label="$t('additional:modules.lzsResearchClient.tabs.tabSearch.searchButtonLabel')"
                            :text="$t('additional:modules.lzsResearchClient.tabs.tabSearch.searchButtonLabel')"
                            :disabled="!isAttributeSearchFormValid"
                            @click="searchWithAttribute()"
                        />

                        <FlatButton
                            :aria-label="$t('additional:modules.lzsResearchClient.tabs.tabSearch.resetButtonLabel')"
                            :text="$t('additional:modules.lzsResearchClient.tabs.tabSearch.resetButtonLabel')"
                            @click="resetForm()"
                        />
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #TabSearch {
        padding: 1rem 0.5rem;
        position: relative;
        height: 100%;

        // Transition classes - START
        .slide-enter-active,
        .slide-leave-active {
            transition: all 0.2s ease-in-out;
        }

        .slide-enter-from {
            opacity: 0;
            transform: translateX(-6rem);
        }

        .slide-leave-to {
            opacity: 0;
            transform: translateX(6rem);
        }
        // Transition classes - END

        div.searchAttributes {
            height: 100%;

            div.searchFormWithAttributes {
                select.archiv {
                    margin-bottom: 1rem;
                }
            }

            div.loadingSpinner {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                gap: 2rem;
                align-items: center;
                justify-content: center;
                background: rgba(255,255,255,0.7);
                z-index: 2;

                div.spinner {
                    width: 4rem;
                    height: 4rem;
                }

                p {
                    background-color: white;
                    white-space: pre-line;
                    padding: 1.5rem;
                }
            }

            div.searchFormWithAttributes {
                select.archiv {
                    margin-bottom: 1rem;
                }
            }

            div.searchFormWithGeometry {
                .archiveSelectionList {
                    max-height: 12.5rem;
                    overflow-y: auto;
                    border: 0.0625rem solid rgba(0,0,0,0.1);
                    padding: 0.5rem;
                    margin: 0.5rem 0 1rem 0;
                }

                .archiveCheckboxList {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    white-space: nowrap;
                }
                .yearsSelection {
                    .yearsSelectionList {
                        min-height: 6.25rem;
                        max-height: 12.5rem;
                        overflow-y: auto;
                        border: 0.0625rem solid rgba(0,0,0,0.1);
                        padding: 0.5rem;
                        margin: 0.5rem 0 1rem 0;
                    }

                    .yearCheckboxItem {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        white-space: nowrap;
                    }
                }
                div.noCommonYearError {
                    color: $light_red;
                }
            }
            div.searchButtons {
                display: flex;
                gap: 0.5rem;
                margin-top: 1rem;

                *:nth-child(2) {
                    margin-left: auto;
                }
            }
        }
    }
</style>
