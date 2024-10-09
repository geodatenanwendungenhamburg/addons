<script>
import dayjs from "dayjs";
import {mapGetters} from "vuex";
import TemplateManagerExportProgressBar from "./TemplateManagerExportProgressBar.vue";
import PDFMaker from "../js/createPdf";
import {getTotal, getCulmulativeTotal} from "../../Dashboard/utils/operations";
import mapping from "../../assets/mapping.json";
import {createMapfishDialog} from "../../../valuationPrint/utils/createMapfishDialog";
import {getCenter as getCenterOfExtent} from "ol/extent";
import {startPrintProcess} from "../../../valuationPrint/utils/startPrintProcess.js";
import {unionFeatures} from "../../../valuationPrint/utils/unionFeatures";
import axios from "axios";
import {baseProportionTemplate, baseFixedTemplateForHamburg, mapfishServerConfig} from "../js/mapfishUtils";

export default {
    name: "TemplateManagerExport",
    components: {
        TemplateManagerExportProgressBar
    },
    props: {
        templateName: {
            type: String,
            required: false,
            default: ""
        },
        templateStatsCategories: {
            type: Array,
            required: false,
            default: () => []
        }
    },
    data: () => ({
        tagsOptionalComponents: [
            "Titelblatt inkl. Kartenausschnitt",
            "statistische Datenübersicht",
            "Datenvisualisierung"
        ],
        tagsInfrastructureData: [
            "Auflistung",
            "Kartendarstellung der Infrastrukturdaten",
            "Legenden",
            "Quellen"
        ],
        showProgressBar: false,
        percentage: 50,
        reportTitle: "",
        selectedAreasName: "",
        author: "",
        pdf: null
    }),
    computed: {
        ...mapGetters("Tools/Dashboard", ["items"]),
        ...mapGetters("Tools/FeaturesList", ["featuresListItems"]),
        ...mapGetters("Tools/DistrictSelector", ["selectedDistrictLevel", "selectedDistrictNames", "selectedFeatures"]),
        ...mapGetters(["getRestServiceById"]),
        ...mapGetters("Maps", ["projection"]),

        /**
         * Generates a file name for the report.
         * @returns {String} The file name.
         */
        downloadName () {
            const date = dayjs(this.dates).format("YYYY-MM-DD"),
                fileName = this.reportTitle ? this.reportTitle : this.templateName,
                prepareName = fileName.replace(/(?:\.(?![^.]+$)|[^\w.])+/g, "-");


            return prepareName + "-" + date + ".pdf";
        }
    },
    mounted () {
        this.pdf = new PDFMaker();
        this.pdf.resetDocContent();
    },
    methods: {
        /**
         * Show the view with the progress bar.
         * If the progress bar is displayed, the template import should not be shown.
         * @param {Boolean} val - if the progress bar should be shown.
         * @returns {void}
         */
        async manageProgressBarView (val) {
            this.pdf.resetDocContent();
            this.pdf.addHeader(this.reportTitle);
            this.pdf.setAuthor(this.author);
            await this.addOverViewPageToReport();
            this.addStatsToReport(this.items);
            this.addTopicsToReport(this.featuresListItems);
            this.pdf.download("report.pdf");
            this.showProgressBar = val;
            this.$emit("hideTemplateImport", !this.showProgressBar);
        },

        /**
         * Prepares the statistical data and adds it to the report.
         * @param {Object[]} items - Items from dashboard component.
         * @returns {void}
         */
        addStatsToReport (items) {
            const filteredMappingByCategories = mapping.filter(obj => {
                    return this.templateStatsCategories.includes(obj.value);
                }),
                groupedMapping = Object.groupBy(filteredMappingByCategories, (obj) => obj.group);

            this.pdf.addChapter("Statistische Datenübersicht");

            Object.keys(groupedMapping).forEach(group => {
                const columns = this.pdf.getColumns(["", "Ausgewähltes Gebiet", ...this.getStatCols(this.selectedDistrictLevel, this.selectedDistrictNames, [])]),
                    body = [columns];

                this.pdf.addHeadline(group);

                groupedMapping[group].forEach(mappingObject => {
                    const statFeature = items.find((item) => item.category === mappingObject.value),
                        lastYear = statFeature.years[0],
                        row = [];

                    columns.forEach((col, index) => {
                        let value,
                            alignment = "right";

                        if (index === 0) {
                            alignment = "left";
                            value = statFeature.category;
                        }
                        else if (index === 1) {
                            value = this.getTotal(statFeature, this.selectedDistrictNames, lastYear, "jahr_");

                            if (value === 0) {
                                value = "-";
                            }
                        }
                        else {
                            value = parseFloat(statFeature[col.text]["jahr_" + lastYear]) || "-";
                        }
                        this.pdf.addCell(row, value.toLocaleString(this.currentLocale), alignment);
                    });
                    body.push(row);
                });

                this.pdf.addTable(body, 120);
            });
        },

        /**
         * Adds the overview page to the report.
         * @returns {void}
         */
        async addOverViewPageToReport () {
            const imageName = "overviewMap",
                feature = this.selectedFeatures.length > 1 ? unionFeatures(this.selectedFeatures) : this.selectedFeatures[0],
                template = typeof feature !== "undefined" ? {...baseProportionTemplate} : {...baseFixedTemplateForHamburg},
                overviewImageUrl = await this.prepareImage(feature, template, this.projection.getCode(), imageName, mapfishServerConfig).catch(error => console.error(error));

            if (typeof overviewImageUrl === "string") {
                this.pdf.addChapter("Übersichtskarte");
                this.pdf.addImageByUrl(overviewImageUrl, imageName, {fit: [600, 600], alignment: "center"});
            }
        },

        /**
         * Prepares an image on mapfish and resolves an url to that image.
         * Rejects if an error occurs.
         * @param {ol/Feature} feature An feature to display on the image.
         * @param {Object} baseLayer The configuration for the base layer to use.
         * @param {String} projectionCode The projection code.
         * @param {String} imageName The image name.
         * @param {Object} serverConfig The config of which mapfish server and template to use.
         * @param {String} serverConfig.template The name of the template.
         * @param {String} serverConfig.name The name of the mapfish server (most of the time mapfish or mapfish_qs).
         * @returns {void}
         */
        prepareImage (feature, baseLayer, projectionCode, imageName, serverConfig) {
            const extent = feature?.getGeometry()?.getExtent(),
                baseLayerName = Object.keys(baseLayer)[0],
                mapfishDialog = createMapfishDialog(
                    typeof feature !== "undefined" ? {
                        center: getCenterOfExtent(extent),
                        extent,
                        feature,
                        featureList: [feature],
                        geometry: feature?.getGeometry()
                    } : undefined,
                    {},
                    baseLayer,
                    "",
                    projectionCode,
                    imageName
                );

            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    mapfishDialog.attributes.map = mapfishDialog.attributes[`${baseLayerName}.map`];
                    delete mapfishDialog.attributes[`${baseLayerName}.map`];
                    startPrintProcess(this.getRestServiceById(serverConfig.name).url, "png", serverConfig.template, mapfishDialog, (url, payload) => {
                        return axios.post(url, payload);
                    },
                    () => console.warn("ongoing"), // needs to be there. use for progressbar later on
                    error => {
                        reject(error);
                    },
                    downloadURL => {
                        resolve(downloadURL);
                    });
                }, 0);
            });
        },

        /**
         * Runs recursively through the district levels to get the names of the higher level districts.
         * @param {Object} districtLevel - The district level to which the district names belong.
         * @param {String[]} districtNames - The names of the needed districts.
         * @param {String[]} columns - The names of the columns.
         * @returns {String[]} The names of the columns
         */
        getStatCols (districtLevel, districtNames, columns) {
            const districts = districtLevel.displayAll
                    ? districtLevel.districts
                    : districtLevel.districts.filter(dist => districtNames.includes(dist.getName())),
                refDistrictNames = [];
            let refDistrictName, district;

            for (district of districts) {
                if (districtLevel.label !== this.selectedDistrictLevel.label) {
                    columns.push(district.getLabel());
                }

                refDistrictName = district.getReferencDistrictName();

                if (refDistrictName) {
                    refDistrictNames.push(refDistrictName);
                }
            }
            if (districtLevel.referenceLevel) {
                this.getStatCols(districtLevel.referenceLevel, refDistrictNames, columns);
            }

            return columns;
        },
        getCulmulativeTotal,
        getTotal,

        /**
         * Prepares the geospatial data and adds it to the report.
         * @param {Object[]} topics - Items from FeaturesList Component.
         * @returns {void}
         */
        addTopicsToReport (topics) {
            const groupedTopics = Object.groupBy(topics, (topic) => topic.layerName);

            this.pdf.addChapter("Infrastrukturdaten");
            Object.keys(groupedTopics).forEach(group => {
                const topicLength = groupedTopics[group].length,
                    columns = this.pdf.getColumns(["Typ der Einrichtung", "Name", "Adresse"], []),
                    body = topicLength <= 10 ? [columns] : [],
                    columnAttirbutes = ["type", "name", "address"];

                this.pdf.addHeadline(group);
                this.pdf.addParagraph(`Anzahl der ${group} im ausgewählten Gebiet: ${groupedTopics[group].length}`);

                if (topicLength <= 10) {
                    groupedTopics[group].forEach(topic => {
                        const row = [];

                        columnAttirbutes.forEach((attribute) => {
                            this.pdf.addCell(row, topic[attribute], "left");
                        });
                        body.push(row);
                    });
                    this.pdf.addTable(body, 120);
                }
            });
        }
    }
};
</script>

<template lang="html">
    <div class="container">
        <div class="row">
            <h5 class="col col-md-12 bold-headline py-0">
                {{ $t("additional:modules.tools.cosi.templateManager.exportFromTemplate") }}
            </h5>
            <h5 class="text-primary col col-md-12 pt-1">
                {{ templateName }}
            </h5>
            <form
                v-if="!showProgressBar"
                class="col col-md-12 mb-3 mt-0"
            >
                <div class="export-title mb-3">
                    <label
                        for="form-title"
                        class="form-label mb-0"
                    >
                        {{ $t("additional:modules.tools.cosi.templateManager.label.title") }}
                    </label>
                    <input
                        id="form-title"
                        v-model="reportTitle"
                        type="text"
                        class="form-control"
                    >
                </div>
                <div class="export-areas mb-3">
                    <label
                        for="form-selected-areas"
                        class="form-label mb-0"
                    >
                        {{ $t("additional:modules.tools.cosi.templateManager.label.selectedAreas") }}
                    </label>
                    <input
                        id="form-selected-areas"
                        v-model="selectedAreasName"
                        type="text"
                        class="form-control"
                    >
                </div>
                <div class="export-author mb-3">
                    <label
                        for="form-author"
                        class="form-label mb-0"
                    >
                        {{ $t("additional:modules.tools.cosi.templateManager.label.author") }}
                    </label>
                    <input
                        id="form-author"
                        v-model="author"
                        type="text"
                        class="form-control"
                    >
                </div>
                <fieldset>
                    <h5 class="bold-headline">
                        {{ $t("additional:modules.tools.cosi.templateManager.optionalComponents") }}
                    </h5>
                    <v-chip-group
                        column
                        multiple
                    >
                        <v-chip
                            v-for="tag in tagsOptionalComponents"
                            :key="tag"
                            :text="tag"
                            variant="outlined"
                            filter
                        >
                            {{ tag }}
                        </v-chip>
                    </v-chip-group>
                    <h6 class="bold-headline mt-3">
                        {{ $t("additional:modules.tools.cosi.templateManager.infrastructureData") }}
                    </h6>
                    <v-chip-group
                        column
                        multiple
                    >
                        <v-chip
                            v-for="chip in tagsInfrastructureData"
                            :key="chip"
                            :text="chip"
                            variant="outlined"
                            filter
                        >
                            {{ chip }}
                        </v-chip>
                    </v-chip-group>
                </fieldset>
                <button
                    class="btn btn-outline lh-1 fs-5 mt-4"
                    @click.prevent="manageProgressBarView(true)"
                >
                    <i
                        class="bi bi-play-circle"
                    />
                    {{ $t("additional:modules.tools.cosi.templateManager.generateReport") }}
                </button>
            </form>
            <TemplateManagerExportProgressBar
                v-else
                :download-name="downloadName"
                @closeProgressBar="manageProgressBarView(false)"
            />
        </div>
    </div>
</template>

<style scoped lang="scss">
@import "~variables";

.v-chip--active {
    background-color: #DCE2F3;
}
.bold-headline {
    color: $dark_blue;
    font-family: $font_family_accent;
}
.btn-outline {
    border-color: $light_blue;
    color: $light_blue;
}
.btn-outline:hover {
        cursor: pointer;
        background-color: $light_blue;
        color: $white;
}

</style>
<style lang="scss">
    @import "~variables";

.v-chip.v-size--default {
    font-size: 12px;
    height: 25px;
}

.v-chip .v-icon {
    font-size: 18px;
}

</style>
