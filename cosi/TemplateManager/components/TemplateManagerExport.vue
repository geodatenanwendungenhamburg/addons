<script>
import dayjs from "dayjs";
import TemplateManagerExportProgressBar from "./TemplateManagerExportProgressBar.vue";

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
        author: ""

    }),
    computed: {
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
    methods: {
        /**
         * Show the view with the progress bar.
         * If the progress bar is displayed, the template import should not be shown.
         * @param {Boolean} val - if the progress bar should be shown.
         * @returns {void}
         */
        manageProgressBarView (val) {
            this.showProgressBar = val;
            this.$emit("hideTemplateImport", !this.showProgressBar);
        }
    }
};
</script>

<template lang="html">
    <div class="container px-0">
        <div class="row">
            <h5 class="col col-md-12 bold-headline m-0 pb-0">
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
