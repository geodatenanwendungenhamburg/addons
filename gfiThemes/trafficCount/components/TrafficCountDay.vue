<script>
import TrafficCountCompDiagram from "./TrafficCountCompDiagram.vue";
import TrafficCountCompTable from "./TrafficCountCompTable.vue";
import TrafficCountCheckbox from "./TrafficCountCheckbox.vue";
import thousandsSeparator from "../../../../src/utils/thousandsSeparator.js";
import moment from "moment";
import DatePicker from "vue2-datepicker";
import "vue2-datepicker/index.css";
import {addMissingDataDay} from "../utils/addMissingData.js";
import {getPublicHoliday} from "../../../../src/utils/calendar.js";
import {DauerzaehlstellenRadApi} from "../utils/dauerzaehlstellenRadApi";

export default {
    name: "TrafficCountDay",
    components: {
        TrafficCountCompDiagram,
        TrafficCountCompTable,
        TrafficCountCheckbox,
        DatePicker
    },
    props: {
        api: {
            type: Object,
            required: true
        },
        thingId: {
            type: [Number, String],
            required: true
        },
        meansOfTransport: {
            type: String,
            required: true
        },
        reset: {
            type: Boolean,
            required: true
        },
        holidays: {
            type: Array,
            required: true
        },
        checkGurlittInsel: {
            type: Boolean,
            required: true
        }
    },
    data () {
        return {
            tab: "day",
            apiData: [],
            dates: [],

            // props for diagram
            setTooltipValue: (tooltipItem) => {
                return moment(tooltipItem.datetime, "YYYY-MM-DD HH:mm:ss").format("DD.MM.YYYY, HH:mm") + " " + this.$t("additional:modules.tools.gfi.themes.trafficCount.clockLabel") + ": " + thousandsSeparator(tooltipItem.value);
            },
            xAxisTicks: 12,
            yAxisTicks: 8,
            renderLabelXAxis: (datetime) => {
                return moment(datetime, "YYYY-MM-DD HH:mm:ss").format("HH:mm") + " " + this.$t("additional:modules.tools.gfi.themes.trafficCount.clockLabel");
            },
            renderLabelYAxis: (yValue) => {
                return thousandsSeparator(yValue);
            },
            descriptionYAxis: this.$t("additional:modules.tools.gfi.themes.trafficCount.yAxisTextDay", {minutes: this.api instanceof DauerzaehlstellenRadApi ? 60 : 15}),
            renderLabelLegend: (datetime) => {
                return moment(datetime, "YYYY-MM-DD HH:mm:ss").format("DD.MM.YYYY");
            },
            renderPointStyle: (datetime) => {
                const pointStyle = [],
                    format = "YYYY-MM-DD";

                for (let i = 0; i < datetime.length; i++) {
                    if (getPublicHoliday(datetime[i], this.holidays, format)) {
                        pointStyle.push("star");
                    }
                    else {
                        pointStyle.push("circle");
                    }
                }

                return pointStyle;
            },
            renderPointSize: (datetime) => {
                const pointSize = [],
                    format = "YYYY-MM-DD";

                for (let i = 0; i < datetime.length; i++) {
                    if (getPublicHoliday(datetime[i], this.holidays, format)) {
                        pointSize.push(6);
                    }
                    else {
                        pointSize.push(2);
                    }
                }

                return pointSize;
            },
            // props for table
            tableTitle: this.$t("additional:modules.tools.gfi.themes.trafficCount.tableTitleDay"),
            setColTitle: datetime => {
                return moment(datetime, "YYYY-MM-DD HH:mm:ss").format("HH:mm") + " " + this.$t("additional:modules.tools.gfi.themes.trafficCount.clockLabel");
            },
            setRowTitle: (meansOfTransports, datetime) => {
                const txt = moment(datetime, "YYYY-MM-DD HH:mm:ss").format("DD.MM.YYYY");

                switch (meansOfTransports) {
                    // search for "trafficCountSVAktivierung" to find all lines of code to switch Kfz to Kfz + SV
                    // use this code to enable Kfz + SV
                    /*
                    case "Anzahl_Kfz":
                        return txt + " " + this.$t("additional:modules.tools.gfi.themes.trafficCount.carsHeaderSuffix");
                    case "Anzahl_SV":
                        return txt + " " + this.$t("additional:modules.tools.gfi.themes.trafficCount.trucksHeaderSuffix");
                    */
                    default:
                        return txt;
                }
            },
            setFieldValue: value => {
                return thousandsSeparator(value);
            },
            dayInterval: "15-Min",
            diagramDay: "diagramDay",
            tableDay: "tableDay"
        };
    },
    watch: {
        dates (value) {
            this.dayDatepickerValueChanged(value);
        }
    },
    mounted () {
        moment.locale(i18next.language);
        this.dates.push(this.checkGurlittInsel ? moment().subtract(1, "days").toDate() : moment().toDate());
    },
    methods: {
        /**
         * Function is initially triggered and on update
         * @param   {Date[]} dates an unsorted array of selected dates of weekday
         * @fires   Alerting#RadioTriggerAlertAlert
         * @returns {Void}  -
         */
        dayDatepickerValueChanged: function (dates) {
            const api = this.api,
                thingId = this.thingId,
                meansOfTransport = this.meansOfTransport,
                timeSettings = [],
                minutesForMissingData = api instanceof DauerzaehlstellenRadApi ? 60 : 15;

            if (!Array.isArray(dates) || dates.length === 0) {
                this.apiData = [];
            }
            else {
                [...dates].sort((earlyDate, lateDate) => {
                    // Showing earlier date first
                    return earlyDate - lateDate;
                }).forEach(date => {
                    const fromDate = moment(date).format("YYYY-MM-DD");

                    timeSettings.push({
                        interval: this.dayInterval,
                        from: fromDate,
                        until: fromDate
                    });
                });

                api.updateDataset(thingId, meansOfTransport, timeSettings, datasets => {
                    if (Array.isArray(datasets)) {
                        datasets.forEach((transportData, idx) => {
                            const from = typeof timeSettings[idx] === "object" ? timeSettings[idx].from + " 00:00:00" : "";

                            Object.keys(transportData).forEach(transportKey => {
                                datasets[idx][transportKey] = addMissingDataDay(from, datasets[idx][transportKey], minutesForMissingData);
                            });
                        });
                    }

                    this.apiData = datasets;
                }, errormsg => {
                    this.apiData = [];

                    console.warn("The data received from api are incomplete:", errormsg);
                    Radio.trigger("Alert", "alert", {
                        content: "Die gewünschten Daten wurden wegen eines API-Fehlers nicht korrekt empfangen.",
                        category: "Info"
                    });
                });
            }
        },

        /**
         * Checks if the a date should be disabled.
         * @param {Date} date The date in question.
         * @param {Date[]} currentDates The list of selected dates.
         * @returns {Boolean} true if disabled, false if enabled.
         */
        isDateDisabled (date, currentDates) {
            if (!(date instanceof Date)) {
                return true;
            }
            const endDate = this.checkGurlittInsel ? moment().subtract(1, "days") : moment(),
                startDate = moment().subtract(7, "days"),
                question = moment(date);

            if (Array.isArray(currentDates) && currentDates.length >= 5) {
                for (let i = 0; i < 5; i++) {
                    if (question.isSame(moment(currentDates[i]))) {
                        return false;
                    }
                }
                return true;
            }

            startDate.subtract(1, "days");

            return question.isSameOrBefore(startDate) || question.isSameOrAfter(endDate);
        }
    }
};
</script>

<template>
    <div>
        <div
            id="dayDateSelector"
            class="dateSelector"
        >
            <DatePicker
                v-model="dates"
                aria-label="Datum"
                placeholder="Datum"
                type="date"
                format="DD.MM.YYYY"
                :multiple="true"
                :show-week-number="true"
                :disabled-date="isDateDisabled"
                title-format="DD.MM.YYYY"
                :lang="$t('common:libraries.vue2-datepicker.lang', {returnObjects: true})"
            />
        </div>
        <TrafficCountCheckbox
            :table-diagram-id="diagramDay"
        />
        <div id="diagramDay">
            <TrafficCountCompDiagram
                :api-data="apiData"
                :set-tooltip-value="setTooltipValue"
                :x-axis-ticks="xAxisTicks"
                :y-axis-ticks="yAxisTicks"
                :render-label-x-axis="renderLabelXAxis"
                :render-label-y-axis="renderLabelYAxis"
                :description-y-axis="descriptionYAxis"
                :render-label-legend="renderLabelLegend"
                :render-point-style="renderPointStyle"
                :render-point-size="renderPointSize"
            />
        </div>
        <TrafficCountCheckbox
            :table-diagram-id="tableDay"
        />
        <div id="tableDay">
            <TrafficCountCompTable
                :holidays="holidays"
                :current-tab-id="tab"
                :api-data="apiData"
                :table-title="tableTitle"
                :set-col-title="setColTitle"
                :set-row-title="setRowTitle"
                :set-field-value="setFieldValue"
            />
        </div>
    </div>
</template>

<style lang="scss">
#dayDateSelector {
    .mx-input {
        border-radius: 0px;
    }
}
</style>
