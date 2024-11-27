<script>
import Tool from "../../../../src/modules/tools/ToolTemplate.vue";
import DistrictSelectorLevel from "../../DistrictSelector/components/DistrictSelectorLevel.vue";
import DistrictSelectorFilter from "../../DistrictSelector/components/DistrictSelectorFilter.vue";
import {getComponent} from "../../../../src/utils/getComponent";
import {mapGetters, mapActions, mapMutations} from "vuex";
import getters from "../store/gettersDistrictFinder";
import mutations from "../store/mutationsDistrictFinder";
import actions from "../store/actionsDistrictFinder";
import {styleSelectedDistrictLevels} from "../../DistrictSelector/utils/styleSelectedDistrictLevels";
import DistrictFinderCondition from "./DistrictFinderCondition.vue";
import ContentCard from "../../components/ContentCard.vue";
import DistrictFinderOperator from "./DistrictFinderOperator.vue";

export default {
    name: "DistrictFinder",
    components: {
        Tool,
        DistrictSelectorLevel,
        DistrictSelectorFilter,
        DistrictFinderCondition,
        ContentCard,
        DistrictFinderOperator
    },
    data () {
        return {
            numberOfConditions: 1,
            resultNamesArray: [],
            resultList: [],
            dataChips: ["Fachdaten", "statistische Daten"],
            selectedData: "statistische Daten",
            years: ["2017", "2018", "2019", "2020", "2021", "2022"],
            selectedYear: "2022",
            filterRules: ["gleich", "kleiner als", "größer als"],
            selectedFilter: "gleich",
            datasetStat: ["Beispiel1", "Beispiel2", "Beispiel3", "Beispiel4"],
            datasetFachdaten: ["Beispiel5", "Beispiel6", "Beispiel7", "Beispiel8"],
            selectedDataset: null,
            minimum: 0,
            maximum: 6340,
            meanValue: 2000,
            type: "absolut",
            expandDataInfo: true,
            operators: []
        };
    },
    computed: {
        ...mapGetters("Language", ["currentLocale"]),
        ...mapGetters("Tools/DistrictFinder", Object.keys(getters)),
        ...mapGetters("Tools/DistrictSelector", [
            "districtLevels",
            "selectedDistrictLevelId",
            "selectedDistrictLevel",
            "selectedDistrictNames"
        ])
    },
    watch: {
        /**
         * Unselect the Menu item if the tool is deactivated
         * @param {boolean} state - Defines if the tool is active.
         * @returns {void}
         */
        active (state) {
            if (!state) {
                const model = getComponent(this.id);

                if (model) {
                    model.set("isActive", false);
                }
            }
            else {
                styleSelectedDistrictLevels(this.districtLevels, this.selectedDistrictLevelId, this.selectedDistrictLevel.activeStyle);
            }
        },

        /**
         * Deletes any saved results from conditions that have been removed.
         * @returns {void}
         */
        numberOfConditions () {
            this.resultNamesArray.splice(this.numberOfConditions);
            this.operators.splice(this.numberOfConditions - 1);
        }
    },
    created () {
        /**
         * listens to the close event of the Tool Component
         * @listens #close
         */
        this.$on("close", () => {
            this.setActive(false);
        });
    },
    methods: {
        ...mapMutations("Tools/DistrictFinder", Object.keys(mutations)),
        ...mapActions("Tools/DistrictFinder", Object.keys(actions)),
        ...mapMutations("Tools/DistrictSelector", ["setSelectedDistrictLevelId"]),
        ...mapActions("Tools/DistrictSelector", ["setDistrictsByName"]),

        /**
         * Emits the root event 'updateSelectedDistricts' with the given districts names.
         * @param {String[]} districtsNames - Names of the districts to be selected.
         * @returns {void}
         */
        emitSelectedDistricts (districtsNames) {
            this.$root.$emit("updateSelectedDistricts", districtsNames);
        },

        /**
         * Updates the resulting district names when a conditions has been updated.
         * @param {Number} conditionId - The id of the condition that is sending new results.
         * @param {String[]} resultNames - The district names that have been found by the condition.
         * @returns {void}
         */
        updateResults (conditionId, resultNames) {
            this.resultNamesArray[conditionId] = resultNames;
            this.resultList = this.getResultList(this.resultNamesArray, this.operators)
                .filter(e => this.selectedDistrictNames.includes(e));
        },

        /**
         * Sets the currently found districts as selected districts.
         * @returns {void}
         */
        setDistricts () {
            this.setSelectedDistrictLevelId(this.selectedDistrictLevel.layerId);
            this.setDistrictsByName({districtNames: this.resultList});
        },

        /**
         * Sets a new value in the array of operators and triggers new result computation.
         * @param {Number} index - At which index of the array the value is to be updated.
         * @param {String} operatorValue - "or" or "and"
         * @returns {void}
         */
        updateOperator (index, operatorValue) {
            this.operators[index] = operatorValue;
            this.resultList = this.getResultList(this.resultNamesArray, this.operators)
                .filter(e => this.selectedDistrictNames.includes(e));
        },

        /**
         * Gets the list of final results after applying the logical operators on the array of results.
         * @param {String[[]]} arrayOfArrays - An array of string arrays.
         * @param {String[]} operators - An array of logical operators.
         * @returns {String[]} A flat array containing the final result list.
         */
        getResultList (arrayOfArrays, operators) {
            if (
                !Array.isArray(arrayOfArrays) ||
                arrayOfArrays.length === 0 ||
                arrayOfArrays.some(e => !Array.isArray(e)) ||
                !Array.isArray(operators)
            ) {
                return [];
            }

            const remainingArrays = [...arrayOfArrays],
                remainingOperators = [...operators];

            remainingOperators.splice(arrayOfArrays.length - 1);

            while (remainingOperators.includes("and")) {
                const indexOfAnd = remainingOperators.indexOf("and");

                remainingArrays[indexOfAnd] = remainingArrays[indexOfAnd].filter(e => remainingArrays[indexOfAnd + 1].includes(e));
                remainingArrays.splice(indexOfAnd + 1, 1);
                remainingOperators.splice(indexOfAnd, 1);
            }

            return [...new Set(remainingArrays.flat())];
        }
    }
};
</script>

<template lang="html">
    <Tool
        ref="tool"
        :title="$t('additional:modules.tools.cosi.districtFinder.title')"
        :icon="icon"
        :active="active"
        :render-to-window="renderToWindow"
        :resizable-window="resizableWindow"
        :deactivate-gfi="deactivateGFI"
        :initial-width="600"
    >
        <template
            v-if="active"
            #toolBody
        >
            <div
                id="district-finder"
                class="container"
            >
                <DistrictSelectorLevel
                    :district-levels="districtLevels"
                    :selected-level-id="selectedDistrictLevelId"
                    @setSelectedDistrictLevelId="setSelectedDistrictLevelId"
                />
                <DistrictSelectorFilter
                    :district-levels="districtLevels"
                    :selected-level-id="selectedDistrictLevelId"
                    @updateSelectedDistricts="emitSelectedDistricts"
                />
                <div class="pt-5" />
                <h4 class="pt-4">
                    GebieteScan
                </h4>
                <div
                    class="border border-primary"
                >
                    <DistrictFinderCondition
                        :condition-id="0"
                        @scanCompleted="updateResults"
                    />
                </div>
                <div
                    v-for="conditionId in (numberOfConditions - 1)"
                    :key="conditionId"
                >
                    <DistrictFinderOperator
                        @change="value => updateOperator(conditionId - 1, value)"
                    />
                    <DistrictFinderCondition
                        class="border border-primary"
                        :condition-id="conditionId"
                        @scanCompleted="updateResults"
                    />
                </div>
                <div class="d-flex justify-content-center mt-1">
                    <button
                        class="btn btn-link"
                        plain
                        @click="numberOfConditions++"
                    >
                        <i class="bi bi-plus-circle" />
                        Bedingung hinzufügen
                    </button>
                </div>
                <ul>
                    <li
                        v-for="resultName in resultList"
                        :key="resultName"
                    >
                        {{ resultName }}
                    </li>
                </ul>
                <hr>
                <button @click="setDistricts">
                    Hier klicken, um gefundene Gebiete als Gebietsauswahl zu setzen
                </button>
                <div class="pt-5" />
                <ContentCard
                    id="id"
                    close-icon="bi bi-trash"
                >
                    <template #header>
                        <div
                            class="pt-2 ps-2"
                        >
                            <v-chip-group
                                v-model="selectedData"
                                mandatory
                            >
                                <v-chip
                                    v-for="(data, id) in dataChips"
                                    :key="id"
                                    :value="data"
                                    :stat-color="data === 'statistische Daten'"
                                    :fachdata-color="data === 'Fachdaten'"
                                    x-small
                                >
                                    {{ data }}
                                </v-chip>
                            </v-chip-group>
                        </div>
                    </template>
                    <template #body>
                        <div class="container px-2 py-1">
                            <div class="row">
                                <h4 class="d-flex align-items-center col-md-9 py-0 pb-0 pt-3">
                                    1. {{ $t('additional:modules.tools.cosi.districtFinder.condition') }}
                                </h4>
                                <div
                                    v-if="selectedDataset !== null && selectedData === 'statistische Daten'"
                                    class="col-md-3 p-0"
                                >
                                    <v-label
                                        class="text-black-50"
                                        for="year-filter"
                                    >
                                        {{ $t('additional:modules.tools.cosi.districtFinder.label.year') }}
                                    </v-label>
                                    <v-select
                                        class="year-filter"
                                        :items="years"
                                        :value="selectedYear"
                                        outlined
                                        hide-details
                                        dense
                                    />
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-12 p-0">
                                    <v-label
                                        for="data-filter"
                                    >
                                        {{ $t('additional:modules.tools.cosi.districtFinder.label.dataset') }}
                                    </v-label>
                                    <v-select
                                        v-model="selectedDataset"
                                        class="data-filter"
                                        :items="selectedData === 'statistische Daten' ? datasetStat : datasetFachdaten"
                                        outlined
                                        hide-details
                                        dense
                                    />
                                </div>
                            </div>
                            <div
                                v-if="selectedDataset !== null"
                                class="row gy-0 pt-0"
                            >
                                <div class="col-md-3 me-5 px-0 pt-1 pb-0">
                                    <v-label
                                        class="filter-label"
                                        for="reference-filter"
                                    >
                                        {{ $t('additional:modules.tools.cosi.districtFinder.label.referenceValue') }}
                                    </v-label>
                                    <v-text-field
                                        class="reference-filter"
                                        outlined
                                        hide-details
                                        dense
                                        type="number"
                                    />
                                </div>
                                <div class="col-md-4 me-1 px-0 pt-1 pb-0">
                                    <v-label
                                        class="filter-label"
                                        for="filter-rule"
                                    >
                                        {{ $t('additional:modules.tools.cosi.districtFinder.label.rule') }}
                                    </v-label>
                                    <v-select
                                        v-model="selectedFilter"
                                        class="filter-rule"
                                        :items="filterRules"
                                        outlined
                                        hide-details
                                        dense
                                    />
                                </div>
                                <div
                                    v-if="selectedFilter === 'gleich'"
                                    class="col-md-3 px-0 pt-1 pb-0"
                                >
                                    <v-label
                                        class="filter-label"
                                        for="tolerance"
                                    >
                                        {{ $t('additional:modules.tools.cosi.districtFinder.label.tolerance') }}
                                    </v-label>
                                    <v-text-field
                                        class="tolerance"
                                        outlined
                                        hide-details
                                        dense
                                        type="number"
                                    />
                                </div>
                            </div>
                            <div
                                v-if="selectedDataset !== null"
                                class="p-0 d-md-flex justify-content-md-end"
                            >
                                <button
                                    id="details-button"
                                    type="button"
                                    class="btn btn-link btn-sm pt-3 pb-0"
                                    @click="expandDataInfo = !expandDataInfo"
                                >
                                    <i
                                        class="expand me-1"
                                        :class="!expandDataInfo ? 'bi bi-chevron-down' : 'bi bi-chevron-up'"
                                    />
                                    {{ !expandDataInfo ? $t('additional:modules.tools.cosi.districtFinder.showDetails') : $t('additional:modules.tools.cosi.districtFinder.hideDetails') }}
                                </button>
                            </div>
                            <div
                                v-if="selectedDataset !== null && expandDataInfo"
                            >
                                <hr class="px-0 mx-0">
                                <div class="row">
                                    <div class="col-3 pb-0">
                                        <p class="text-center">
                                            {{ $t('additional:modules.tools.cosi.districtFinder.label.minimum') }}
                                        </p>
                                        <p class="info-value text-center">
                                            {{ minimum }}
                                        </p>
                                    </div>
                                    <div class="col-3 pb-0">
                                        <p class="text-center">
                                            {{ $t('additional:modules.tools.cosi.districtFinder.label.meanValue') }}
                                        </p>
                                        <p class="info-value text-center">
                                            {{ meanValue }}
                                        </p>
                                    </div>
                                    <div class="col-3 pb-0">
                                        <p class="text-center">
                                            {{ $t('additional:modules.tools.cosi.districtFinder.label.maximum') }}
                                        </p>
                                        <p class="info-value text-center">
                                            {{ maximum }}
                                        </p>
                                    </div>
                                    <div class="col-3 pb-0">
                                        <p class="text-center">
                                            {{ $t('additional:modules.tools.cosi.districtFinder.label.type') }}
                                        </p>
                                        <p class="info-value text-center">
                                            {{ type }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </ContentCard>
            </div>
        </template>
    </Tool>
</template>

<style lang="scss" scoped>
@import "~variables";

.info-value {
    font-size: 16px;
    font-family: $font_family_accent;
}
.v-label {
    font-size: 11px;
}

</style>

<style lang="scss">
    @import "~variables";

.v-text-field.v-text-field--enclosed .v-text-field__details {
    margin-bottom: 0px;
}
.v-chip[stat-color='true'] {
    background-color: #D6ECFF;
}
.v-chip[fachdata-color='true'] {
    background-color: #ffcb9f;
}

</style>
