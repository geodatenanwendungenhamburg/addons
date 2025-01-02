<script>

export default {
    name: "DistrictFinderFilterOperator",
    props: {
        id: {
            type: String,
            required: true
        },
        operator: {
            type: String,
            required: true
        }
    },
    emits: ["change"],
    data () {
        return {
            options: [
                {text: this.$t("additional:modules.tools.cosi.districtFinder.operators.or"), value: "or"},
                {text: this.$t("additional:modules.tools.cosi.districtFinder.operators.and"), value: "and"}
            ]
        };
    }
};
</script>

<template lang="html">
    <v-container>
        <v-row class="justify-content-center">
            <v-divider
                class="conditionline"
                vertical
            />
        </v-row>
        <v-row class="justify-content-center">
            <v-spacer />
            <v-select
                :items="options"
                :value="operator"
                dense
                outlined
                hide-details
                class="conditionselect"
                @change="value => $emit('change', id, value)"
            />
            <v-spacer />
        </v-row>
        <v-row class="justify-content-center">
            <v-divider
                class="conditionline"
                vertical
            />
        </v-row>
    </v-container>
</template>

<style lang="scss" scoped>
@import "~variables";

.conditionline {
    height: 26px;
    padding: 0;
    border-color: $light_blue;
    opacity: 1;
    border-width: 1px;
}

.conditionselect {
    flex: 0 1 7em;
}
</style>
