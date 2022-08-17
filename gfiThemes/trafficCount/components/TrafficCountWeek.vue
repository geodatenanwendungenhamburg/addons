<script>
import TrafficCountCompDiagram from "./TrafficCountCompDiagram.vue";
import TrafficCountCompTable from "./TrafficCountCompTable.vue";
import TrafficCountCheckbox from "./TrafficCountCheckbox.vue";
import thousandsSeparator from "../../../../src/utils/thousandsSeparator.js";
import moment from "moment";
import DatePicker from "vue2-datepicker";
import "vue2-datepicker/index.css";
import {addMissingDataWeek} from "../utils/addMissingData.js";
import {getPublicHoliday} from "../../../../src/utils/calendar.js";

export default {
    name: "TrafficCountWeek",
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
        }
    },
    data () {
        return {
            tab: "week",
            apiData: [],
            dates: null,
            showPreviousWeekUntilThisWeekday: 1,

            // props for diagram
            setTooltipValue: (tooltipItem) => {
                return moment(tooltipItem.datetime, "YYYY-MM-DD HH:mm:ss").format("DD.MM.YYYY") + ": " + thousandsSeparator(tooltipItem.value);
            },
            yAxisTicks: 8,
            renderLabelXAxis: (datetime) => {
                return moment(datetime, "YYYY-MM-DD HH:mm:ss").format("dd");
            },
            renderLabelYAxis: (yValue) => {
                return thousandsSeparator(yValue);
            },
            descriptionYAxis: i18next.t("additional:modules.tools.gfi.themes.trafficCount.yAxisTextWeek"),
            renderLabelLegend: (datetime) => {
                const weeknumber = moment(datetime, "YYYY-MM-DD HH:mm:ss").week(),
                    year = moment(datetime, "YYYY-MM-DD HH:mm:ss").format("YYYY");

                return this.calendarweek + " " + weeknumber + " / " + year;
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
            tableTitle: i18next.t("additional:modules.tools.gfi.themes.trafficCount.tableTitleWeek") ? i18next.t("additional:modules.tools.gfi.themes.trafficCount.tableTitleWeek") : "",
            setColTitle: datetime => {
                return moment(datetime, "YYYY-MM-DD HH:mm:ss").format("dd");
            },
            setRowTitle: (meansOfTransports, datetime) => {
                let txt = "";

                txt += this.calendarweek + moment(datetime, "YYYY-MM-DD HH:mm:ss").format("WW");
                // for the year (YYYY) we have to add 3 days to get the thursday of the week
                txt += "/" + moment(datetime, "YYYY-MM-DD HH:mm:ss").add(3, "days").format("YYYY");
                txt += " (" + moment(datetime, "YYYY-MM-DD HH:mm:ss").format("dd, DD.MM.YYYY") + ")";

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
            weekInterval: "1-Tag",
            diagramWeek: "diagramWeek",
            tableWeek: "tableWeek"
        };
    },
    computed: {
        calendarweek: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.calendarweek");
        }
    },
    watch: {
        dates (value) {
            if (value) {
                this.weekDatepickerValueChanged([value]);
            }
            else {
                this.weekDatepickerValueChanged([]);
            }
        }
    },
    mounted () {
        moment.locale(i18next.language);

        if (moment().isoWeekday() <= this.showPreviousWeekUntilThisWeekday) {
            this.dates = moment().subtract(7, "days").toDate();
        }
        else {
            this.dates = moment().toDate();
        }
    },
    methods: {
        /**
         * Function is initially triggered and on update
         * @param   {Date[]} dates an unsorted array of selected dates of weekday
         * @fires   Alerting#RadioTriggerAlertAlert
         * @returns {Void}  -
         */
        weekDatepickerValueChanged: function (dates) {
            const api = this.api,
                thingId = this.thingId,
                meansOfTransport = this.meansOfTransport,
                timeSettings = [];

            if (!Array.isArray(dates) || dates.length === 0) {
                this.apiData = [];
            }
            else {
                [...dates].sort((earlyDate, lateDate) => {
                    // Showing earlier date first
                    return earlyDate - lateDate;
                }).forEach(date => {
                    timeSettings.push({
                        interval: this.weekInterval,
                        from: moment(date).startOf("isoWeek").format("YYYY-MM-DD"),
                        until: moment(date).endOf("isoWeek").format("YYYY-MM-DD")
                    });
                });

                api.updateDataset(thingId, meansOfTransport, timeSettings, datasets => {
                    if (Array.isArray(datasets)) {
                        datasets.forEach((transportData, idx) => {
                            const from = typeof timeSettings[idx] === "object" ? timeSettings[idx].from + " 00:00:00" : "";

                            Object.keys(transportData).forEach(transportKey => {
                                datasets[idx][transportKey] = addMissingDataWeek(from, datasets[idx][transportKey]);
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
                startDate = moment("2020-01-01") > moment().subtract(1, "year") ? moment("2020-01-01") : moment().subtract(1, "year"),
                question = moment(date);

            if (Array.isArray(currentDates) && currentDates.length >= 5) {
                for (let i = 0; i < 5; i++) {
                    if (question.isSame(moment(currentDates[i]))) {
                        return false;
                    }
                }
                return true;
            }

            return question.isSameOrBefore(startDate) || question.isSameOrAfter(endDate);
        }
    }
};
</script>

<template>
    <div>
        <div
            id="weekDateSelector"
            class="dateSelector"
        >
            <DatePicker
                v-model="dates"
                aria-label="Datum"
                placeholder="Datum"
                type="week"
                format="KW ww"
                :multiple="true"
                :show-week-number="true"
                :disabled-date="isDateDisabled"
                title-format="DD.MM.YYYY"
                :lang="$t('common:libraries.vue2-datepicker.lang', {returnObjects: true})"
            />
        </div>
        <TrafficCountCheckbox
            :table-diagram-id="diagramWeek"
        />
        <div id="diagramWeek">
            <TrafficCountCompDiagram
                :api-data="apiData"
                :set-tooltip-value="setTooltipValue"
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
            :table-diagram-id="tableWeek"
        />
        <div id="tableWeek">
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
#weekDateSelector {
    .mx-input {
        border-radius: 0px;
    }
}
</style>
