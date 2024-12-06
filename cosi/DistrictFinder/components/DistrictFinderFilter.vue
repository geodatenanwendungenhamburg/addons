<script>
import DistrictFinderFilterCard from "./DistrictFinderFilterCard.vue";
import DistrictFinderFilterOperator from "./DistrictFinderFilterOperator.vue";
import IconButton from "../../components/IconButton.vue";
import {mapActions, mapGetters} from "vuex";
import uniqueId from "../../../../src/utils/uniqueId";

export default {
    name: "DistrictFinderFilter",
    components: {
        DistrictFinderFilterCard,
        DistrictFinderFilterOperator,
        IconButton
    },
    data () {
        return {
            cardList: [{
                id: uniqueId("card-"),
                operator: "",
                results: []
            }],
            filterDate: "erstellt: 01.01.1999",
            filterTitle: "Filter",
            resultList: []
        };
    },
    computed: {
        ...mapGetters("Language", ["currentLocale"]),
        ...mapGetters("Tools/DistrictSelector", ["selectedDistrictNames"]),

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
    methods: {
        ...mapActions("Tools/DistrictSelector", ["setDistrictsByName"]),

        /**
         * Adds a new card to the list of cards.
         * @returns {void}
         */
        addCard () {
            this.cardList.push({
                id: uniqueId("card-"),
                operator: "or",
                districts: []
            });
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
         * Sets the value for the districts on a card.
         * @param {String} cardId - The id of the card.
         * @param {String[]} names - The Names of the district names.
         * @returns {void}
         */
        setCardDistricts (cardId, names) {
            const foundCard = this.cardList.find(card => card.id === cardId);

            if (foundCard) {
                foundCard.districts = names;
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
        <h4 class="pt-2">
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
                    class="mx-4"
                    @delete="deleteCard"
                    @scanCompleted="setCardDistricts"
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
        <button
            class="btn btn-primary lh-1 fs-5"
            @click="setDistricts"
        >
            <i class="bi bi-check pe-2" />
            {{ $t("additional:modules.tools.cosi.districtFinder.button.confirm") }}
        </button>
        <br>
        <div class="pb-5" />
        <ul>
            <li
                v-for="resultName in resultList"
                :key="resultName"
            >
                {{ resultName }}
            </li>
        </ul>
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

        .slide-fade-enter-active, .slide-fade-leave-active {
            transition: all 1s;
        }
        .slide-fade-enter, .slide-fade-leave-to /* .list-leave-active below version 2.1.8 */ {
            opacity: 0;
            transform: translateX(80px);
        }
    }

</style>
