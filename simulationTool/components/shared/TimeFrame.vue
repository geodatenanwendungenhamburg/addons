<script>
import {mapMutations, mapGetters} from "vuex";

export default {
    name: "TimeFrame",
    emits: ["timeFrameChanged"],
    data () {
        return {
            seasonOptions: [
                {value: "winter", label: "Winter"},
                {value: "spring", label: "Spring"},
                {value: "summer", label: "Summer"},
                {value: "autumn", label: "Autumn"},
                {value: "full-year", label: "Full Year"}
            ],
            hoursOptions: [
                {value: "morning", label: "Morning"},
                {value: "noon", label: "Noon"},
                {value: "evening", label: "Evening"},
                {value: "night", label: "Night"},
                {value: "all-hours", label: "All Hours"}
            ]
        };
    },
    computed: {
        ...mapGetters("Modules/SimulationTool", ["timeFrame"]),
        currentTimeFrame () {
            // Default values if timeFrame is not set or in old format
            return {
                season: this.timeFrame?.season || "winter",
                hours: this.timeFrame?.hours || "evening"
            };
        }
    },
    methods: {
        ...mapMutations("Modules/SimulationTool", ["setTimeFrame"]),
        updateSeason (newSeason) {
            const updatedTimeFrame = {
                ...this.currentTimeFrame,
                season: newSeason
            };

            this.setTimeFrame(updatedTimeFrame);
            this.$emit("timeFrameChanged", updatedTimeFrame);
        },
        updateHours (newHours) {
            const updatedTimeFrame = {
                ...this.currentTimeFrame,
                hours: newHours
            };

            this.setTimeFrame(updatedTimeFrame);
            this.$emit("timeFrameChanged", updatedTimeFrame);
        }
    }
};
</script>

<template>
    <div>
        <div class="mb-3">
            <label
                for="season-select"
                class="form-label"
            >
                Season
            </label>
            <select
                id="season-select"
                v-model="currentTimeFrame.season"
                class="form-select"
                @change="updateSeason($event.target.value)"
            >
                <option
                    v-for="option in seasonOptions"
                    :key="option.value"
                    :value="option.value"
                >
                    {{ option.label }}
                </option>
            </select>
        </div>

        <!-- Hours Selection -->
        <div class="mb-3">
            <label
                for="hours-select"
                class="form-label"
            >
                Hours
            </label>
            <select
                id="hours-select"
                v-model="currentTimeFrame.hours"
                class="form-select"
                @change="updateHours($event.target.value)"
            >
                <option
                    v-for="option in hoursOptions"
                    :key="option.value"
                    :value="option.value"
                >
                    {{ option.label }}
                </option>
            </select>
        </div>
    </div>
</template>
