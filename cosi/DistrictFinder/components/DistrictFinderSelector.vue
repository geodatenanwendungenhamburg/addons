<script>
import differenceJs from "../../../../src/utils/differenceJS";
import {mapGetters, mapMutations} from "vuex";

export default {
    name: "DistrictFinderSelector",
    data () {
        return {
            subLevelDistricts: []
        };
    },
    computed: {
        ...mapGetters("Tools/DistrictSelector", ["districtLevels"]),
        ...mapGetters("Tools/DistrictFinder", ["selectedLevelId", "subLevelSelection", "topLevelSelection"]),

        /**
         * Gets the levels on which the screening can run.
         * @returns {Object[]} The district levels.
         */
        screeningLevels () {
            return this.districtLevels.slice(0, 2).reverse();
        },

        /**
         * Gets the selected level for screening.
         * @returns {Object} The selected district level.
         */
        selectedScreeningLevel () {
            return this.screeningLevels.find(level => level.layerId === this.selectedLevelId);
        },

        /**
         * Gets the label of the selected screening level.
         * @returns {String} The label.
         */
        selectedScreeningLevelLabel () {
            return this.selectedScreeningLevel.label;
        },

        /**
         * Flag to control whether the sublevel should be shown.
         * @returns {Boolean} True if it should be shown.
         */
        showSubLevel () {
            return this.selectedScreeningLevel.layerId === this.districtLevels.at(0).layerId;
        },

        /**
         * Gets the sub district level on which to limit.
         * @returns {Object} The sub district level.
         */
        subLevel () {
            return this.districtLevels.at(1);
        },

        /**
         * Gets the top district level on which to limit.
         * @returns {Object} The top district level.
         */
        topLevel () {
            return this.districtLevels.at(2);
        },

        /**
         * Gets the names of the top level districts.
         * @returns {String[]} The district names.
         */
        topLevelDistricts () {
            return this.topLevel.districts.map(district => district.getName()).sort();
        }
    },
    watch: {

        /**
         * Call 'collectSelectedDistricts' whenever the screening level is changed.
         * @returns {void}
         */
        selectedScreeningLevel () {
            const selectedDistricts = this.collectSelectedDistricts();

            this.setSelectedDistricts(selectedDistricts);
        },

        /**
         * Call 'collectSelectedDistricts' each time the selection of the sublevel districts is changed.
         * @returns {void}
         */
        subLevelSelection () {
            const selectedDistricts = this.collectSelectedDistricts();

            this.setSelectedDistricts(selectedDistricts);
        },

        /**
         * Checks whether districts are added, removed or initially set in the sub level.
         * @param {String[]} newSelection - The current top level selection.
         * @param {String[]} oldSelection - The previous selection of the top level.
         * @returns {void}
         */
        topLevelSelection (newSelection, oldSelection) {
            let differenceSelection;

            if (oldSelection.length === 0) {
                this.subLevelDistricts = this.subLevel.districts.map(district => district.getName()).sort();
                this.setSubLevelSelection(this.subLevelDistricts);
                this.setSelectedDistricts(this.collectSelectedDistricts());
                return;
            }
            if (newSelection.length > oldSelection.length) {
                differenceSelection = differenceJs(newSelection, oldSelection).toString();
                this.addSubLevelDistricts(this.subLevel.districts, differenceSelection);
            }
            else {
                differenceSelection = differenceJs(oldSelection, newSelection).toString();
                this.removeSubLevelDistricts(this.subLevel.districts, differenceSelection);
            }
            this.setSelectedDistricts(this.collectSelectedDistricts());
        }
    },
    mounted () {
        this.setTopLevelSelection(this.topLevelDistricts);
    },

    methods: {
        ...mapMutations("Tools/DistrictFinder", ["setSelectedDistricts", "setSelectedLevelId", "setSubLevelSelection", "setTopLevelSelection"]),

        /**
         * Adds districts to the subLevel by the refernce district.
         * @param {Object[]} districts - The districts.
         * @param {String} referenceDistrict - The name of the reference district.
         * @returns {void}
         */
        addSubLevelDistricts (districts, referenceDistrict) {
            const districtsToAdd = this.getDistrictsByReference(districts, referenceDistrict);

            this.subLevelDistricts = this.subLevelDistricts.concat(districtsToAdd).sort();
            this.setSubLevelSelection(this.subLevelSelection.concat(districtsToAdd).sort());
        },

        /**
         * Collects and sets the selected districts.
         * @returns {String[]} The selected names of the districts.
         */
        collectSelectedDistricts () {
            const selectedDistricts = [],
                districts = this.showSubLevel ? this.subLevel.subLevel.districts : this.subLevel.districts,
                selection = this.showSubLevel ? this.subLevelSelection : this.topLevelSelection;

            districts.forEach(district => {
                if (selection.includes(district.referencDistrictName)) {
                    selectedDistricts.push(district.getName());
                }
            });

            return selectedDistricts;
        },

        /**
         * Gets the names of districts to the reference district.
         * @param {Object[]} districts - The districts.
         * @param {String} referenceDistrict - The name of the reference district.
         * @returns {String[]} The names of the given districts.
         */
        getDistrictsByReference (districts, referenceDistrict) {
            const filteredDistricts = districts.filter(district => referenceDistrict === district.referencDistrictName);

            return filteredDistricts.map(district => district.getName());
        },

        /**
         * Removes an element from an array by index.
         * @param {*} elemToRemove - The element to remove.
         * @param {*[]} arr - The array from which the element is removed.
         * @returns {void}
         */
        removeElementFromArray (elemToRemove, arr) {
            const index = arr.indexOf(elemToRemove);

            if (index > -1) {
                arr.splice(index, 1);
            }
        },

        /**
         * Removes districts from the subLevel by the reference district.
         * @param {Object[]} districts - The districts.
         * @param {String} referenceDistrict - The name of the reference district.
         * @returns {void}
         */
        removeSubLevelDistricts (districts, referenceDistrict) {
            const districtsToRemove = this.getDistrictsByReference(districts, referenceDistrict),
                tmpSubLevelDistricts = [...this.subLevelDistricts],
                tmpSublLevelSelection = [...this.subLevelSelection];

            districtsToRemove.forEach(district => {
                this.removeElementFromArray(district, tmpSubLevelDistricts);
                this.removeElementFromArray(district, tmpSublLevelSelection);
            });
            this.subLevelDistricts = tmpSubLevelDistricts;
            this.setSubLevelSelection(tmpSublLevelSelection);
        },
        /**
        * Removes the given item from the subLevelSelection.
        * @param {String} item The item to remove
        * @returns {void}
        */
        removeFromSubLevelSelection (item) {
            const subLevelSelection = [...this.subLevelSelection];

            this.removeElementFromArray(item, subLevelSelection);
            this.setSubLevelSelection(subLevelSelection);
        }
    }
};
</script>

<template lang="html">
    <div id="district-finder-selector">
        <label
            class="text-black-50"
            for="chip-group"
        >
            {{ $t('additional:modules.tools.cosi.districtFinder.selector.label.level') }}
        </label>
        <div class="text-left mt-1 mb-4">
            <v-chip
                v-for="level in screeningLevels"
                :key="level.layerId"
                class="me-2"
                :input-value="level.layerId === selectedLevelId"
                filter
                @click="setSelectedLevelId(level.layerId)"
            >
                {{ level.label }}
            </v-chip>
        </div>
        <div class="mb-2 font-subtitle">
            {{ $t('additional:modules.tools.cosi.districtFinder.selector.subtitle', {selectedScreeningLevelLabel}) }}
        </div>
        <label
            class="text-black-50"
            for="chip-group"
        >
            {{ topLevel.label }}
        </label>
        <v-chip-group
            :value="topLevelSelection"
            column
            mandatory
            multiple
            class="mb-2"
            @change="setTopLevelSelection"
        >
            <v-chip
                v-for="tag in topLevelDistricts"
                :key="tag"
                :input-value="topLevelSelection.includes(tag)"
                :value="tag"
                filter
            >
                {{ tag }}
            </v-chip>
        </v-chip-group>
        <template v-if="showSubLevel">
            <label
                class="text-black-50"
                :for="'region-filter'"
            >
                {{ subLevel.label }}
            </label>
            <v-autocomplete
                :value="subLevelSelection"
                :items="subLevelDistricts"
                outlined
                chips
                deletable-chips
                multiple
                small-chips
                dense
                hide-details
                @change="setSubLevelSelection"
            >
                <template #selection="{ item, index }">
                    <v-chip
                        v-if="index < 2"
                        close
                        :input-value="true"
                        @click:close="removeFromSubLevelSelection(item)"
                    >
                        <span>{{ item }}</span>
                    </v-chip>
                    <span
                        v-if="index === 2"
                        class="fs-6 pt-2"
                    >
                        (+{{ subLevelSelection.length - 2 }} weitere)
                    </span>
                </template>
            </v-autocomplete>
        </template>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #district-finder-selector {
        .font-subtitle {
            font-size: 0.85rem;
            font-family: $font_family_accent;
        }
    }

</style>
