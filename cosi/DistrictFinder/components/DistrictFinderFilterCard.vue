<script>
import ContentCard from "../../components/ContentCard.vue";
import {getFeaturePOST} from "../../../../src/api/wfs/getFeature";
import {mapGetters} from "vuex";
import {WFS} from "ol/format.js";

export default {
    name: "DistrictFinderFilterCard",
    components: {
        ContentCard
    },
    props: {
        conditionId: {
            type: Number,
            required: true
        }
    },
    emits: ["scanCompleted"],
    data () {
        return {
            dataChips: ["Fachdaten", "statistische Daten"],
            datasetFachdaten: ["Beispiel5", "Beispiel6", "Beispiel7", "Beispiel8"],
            expandDataInfo: true,
            filterRules: ["gleich", "kleiner als", "größer als"],
            maximum: 6340,
            meanValue: 2000,
            minimum: 0,
            referenceValue: 20000,
            resultNames: [],
            selectedCategory: null,
            selectedData: "statistische Daten",
            selectedFilter: "gleich",
            selectedYear: "2022",
            tolerance: 5000,
            type: "absolut",
            years: ["2017", "2018", "2019", "2020", "2021", "2022"]
        };
    },
    computed: {
        ...mapGetters("Language", ["currentLocale"]),
        ...mapGetters("Maps", ["projectionCode"]),
        ...mapGetters("Tools/DistrictSelector", [
            "keyOfAttrNameStats",
            "mapping",
            "selectedDistrictLevel"
        ]),

        /**
         * Returns the statistical datasets for the current district level as defined in the mapping.
         * @returns {Object[]} The mapping datasets or an empty array.
         */
        datasetStat () {
            return this.mapping.filter(m => m[this.keyOfAttrNameStats]) || [];
        },

        /**
         * Returns currently selected statistical dataset.
         * @returns {Object} A single mapping dataset or undefined.
         */
        selectedDataset () {
            return this.datasetStat.find(d => d.category === this.selectedCategory);
        },

        /**
         * Returns the statistical layer matching the currently selected dataset.
         * @returns {Object} A layer object or undefined.
         */
        selectedStatLayer () {
            return this.selectedDistrictLevel?.stats?.layers?.find(
                layer => layer.id === this.selectedDataset?.[this.keyOfAttrNameStats]);
        }
    },
    methods: {
        /**
         * Performs WFS request to get the statistical features and emits matching district names.
         * @emits scanCompleted - passing own condition id and the found district names.
         * @returns {void}
         */
        async scan () {

            if (!this.selectedDataset || !this.selectedStatLayer) {
                return;
            }

            let features = await getFeaturePOST(
                this.selectedStatLayer.url,
                {
                    featureTypes: [this.selectedStatLayer.featureType],
                    srsName: this.projectionCode,
                    propertyNames: [this.selectedCategory, this.keyOfAttrNameStats, "jahr"]
                }
            );

            features = new WFS().readFeatures(features);
            features = features.filter(f => f.get("jahr") === this.selectedYear
                && Math.abs(f.get(this.selectedCategory) - this.referenceValue) <= this.tolerance);

            this.resultNames = features.map(f => f.get(this.keyOfAttrNameStats));
            this.$emit("scanCompleted", this.conditionId, this.resultNames);
        }
    }
};
</script>

<template lang="html">
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
                        :disabled="data === 'Fachdaten'"
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
                        {{ conditionId + 1 }}. {{ $t('additional:modules.tools.cosi.districtFinder.condition') }}
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
                            @change="scan"
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
                            v-model="selectedCategory"
                            class="data-filter"
                            :items="selectedData === 'statistische Daten' ? datasetStat : datasetFachdaten"
                            item-text="value"
                            item-value="category"
                            outlined
                            hide-details
                            dense
                            @change="scan"
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
                            v-model="referenceValue"
                            class="reference-filter"
                            outlined
                            hide-details
                            dense
                            type="number"
                            @input="scan"
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
                            disabled
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
                            v-model="tolerance"
                            class="tolerance"
                            outlined
                            hide-details
                            dense
                            type="number"
                            @input="scan"
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
