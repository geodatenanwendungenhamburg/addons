<script>
import dayjs from "dayjs";
import DistrictFinderFilterCard from "./DistrictFinderFilterCard.vue";
import DistrictFinderFilterExport from "./DistrictFinderFilterExport.vue";
import DistrictFinderFilterOperator from "./DistrictFinderFilterOperator.vue";
import IconButton from "../../components/IconButton.vue";
import {mapActions, mapGetters} from "vuex";
import uniqueId from "../../../../src/utils/uniqueId";

export default {
    name: "DistrictFinderFilter",
    components: {
        DistrictFinderFilterCard,
        DistrictFinderFilterExport,
        DistrictFinderFilterOperator,
        IconButton
    },
    data () {
        return {
            cardList: [{
                districts: [],
                id: uniqueId("card-"),
                operator: "",
                rule: "=",
                ruleTolerance: 0,
                year: false
            }],
            copyValue: false,
            conditionDate: "erstellt: 01.01.1999",
            conditionTitle: this.$t("additional:modules.tools.cosi.districtFinder.conditions"),
            numberOfLimitedAreas: 20,
            resultList: false,
            showExportDialog: false,
            showMoreAreas: false
        };
    },
    computed: {
        ...mapGetters("Language", ["currentLocale"]),
        ...mapGetters("Tools/DistrictSelector", ["selectedDistrictNames", "selectedDistrictLevelId"]),

        /**
         * Gets the districts of all cards.
         * @returns {String[]} The districts.
         */
        allDistricts () {
            return this.cardList.map(card => card.districts);
        },

        /**
         * Gets the operators of all cards.
         * @returns {String[]} The operators.
         */
        allOperators () {
            return this.cardList.map(card => card.operator);
        }
    },
    watch: {
        /**
         * If no conditions exist, resultList is set to false.
         * @returns {void}
         */
        cardList () {
            if (this.cardList.length === 0) {
                this.resultList = false;
            }

        }
    },

    methods: {
        ...mapActions("Tools/DistrictSelector", ["setDistrictsByName"]),

        /**
         * Adds a new card to the list of cards.
         * @returns {void}
         */
        addCard () {
            this.cardList.push({
                districts: [],
                id: uniqueId("card-"),
                operator: "or",
                rule: "=",
                ruleTolerance: 0,
                year: false
            });
        },

        /**
         * Copies all found areas to the clipboard.
         * @param {String} names - all names of the found areas.
         * @returns {void}
         */
        copyToClipboard (names) {
            navigator.clipboard.writeText(names);
            this.copyValue = true;
        },

        /**
         * Deletes a card from the list of cards by the given id.
         * @param {String} cardId - The id of the card to delete.
         * @returns {void}
         */
        deleteCard (cardId) {
            const indexOfCard = this.cardList.findIndex(card => card.id === cardId);

            if (indexOfCard || indexOfCard === 0) {
                this.cardList.splice(indexOfCard, 1);
                this.updateResultList(this.allDistricts, this.allOperators);
            }
        },

        /**
         * Exports the conditions as JSON.
         * @param {String} name - The file name.
         * @param {Boolean} withAreas - A flag to controls whether the districts should be exported.
         * @returns {void}
         */
        exportConditions (name, withAreas) {
            const date = dayjs(new Date()).format("YYYY-MM-DD"),
                data = this.getExportedData(name, date, withAreas, this.cardList),
                filename = name + "-" + date + ".json",
                jsonStr = JSON.stringify(data),
                element = document.createElement("a");

            element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(jsonStr));
            element.setAttribute("download", filename);

            element.style.display = "none";
            document.body.appendChild(element);

            element.click();

            document.body.removeChild(element);
        },


        /**
         * Gets all area results separated by commas.
         * @returns {String} The results.
         */
        getCommaSeparatedAreaNames () {
            if (this.resultList.length > this.numberOfLimitedAreas && !this.showMoreAreas) {
                const limitedAreas = this.resultList.slice(0, this.numberOfLimitedAreas);

                return limitedAreas.join(", ");
            }
            return this.resultList.join(", ");
        },

        /**
         * Gets the exported data
         * @param {String} name - The name of the conditions.
         * @param {String} date - The creation date of the conditions.
         * @param {Boolean} withAreas - A flag to controls whether the districts should be exported.
         * @param {Object[]} conditionList - A list of the conditions.
         * @returns {Object} the exported data
         */
        getExportedData (name, date, withAreas, conditionList) {
            const selectedDistrictNames = withAreas ? this.selectedDistrictNames : [],
                data = {
                    meta: {
                        name,
                        date
                    },
                    districtSelector: {
                        selectedDistrictLevelId: this.selectedDistrictLevelId,
                        selectedDistrictNames
                    },
                    data: conditionList
                };

            return data;
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
                !Array.isArray(operators)
            ) {
                return [];
            }

            const remainingArrays = [...arrayOfArrays],
                remainingOperators = [...operators];

            remainingOperators.splice(0, 1);

            while (remainingOperators.includes("and")) {
                const indexOfAnd = remainingOperators.indexOf("and");

                remainingArrays[indexOfAnd] = remainingArrays[indexOfAnd]?.filter(e => remainingArrays[indexOfAnd + 1].includes(e)) || [];
                remainingArrays.splice(indexOfAnd + 1, 1);
                remainingOperators.splice(indexOfAnd, 1);
            }

            return [...new Set(remainingArrays.flat())];
        },

        /**
         * Sets the values for the card.
         * @param {String} cardId - The id of the card.
         * @param {String[]} names - The Names of the district names.
         * @param {Number} year - The year of the card.
         * @param {String} category - The category of the card.
         * @param {Number} referenceValue - The referenceValue of the card.
         * @param {Number} tolerance - The tolerance of the card.
         * @param {String} rule - The rule of the card.
         * @returns {void}
         */
        setCardAttributes (cardId, names, year, category, referenceValue, tolerance, rule) {
            const foundCard = this.cardList.find(card => card.id === cardId);

            if (foundCard) {
                foundCard.districts = names;
                foundCard.year = year;
                foundCard.statisticCategory = category;
                foundCard.referenceValue = referenceValue;
                foundCard.ruleTolerance = tolerance;
                foundCard.rule = rule;
                this.updateResultList(this.allDistricts, this.allOperators);
            }
        },

        /**
         * Sets the value of an operator on a card.
         * @param {String} cardId - The id of the card.
         * @param {String} operatorValue - The value ("or" or "and") to set.
         * @returns {void}
         */
        setCardOperator (cardId, operatorValue) {
            const foundCard = this.cardList.find(card => card.id === cardId);

            if (foundCard) {
                foundCard.operator = operatorValue;
                this.updateResultList(this.allDistricts, this.allOperators);
            }
        },

        /**
         * Sets the currently found districts as selected districts.
         * @returns {void}
         */
        setDistricts () {
            this.setDistrictsByName({districtNames: this.resultList});
        },

        /**
         * Update the result list.
         * @param {String[]} districts - The districts of all cards.
         * @param {String[]} operators - The operators of all cards.
         * @returns {void}
         */
        updateResultList (districts, operators) {
            this.resultList = this.getResultList(districts, operators)
                .filter(e => this.selectedDistrictNames.includes(e));
        }
    }
};
</script>

<template lang="html">
    <div id="district-finder-filter">
        <h4 class="pt-4">
            {{ $t("additional:modules.tools.cosi.districtFinder.newScreening") }}
        </h4>
        <button
            class="btn btn-outline lh-1 fs-5 mb-3"
        >
            <i class="bi bi-upload pe-2" />
            {{ $t("additional:modules.tools.cosi.districtFinder.button.import") }}
        </button>
        <div class="d-flex align-items-center mb-3">
            <h4 class="filter-title me-auto">
                {{ conditionTitle }}
                <br>
                <span class="text-black-50 fs-6">{{ conditionDate }}</span>
            </h4>
            <IconButton
                id="reset-button"
                aria="zurücksetzen"
                :class-array="['btn-primary', 'me-3']"
                icon="bi bi-x-circle"
            />
            <div class="dropdown">
                <IconButton
                    id="export-button"
                    aria="exportieren"
                    class="dropdwon-toggle"
                    :class-array="['btn-primary']"
                    icon="bi bi-download"
                    data-bs-toggle="dropdown"
                    data-bs-auto-close="outside"
                    :disabled="resultList === false"
                />
                <DistrictFinderFilterExport
                    v-show="resultList !== false"
                    @exportConditions="exportConditions"
                />
            </div>
        </div>
        <transition-group name="slide-fade">
            <div
                v-for="(card, index) in cardList"
                :key="card.id"
                class="list-item"
            >
                <DistrictFinderFilterOperator
                    v-if="index !== 0"
                    :id="card.id"
                    @change="setCardOperator"
                />
                <DistrictFinderFilterCard
                    :id="card.id"
                    :card-number="index + 1"
                    :year="card.year"
                    :rule="card.rule"
                    :rule-tolerance="card.tolerance"
                    :statistic-category="card.category"
                    class="mx-4"
                    @delete="deleteCard"
                    @scanCompleted="setCardAttributes"
                />
            </div>
        </transition-group>
        <div class="d-flex justify-content-center my-3">
            <button
                class="btn btn-link lh-1 fs-5"
                @click="addCard"
            >
                <i class="bi bi-plus-circle pe-2" />
                {{ $t("additional:modules.tools.cosi.districtFinder.button.addCondition") }}
            </button>
        </div>
        <div
            v-if="resultList"
            class="found-areas mx-4"
        >
            <h5 class="result-headline">
                {{ resultList.length }} {{ resultList.length === 1 ? $t("additional:modules.tools.cosi.districtFinder.foundArea") : $t("additional:modules.tools.cosi.districtFinder.foundAreas") }}
            </h5>
            <template v-if="resultList.length > 0">
                <span> Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor.</span>
                <div class="copy-box mb-4 container rounded">
                    <div class="row">
                        <div class="col col-11 pe-0">
                            {{ getCommaSeparatedAreaNames() }}
                            <button
                                v-if="resultList.length > numberOfLimitedAreas"
                                class="btn btn-link lh-1 fs-6 ps-0"
                                @click="showMoreAreas = !showMoreAreas"
                            >
                                {{ showMoreAreas ? $t("additional:modules.tools.cosi.districtFinder.button.showLess") : $t("additional:modules.tools.cosi.districtFinder.button.showMore") }}
                            </button>
                        </div>
                        <div class="col col-1 text-end ps-0">
                            <v-snackbar
                                v-model="copyValue"
                                :timeout="5000"
                            >
                                {{ $t("additional:modules.tools.cosi.districtFinder.copyClipboard") }}
                            </v-snackbar>
                            <button
                                class="copy-button btn btn-link lh-1 fs-5 p-0"
                                @click="copyToClipboard (resultList.join(', '))"
                            >
                                <i
                                    class="copy-icon"
                                    :class="copyValue ? 'bi bi-check2-all' : 'bi bi-back'"
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </template>
        </div>
        <button
            class="btn btn-primary lh-1 fs-5"
            :disabled="resultList === false || resultList.length === 0"
            @click="setDistricts"
        >
            <i class="bi bi-check pe-2" />
            {{ $t("additional:modules.tools.cosi.districtFinder.button.confirm") }}
        </button>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #district-finder-filter {
        .filter-title {
            font-family: $font_family_accent;
        }

        #export-dialog {
            min-width: 250px;
        }

        .result-headline {
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

        .slide-fade-enter-active, .slide-fade-leave-active {
            transition: all 1s;
        }
        .slide-fade-enter, .slide-fade-leave-to /* .list-leave-active below version 2.1.8 */ {
            opacity: 0;
            transform: translateX(80px);
        }
       .copy-box {
            background-color: #dcdcdc;
            .copy-icon {
                font-size: 16px;
            }
       }
    }

</style>
