<script>
import SliderItem from "@shared/modules/slider/components/SliderItem.vue";
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import {mapMutations, mapGetters} from "vuex";


export default {
    name: "TimeFrame",
    components: {
        SliderItem,
        AccordionItem
    },
    data () {
        return {
            timeFields: ["hour", "day", "month"],
            fieldConfig: {
                hour: {label: "Hour", min: 0, max: 23},
                day: {label: "Day", min: 1, max: 31},
                month: {label: "Month", min: 1, max: 12}
            }
        };
    },
    computed: {
        ...mapGetters("Modules/SimulationTool", ["timeFrame"]),
        timeFrames () {
            return {
                startTime: {
                    title: "Start Time",
                    id: "start-time",
                    values: {
                        hour: this.timeFrame[0].hour,
                        day: this.timeFrame[0].day,
                        month: this.timeFrame[0].month
                    }
                },
                endTime: {
                    title: "End Time",
                    id: "end-time",
                    values: {
                        hour: this.timeFrame[1].hour,
                        day: this.timeFrame[1].day,
                        month: this.timeFrame[1].month
                    }
                }
            };
        }
    },
    methods: {
        ...mapMutations("Modules/SimulationTool", ["setTimeFrame"]),
        updateTimeValue (timeType, field, value) {
            this.timeFrames[timeType].values[field] = value;
            this.setTimeFrame([this.timeFrames.startTime.values, this.timeFrames.endTime.values]);
        }
    }
};
</script>

<template>
    <div>
        <AccordionItem
            v-for="(timeFrame, timeType) in timeFrames"
            :id="`${timeFrame.id}-simulation-parameters`"
            :key="timeType"
            :title="timeFrame.title"
            :is-open="true"
        >
            <div
                v-for="field in timeFields"
                :key="field"
                class="mb-3"
            >
                <SliderItem
                    :id="`${timeType}-${field}-slider`"
                    :label="fieldConfig[field].label"
                    :aria="`${timeFrame.title} ${fieldConfig[field].label}`"
                    :value="timeFrame.values[field]"
                    :min="fieldConfig[field].min"
                    :max="fieldConfig[field].max"
                    step="1"
                    show-markers="true"
                    :interaction="(event) => updateTimeValue(timeType, field, Number(event.target.value))"
                />
            </div>
        </AccordionItem>
    </div>
</template>
