<script>
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

/**
 * DatetimeInput component for selecting date and time with validation.
 * Outputs ISO 8601 formatted datetime string (YYYY-MM-DDTHH:mm:ss).
 *
 * @vue-prop {String} id - The id for the input elements.
 * @vue-prop {String} label - The label to display.
 * @vue-prop {String} value - The ISO 8601 datetime value.
 * @vue-prop {String} min - Minimum allowed datetime (ISO 8601).
 * @vue-prop {String} max - Maximum allowed datetime (ISO 8601).
 * @vue-data {String} dateValue - The date part (YYYY-MM-DD).
 * @vue-data {String} timeValue - The time part (HH:mm).
 * @vue-data {String} validationError - Validation error message.
 */
export default {
    name: "DatetimeInput",
    props: {
        id: {
            type: String,
            required: true
        },
        label: {
            type: String,
            required: true
        },
        value: {
            type: String,
            default: ""
        },
        min: {
            type: String,
            default: ""
        },
        max: {
            type: String,
            default: ""
        }
    },
    emits: ["update:value"],
    data () {
        return {
            dateValue: "",
            timeValue: "",
            validationError: ""
        };
    },
    computed: {
        /**
         * Gets the minimum date for the date input.
         * @returns {String} The minimum date in YYYY-MM-DD format.
         */
        minDate () {
            if (!this.min) {
                return "";
            }
            const minMoment = dayjs(this.min);

            return minMoment.isValid() ? minMoment.format("YYYY-MM-DD") : "";
        },

        /**
         * Gets the maximum date for the date input.
         * @returns {String} The maximum date in YYYY-MM-DD format.
         */
        maxDate () {
            if (!this.max) {
                return "";
            }
            const maxMoment = dayjs(this.max);

            return maxMoment.isValid() ? maxMoment.format("YYYY-MM-DD") : "";
        },

        /**
         * Gets the minimum time for the time input when date equals min date.
         * @returns {String} The minimum time in HH:mm format.
         */
        minTime () {
            if (!this.min || !this.dateValue) {
                return "";
            }
            const minMoment = dayjs(this.min);

            if (minMoment.isValid() && this.dateValue === minMoment.format("YYYY-MM-DD")) {
                return minMoment.format("HH:mm");
            }
            return "";
        },

        /**
         * Gets the maximum time for the time input when date equals max date.
         * @returns {String} The maximum time in HH:mm format.
         */
        maxTime () {
            if (!this.max || !this.dateValue) {
                return "";
            }
            const maxMoment = dayjs(this.max);

            if (maxMoment.isValid() && this.dateValue === maxMoment.format("YYYY-MM-DD")) {
                return maxMoment.format("HH:mm");
            }
            return "";
        }
    },
    watch: {
        /**
         * Watch for external value changes and update internal state.
         * @param {String} newValue The new datetime value.
         * @returns {void}
         */
        value: {
            handler (newValue) {
                if (newValue) {
                    const moment = dayjs(newValue);

                    if (moment.isValid()) {
                        this.dateValue = moment.format("YYYY-MM-DD");
                        this.timeValue = moment.format("HH:mm");
                    }
                }
                else {
                    this.dateValue = "";
                    this.timeValue = "";
                }
            },
            immediate: true
        }
    },
    methods: {
        /**
         * Handles date input change.
         * @param {Event} event The input event.
         * @returns {void}
         */
        onDateChange (event) {
            this.dateValue = event.target.value;
            this.validateAndEmit();
        },

        /**
         * Handles time input change.
         * @param {Event} event The input event.
         * @returns {void}
         */
        onTimeChange (event) {
            this.timeValue = event.target.value;
            this.validateAndEmit();
        },

        /**
         * Validates the datetime and emits the value.
         * @returns {void}
         */
        validateAndEmit () {
            if (!this.dateValue || !this.timeValue) {
                this.validationError = "";
                this.$emit("update:value", "");
                return;
            }

            const datetime = `${this.dateValue}T${this.timeValue}:00`,
                moment = dayjs(datetime);

            if (!moment.isValid()) {
                this.validationError = "Ungültiges Datum oder Zeit";
                this.$emit("update:value", "");
                return;
            }

            // Validate against min
            if (this.min) {
                const minMoment = dayjs(this.min);

                if (moment.isBefore(minMoment)) {
                    this.validationError = `Zeitpunkt darf nicht vor ${minMoment.format("DD.MM.YYYY HH:mm")} liegen`;
                    this.$emit("update:value", "");
                    return;
                }
            }

            // Validate against max
            if (this.max) {
                const maxMoment = dayjs(this.max);

                if (moment.isAfter(maxMoment)) {
                    this.validationError = `Zeitpunkt darf nicht nach ${maxMoment.format("DD.MM.YYYY HH:mm")} liegen`;
                    this.$emit("update:value", "");
                    return;
                }
            }

            this.validationError = "";
            this.$emit("update:value", datetime);
        }
    }
};
</script>

<template>
    <div class="datetime-input">
        <label :for="`${id}-date`">
            {{ label }}
        </label>
        <div class="d-flex gap-2 mb-2">
            <div class="flex-grow-1">
                <label
                    :for="`${id}-date`"
                    class="form-label small"
                >
                    Datum
                </label>
                <input
                    :id="`${id}-date`"
                    type="date"
                    class="form-control"
                    :value="dateValue"
                    :min="minDate"
                    :max="maxDate"
                    @input="onDateChange"
                >
            </div>
            <div class="flex-grow-1">
                <label
                    :for="`${id}-time`"
                    class="form-label small"
                >
                    Zeit
                </label>
                <input
                    :id="`${id}-time`"
                    type="time"
                    class="form-control"
                    :value="timeValue"
                    :min="minTime"
                    :max="maxTime"
                    @input="onTimeChange"
                >
            </div>
        </div>
        <div
            v-if="validationError"
            class="text-danger small mb-2"
        >
            {{ validationError }}
        </div>
    </div>
</template>

<style lang="scss" scoped>
.datetime-input {
    margin-bottom: 1rem;
}
</style>
