<script>

export default {
    name: "DistrictSelectorLevel",
    props: {
        districtLevels: {
            type: Array,
            required: true
        },
        selectedLevelId: {
            type: String,
            required: true
        }
    }
};
</script>

<template lang="html">
    <div class="district-selector-level">
        <label
            class="text-black-50"
            for="chip-group"
        >
            {{ $t('additional:modules.tools.cosi.districtSelector.districtLevel') }}
        </label>
        <div class="text-left my-2">
            <v-chip
                v-for="level in districtLevels"
                :key="level.layerId"
                class="me-2"
                :input-value="level.layerId === selectedLevelId"
                filter
                @click="$emit('setSelectedDistrictLevelId', level.layerId)"
            >
                {{ level.label }}
            </v-chip>
        </div>
    </div>
</template>
