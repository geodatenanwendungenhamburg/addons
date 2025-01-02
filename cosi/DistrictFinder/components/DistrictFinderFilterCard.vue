<script>
import BarchartItem from "../../../../src/share-components/charts/components/BarchartItem.vue";
import ContentCard from "../../components/ContentCard.vue";
import getOAFFeature from "../../../../src/api/oaf/getOAFFeature";
import {mapGetters} from "vuex";

export default {
    name: "DistrictFinderFilterCard",
    components: {
        BarchartItem,
        ContentCard
    },
    props: {
        active: {
            type: Boolean,
            required: false,
            default: false
        },
        cardNumber: {
            type: Number,
            required: true
        },
        condition: {
            type: Object,
            required: true
        }
    },
    emits: ["delete", "scanCompleted"],
    data () {
        return {
            dataChips: ["Fachdaten", "statistische Daten"],
            datasetFachdaten: ["Beispiel5", "Beispiel6", "Beispiel7", "Beispiel8"],
            expandDataInfo: true,
            features: [],
            referenceValue: undefined,
            selectedCategory: null,
            selectedData: "statistische Daten",
            selectedFilter: "=",
            selectedYear: new Date().getFullYear() - 1,
            tolerance: undefined,
            years: new Array(10).fill(new Date().getFullYear() - 1).map((v, i) => v - i),
            chartConfig: {
                data: {
                    datasets: [{
                        data: []
                    }],
                    labels: []
                },
                options: {
                    maintainAspectRatio: false,
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                autoSkip: true,
                                maxTicksLimit: 4
                            }
                        },
                        x: {
                            display: false
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            },
            chartOptions: {
                barPercentage: 1.0,
                categoryPercentage: 1.0,
                borderWidth: 0,
                backgroundColor: "rgba(0, 48, 99, 0.8)",
                hoverBackgroundColor: "rgba(220, 226, 243, 1)"
            }

        };
    },
    computed: {
        ...mapGetters("Language", ["currentLocale"]),
        ...mapGetters("Tools/DistrictSelector", [
            "keyOfAttrNameStats",
            "mapping",
            "selectedDistrictLevel",
            "selectedDistrictNames"
        ]),

        /**
         * Returns the selected features if a selection is made or all features.
         * @returns {Object[]} The statistical features.
         */
        featuresToUse () {
            return this.selectedDistrictNames?.length
                ? this.features.filter(
                    feature => this.selectedDistrictNames.includes(feature?.properties?.[this.keyOfAttrNameForSelectedLayer]))
                : this.features;
        },

        /**
         * Returns translated dropdown entries for filter rules.
         * @returns {Object[]} dropdown entries with text and value keys.
         */
        filterRules () {
            return [
                {value: "=", text: this.$t("additional:modules.tools.cosi.districtFinder.comparison.equals")},
                {value: "<", text: this.$t("additional:modules.tools.cosi.districtFinder.comparison.less")},
                {value: ">", text: this.$t("additional:modules.tools.cosi.districtFinder.comparison.greater")}
            ];
        },

        /**
         * Returns the statistical datasets for the current district level as defined in the mapping.
         * @returns {Object[]} The mapping datasets or an empty array.
         */
        datasetStat () {
            return this.mapping.filter(m => m[this.keyOfAttrNameStats]) || [];
        },

        /**
         * Returns the key to be used for the district name in the currently selected layer.
         * (for example: "stat_gebiet", "statistisches_gebiet" or "stadtteil")
         * @returns {String} The key.
         */
        keyOfAttrNameForSelectedLayer () {
            return this.selectedDistrictLevel.stats.keyOfAttrName[
                this.selectedDistrictLevel.stats.layerIds.indexOf(
                    this.selectedStatLayer.id
                )
            ];
        },

        /*
         * Returns the maximum value for the chosen category in the features to be used.
         * @returns {String} The maximum value or "-".
         */
        maximum () {
            const max = Math.max(... this.featuresToUse.map(feature => feature?.properties?.[this.selectedCategory])
                .filter(value => typeof value === "number")
            );

            return Number.isFinite(max) ? max.toLocaleString(this.currentLocale) : "-";
        },

        /**
         * Returns the mean value for the chosen category in the features to be used.
         * @returns {String} The mean value or "-".
         */
        meanValue () {
            const values = this.featuresToUse.map(feature => feature?.properties?.[this.selectedCategory])
                    .filter(value => typeof value === "number"),
                mean = values.reduce((acc, curr) => acc + curr, 0) / values.length;

            return Number.isFinite(mean) ? mean.toLocaleString(this.currentLocale, {maximumFractionDigits: 1}) : "-";
        },

        /**
         * Returns the minimum value for the chosen category in the features to be used.
         * @returns {String} The minimum value or "-".
         */
        minimum () {
            const min = Math.min(... this.featuresToUse.map(feature => feature?.properties?.[this.selectedCategory])
                .filter(value => typeof value === "number")
            );

            return Number.isFinite(min) ? min.toLocaleString(this.currentLocale) : "-";
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
        },

        /**
         * Returns the type of the selected dataset.
         * @returns {String} "absolut(e)", "relativ(e)", or "-".
         */
        type () {
            if (typeof this.selectedDataset?.valueType !== "string") {
                return "-";
            }
            return this.$t("additional:modules.tools.cosi.districtFinder.label.valueType",
                {context: this.selectedDataset.valueType});
        }
    },
    watch: {
        features: {
            handler () {
                this.addChartData();
            },
            deep: true
        }
    },
    mounted () {
        this.setConditionAttributes(this.condition);
    },
    methods: {
        /**
         * Adds data and labels to the chart options.
          * @returns {void}
         */
        addChartData () {
            const sorted = this.sortedData(),
                allData = sorted.map(data => data[this.selectedCategory]),
                allLabels = sorted.map(label => label[this.keyOfAttrNameStats]);

            this.chartConfig.data = Object.assign({}, this.chartConfig.data, {labels: allLabels, datasets: [{...this.chartOptions, data: allData}]});
        },

        /**
         * Compares two numerical values.
         * @param {String} mode The comparison operator to apply. One of "=", "<" or ">".
         * @param {Number} value The main value to be evaluated.
         * @param {Number} referenceValue The reference value to be evaluated.
         * @param {Number} [tolerance=0] Tolerance for mode "=".
         * @return {Boolean} Whether or not the values meet the chosen condition.
         */
        comparisonFunction (mode, value, referenceValue, tolerance = 0) {
            if (mode === "<") {
                return value < referenceValue;
            }
            if (mode === ">") {
                return value > referenceValue;
            }
            if (mode === "=") {
                return Math.abs(value - referenceValue) <= tolerance;
            }
            return false;
        },

        deleteCard () {
            this.$emit("delete", this.condition.id);
        },

        /**
         * Performs OAF request to get the statistical features and emits matching district names.
         * @param {Object} layer An oaf layer object containing at least url and collection.
         * @param {Number|String} year The year to retrieve the data for.
         * @param {String[]} propertyNames The property names that should be available in the returned features.
         * @returns {Object[]} The retrieved features or an empty array.
         */
        async fetchFeatures (layer, year, propertyNames) {

            if (!layer || !year || !propertyNames) {
                return [];
            }

            const features = await getOAFFeature.getOAFFeatureGet({
                baseUrl: layer.url,
                collection: layer.collection,
                limit: 10000,
                filterCrs: "http://www.opengis.net/def/crs/EPSG/0/25832",
                crs: "http://www.opengis.net/def/crs/EPSG/0/25832",
                propertyNames: propertyNames,
                skipGeometry: true,
                literalFilters: {datetime: `${year}-01-01/${year}-12-31`}
            });

            return features;
        },

        /**
         * Transforms an oaf temporal extent object into an array of years.
         * @param {Date[][]} extent The temporal extent.
         * @return {Number[]} An array of the years that are part of the extent.
         */
        getYearsForTemporalExtent (extent) {
            if (!Array.isArray(extent)
                || !extent.length
                || !extent.every(interval => Array.isArray(interval))
                || !extent.every(interval => interval.length === 2)
                || !extent.every(interval => interval.every(date => date instanceof Date))
            ) {
                return [];
            }

            const years = new Set();

            extent.forEach(interval => {
                const firstYear = interval[0].getFullYear(),
                    lastYear = interval[1].getFullYear(),
                    yearsToAdd = new Array(lastYear - firstYear + 1).fill(firstYear).map((v, i) => v + i);

                yearsToAdd.forEach(year => years.add(year));
            });
            return [...years];
        },

        /**
         * Sets the attributes of this condition/card
         * @param {Object} condition - The condition attributes
         * @returns {void}
         */
        setConditionAttributes (condition) {
            if (Object.prototype.hasOwnProperty.call(condition, "referenceValue")) {
                this.referenceValue = condition.referenceValue;
            }
            if (Object.prototype.hasOwnProperty.call(condition, "rule")) {
                this.selectedFilter = condition.rule;
            }
            if (Object.prototype.hasOwnProperty.call(condition, "ruleTolerance")) {
                this.tolerance = condition.ruleTolerance;
            }
            if (Object.prototype.hasOwnProperty.call(condition, "statisticCategory")) {
                this.selectedCategory = condition.statisticCategory;
            }
            if (Object.prototype.hasOwnProperty.call(condition, "year")) {
                this.selectedYear = condition.year;
            }
        },

        /**
         * Sorts all areas in ascending order for chart.
         * @return {Object} an Object of all sorted data and labels.
         */
        sortedData () {
            const featureProperties = this.features.map(val => val.properties),
                sortedFeatures = this.selectedDistrictNames.length !== 0 ? featureProperties.filter(e => this.selectedDistrictNames.includes(e[this.keyOfAttrNameStats])) : featureProperties;

            sortedFeatures.forEach(v => {
                v[this.selectedCategory] = v[this.selectedCategory] || 0;
            });

            return sortedFeatures.sort((a, b) => a[this.selectedCategory] - b[this.selectedCategory]);
        },

        /**
         * Applies the current filter rules on the features and emits their names.
         * @emits scanCompleted - passing own condition id and the found district names.
         */
        updateResults () {
            const resultNames = this.features
                .filter(f => this.comparisonFunction(this.selectedFilter, f.properties[this.selectedCategory], this.referenceValue, this.tolerance))
                .map(f => f.properties[this.keyOfAttrNameForSelectedLayer]);

            this.$emit("scanCompleted", this.condition.id, resultNames, this.selectedYear, this.selectedCategory, this.referenceValue, this.tolerance, this.selectedFilter);
        },

        /**
         * Performs necessary updates when the selected category has changed.
         * @returns {void}
         */
        async updateSelectedCategory () {
            if (!this.selectedStatLayer) {
                console.warn("No layer found for selected category. Check categories and layer ids in config.json and mapping.json. Make also sure the required category (still) exists in the data schema.");
                this.features = [];
                return;
            }

            const years = this.getYearsForTemporalExtent(
                await getOAFFeature.getTemporalExtent(this.selectedStatLayer.url, this.selectedStatLayer.collection)
            );

            this.years = years.length ? years.reverse()
                : new Array(10).fill(new Date().getFullYear() - 1).map((v, i) => v - i);

            this.selectedYear = this.years[0];
            this.updateYear();
        },

        /**
         * Performs necessary updates when the selected year has changed.
         * @returns {void}
         */
        async updateYear () {
            this.features = await this.fetchFeatures(
                this.selectedStatLayer, this.selectedYear, [this.selectedCategory, this.keyOfAttrNameForSelectedLayer]
            );

            this.updateResults();
        }
    }
};
</script>

<template lang="html">
    <ContentCard
        id="id"
        close-icon="bi bi-trash"
        :close-interaction="deleteCard"
    >
        <template #header>
            <v-chip-group
                v-model="selectedData"
                mandatory
            >
                <v-chip
                    v-for="(data, index) in dataChips"
                    :key="index"
                    :value="data"
                    :stat-color="data === 'statistische Daten'"
                    :fachdata-color="data === 'Fachdaten'"
                    x-small
                    :disabled="data === 'Fachdaten'"
                >
                    {{ data }}
                </v-chip>
            </v-chip-group>
        </template>
        <template #body>
            <div class="container px-2 py-1">
                <div class="row">
                    <h4
                        class="d-flex align-items-center col-md-9 py-0 pb-0 pt-3"
                        :class="active ? 'active' : ''"
                    >
                        {{ cardNumber }}. {{ $t('additional:modules.tools.cosi.districtFinder.condition') }}
                    </h4>
                    <div
                        v-if="typeof selectedDataset !== 'undefined' && selectedData === 'statistische Daten'"
                        class="col-md-3 p-0"
                    >
                        <v-label
                            class="text-black-50"
                            for="year-filter"
                        >
                            {{ $t('additional:modules.tools.cosi.districtFinder.label.year') }}
                        </v-label>
                        <v-select
                            v-model="selectedYear"
                            class="year-filter"
                            :items="years"
                            outlined
                            hide-details
                            dense
                            @change="updateYear"
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
                        <v-autocomplete
                            v-model="selectedCategory"
                            class="data-filter"
                            :items="selectedData === 'statistische Daten' ? datasetStat : datasetFachdaten"
                            item-text="value"
                            item-value="category"
                            outlined
                            hide-details
                            dense
                            @change="updateSelectedCategory"
                        />
                    </div>
                </div>
                <div
                    v-if="typeof selectedDataset !== 'undefined' "
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
                            @input="updateResults"
                        />
                    </div>
                    <div
                        v-if="typeof selectedDataset !== 'undefined'"
                        class="col-md-4 me-1 px-0 pt-1 pb-0"
                    >
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
                            @change="updateResults"
                        />
                    </div>
                    <div
                        v-if="typeof selectedDataset !== 'undefined' && selectedFilter === '='"
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
                            @input="updateResults"
                        />
                    </div>
                </div>
                <div
                    v-if="typeof selectedDataset !== 'undefined'"
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
                    v-if="typeof selectedDataset !== 'undefined' && expandDataInfo"
                >
                    <div
                        v-if="features.length"
                        class="chart-container"
                    >
                        <BarchartItem
                            :given-options="chartConfig.options"
                            :data="chartConfig.data"
                        />
                    </div>
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
.chart-container {
    position: relative;
    margin: auto;
    height: 15vh;
}

h4 {
    &.active {
        font-family: $font_family_accent;
        color: $primary;
    }
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
