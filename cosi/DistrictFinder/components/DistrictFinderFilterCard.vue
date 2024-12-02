<script>
import ContentCard from "../../components/ContentCard.vue";
import {mapGetters} from "vuex";

export default {
    name: "DistrictFinderFilterCard",
    components: {
        ContentCard
    },
    data () {
        return {
            dataChips: ["Fachdaten", "statistische Daten"],
            datasetFachdaten: ["Beispiel5", "Beispiel6", "Beispiel7", "Beispiel8"],
            datasetStat: ["Beispiel1", "Beispiel2", "Beispiel3", "Beispiel4"],
            expandDataInfo: true,
            filterRules: ["gleich", "kleiner als", "größer als"],
            maximum: 6340,
            meanValue: 2000,
            minimum: 0,
            resultList: [],
            resultNamesArray: [],
            selectedData: "statistische Daten",
            selectedDataset: null,
            selectedFilter: "gleich",
            selectedYear: "2022",
            type: "absolut",
            years: ["2017", "2018", "2019", "2020", "2021", "2022"]
        };
    },
    computed: {
        ...mapGetters("Language", ["currentLocale"])
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
