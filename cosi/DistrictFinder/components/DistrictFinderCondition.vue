<script>
import {mapGetters, mapActions, mapMutations} from "vuex";
import getters from "../store/gettersDistrictFinder";
import mutations from "../store/mutationsDistrictFinder";
import actions from "../store/actionsDistrictFinder";
import {getFeaturePOST} from "../../../../src/api/wfs/getFeature";
import {WFS} from "ol/format.js";

export default {
    name: "DistrictFinderCondition",
    props: {
        conditionId: {
            type: Number,
            required: true
        }
    },
    emits: ["scanCompleted"],
    data () {
        return {
            selectedDataset: null,
            selectedCategory: null,
            year: "2022",
            value: 20000,
            tolerance: 5000,
            resultNames: []
        };
    },
    computed: {
        ...mapGetters("Language", ["currentLocale"]),
        ...mapGetters("Tools/DistrictFinder", Object.keys(getters)),
        ...mapGetters("Maps", ["projectionCode"]),
        ...mapGetters("Tools/DistrictSelector", [
            "selectedDistrictLevelId",
            "selectedDistrictLevel",
            "keyOfAttrNameStats",
            "mapping"
        ]),

        /**
         * Returns the statistical layers for the currently selected district level.
         * @returns {Object[]} The layers or an empty array.
         */
        datasets () {
            return this.selectedDistrictLevel?.stats?.layers || [];
        },

        /**
         * Returns the data categories as defined in the mapping.
         * @returns {Object[]} The mapping categories or an empty array.
         */
        categories () {
            return this.mapping.filter(m => this.selectedDataset?.id === m[this.keyOfAttrNameStats]) || [];
        }
    },
    methods: {
        ...mapMutations("Tools/DistrictFinder", Object.keys(mutations)),
        ...mapActions("Tools/DistrictFinder", Object.keys(actions)),

        /**
         * Performs WFS request to get the statistical features and emits matching district names.
         * @emits scanCompleted - passing own condition id and the found district names.
         * @returns {void}
         */
        async scan () {
            if (!this.selectedDataset || !this.selectedCategory) {
                return;
            }

            let features = await getFeaturePOST(
                this.selectedDataset.url,
                {
                    featureTypes: [this.selectedDataset.featureType],
                    srsName: this.projectionCode,
                    propertyNames: [this.selectedCategory.category, this.keyOfAttrNameStats, "jahr"]
                }
            );

            features = new WFS().readFeatures(features);
            features = features.filter(f => f.get("jahr") === this.year
                && Math.abs(f.get(this.selectedCategory.category) - this.value) <= this.tolerance);
            this.resultNames = features.map(f => f.get(this.keyOfAttrNameStats));
            this.$emit("scanCompleted", this.conditionId, this.resultNames);
        }
    }
};
</script>

<template lang="html">
    <div class="container">
        <h4>Bedingung #{{ conditionId + 1 }}</h4>
        <label>
            Layer:
            <select
                v-model="selectedDataset"
                @change="scan"
            >
                <option
                    v-for="dataset in datasets"
                    :key="dataset.id"
                    :value="dataset"
                >
                    {{ dataset.name }}
                </option>
            </select>
        </label>
        <hr>
        <label>
            Kategorie:
            <select
                v-model="selectedCategory"
                @change="scan"
            >
                <option
                    v-for="category in categories"
                    :key="category.category"
                    :value="category"
                >
                    {{ category.value }}
                </option>
            </select>
        </label>
        <hr>
        <label>
            Jahr:
            <input
                v-model="year"
                type="number"
                @input="scan"
            >
        </label>
        <hr>
        <label>
            Wert:
            <input
                v-model="value"
                type="number"
                @input="scan"
            >
        </label>
        <hr>
        <label>
            Toleranz:
            <input
                v-model="tolerance"
                type="number"
                @input="scan"
            >
        </label>
        <hr>
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";
</style>
