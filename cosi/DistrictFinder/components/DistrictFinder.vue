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

export default {
    name: "DistrictFinder",
    components: {
        Tool,
        DistrictSelectorLevel,
        DistrictSelectorFilter,
        DistrictFinderCondition
    },
    data () {
        return {
            prefilteredDistrictNames: [],
            numberOfConditions: 1,
            resultNamesArray: [],
            resultList: []
        };
    },
    computed: {
        ...mapGetters("Language", ["currentLocale"]),
        ...mapGetters("Tools/DistrictFinder", Object.keys(getters)),
        ...mapGetters("Tools/DistrictSelector", ["districtLevels", "selectedDistrictLevelId", "selectedDistrictLevel"])
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
            this.prefilteredDistrictNames = districtsNames;
            this.$root.$emit("updateSelectedDistricts", districtsNames);
        },

        /**
         * Updates the resulting district names when a conditions has been updated.
         * @param {Number} conditionId - The id of the condition that is sending new results.
         * @param {String[]} resultNames - The district names that have been found by the condition.
         * @returns {void}
         */
        updateResults (conditionId, resultNames) {
            this.resultNamesArray[conditionId] = resultNames.filter(rN => this.prefilteredDistrictNames.includes(rN));
            this.resultList = [...new Set(this.resultNamesArray.flat())];
        },

        /**
         * Sets the currently found districts as selected districts.
         * @returns {void}
         */
        setDistricts () {
            this.setSelectedDistrictLevelId(this.selectedDistrictLevel.layerId);
            this.setDistrictsByName({districtNames: this.resultList});
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
                <h4>GebieteScan</h4>
                <label>
                    Anzahl Bedingungen:
                    <input
                        v-model.number="numberOfConditions"
                        type="number"
                        min="1"
                    >
                </label>
                <hr>
                <div
                    v-for="conditionId in numberOfConditions"
                    :key="conditionId - 1"
                >
                    <DistrictFinderCondition
                        :condition-id="conditionId - 1"
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
    </Tool>
</template>

<style lang="scss" scoped>
@import "~variables";
</style>
