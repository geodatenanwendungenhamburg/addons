<script>
import DistrictFinderCondition from "./DistrictFinderCondition.vue";
import IconButton from "../../components/IconButton.vue";
import {mapActions, mapGetters} from "vuex";
import DistrictFinderFilterCard from "./DistrictFinderFilterCard.vue";
import DistrictFinderFilterOperator from "./DistrictFinderFilterOperator.vue";

export default {
    name: "DistrictFinderFilter",
    components: {
        DistrictFinderCondition,
        DistrictFinderFilterCard,
        DistrictFinderFilterOperator,
        IconButton
    },
    data () {
        return {
            filterDate: "erstellt: 01.01.1999",
            filterTitle: "Filter",
            numberOfConditions: 1,
            operators: [],
            resultList: [],
            resultNamesArray: []
        };
    },
    computed: {
        ...mapGetters("Language", ["currentLocale"]),
        ...mapGetters("Tools/DistrictSelector", ["selectedDistrictNames"])
    },
    watch: {
        /**
         * Deletes any saved results from conditions that have been removed.
         * @returns {void}
         */
        numberOfConditions () {
            this.resultNamesArray.splice(this.numberOfConditions);
            this.operators.splice(this.numberOfConditions - 1);
        }
    },
    methods: {
        ...mapActions("Tools/DistrictSelector", ["setDistrictsByName"]),

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
        },

        /**
         * Sets the currently found districts as selected districts.
         * @returns {void}
         */
        setDistricts () {
            this.setDistrictsByName({districtNames: this.resultList});
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
         * Sets a new value in the array of operators and triggers new result computation.
         * @param {Number} index - At which index of the array the value is to be updated.
         * @param {String} operatorValue - "or" or "and"
         * @returns {void}
         */
        updateOperator (index, operatorValue) {
            this.operators[index] = operatorValue;
            this.resultList = this.getResultList(this.resultNamesArray, this.operators)
                .filter(e => this.selectedDistrictNames.includes(e));
        }
    }
};
</script>

<template lang="html">
    <div id="district-finder-filter">
        <h4 class="pt-4">
            GebieteScan
        </h4>
        <button
            class="btn btn-outline lh-1 fs-5 mb-3"
        >
            <i class="bi bi-upload pe-2" />
            {{ $t("additional:modules.tools.cosi.districtFinder.button.import") }}
        </button>
        <div class="d-flex align-items-center mb-3">
            <h4 class="filter-title me-auto">
                {{ filterTitle }}
                <br>
                <span class="text-black-50 fs-6">{{ filterDate }}</span>
            </h4>
            <IconButton
                id="reset-button"
                aria="zurücksetzen"
                :class-array="['btn-primary', 'me-3']"
                icon="bi bi-x-circle"
            />
            <IconButton
                id="export-button"
                aria="exportieren"
                :class-array="['btn-primary']"
                icon="bi bi-download"
            />
        </div>
        <DistrictFinderFilterCard class="mx-4" />
        <div
            v-for="conditionId in (numberOfConditions - 1)"
            :key="conditionId"
        >
            <DistrictFinderFilterOperator
                @change="value => updateOperator(conditionId - 1, value)"
            />
            <DistrictFinderFilterCard class="mx-4" />
        </div>
        <div class="d-flex justify-content-center my-3">
            <button
                class="btn btn-link lh-1 fs-5"
                @click="numberOfConditions++"
            >
                <i class="bi bi-plus-circle pe-2" />
                {{ $t("additional:modules.tools.cosi.districtFinder.button.addCondition") }}
            </button>
        </div>
        <button
            class="btn btn-primary lh-1 fs-5"
        >
            <i class="bi bi-check pe-2" />
            {{ $t("additional:modules.tools.cosi.districtFinder.button.confirm") }}
        </button>
        <br>
        <div class="pb-5" />
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
            <DistrictFinderFilterOperator
                @change="value => updateOperator(conditionId - 1, value)"
            />
            <DistrictFinderCondition
                class="border border-primary"
                :condition-id="conditionId"
                @scanCompleted="updateResults"
            />
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
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #district-finder-filter {
        .filter-title {
            font-family: $font_family_accent;
        }

        .btn-outline {
            border-color: $light_blue;
            color: $light_blue;
        }
       .btn-outline:hover {
            cursor: pointer;
            background-color: $light_blue;
            color: $white;
       }
    }

</style>
