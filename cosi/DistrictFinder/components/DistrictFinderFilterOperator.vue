<script>

export default {
    name: "DistrictFinderFilterOperator",
    props: {
        defaultOption: {
            type: String,
            required: false,
            default: "or"
        }
    },
    emits: ["change"],

    mounted () {
        this.$emit("change", this.defaultOption);
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
                :items="[
                    {text: 'ODER', value: 'or'},
                    {text: 'UND', value: 'and'}
                ]"
                :value="defaultOption"
                dense
                outlined
                hide-details
                class="conditionselect"
                @change="value => $emit('change', value)"
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
