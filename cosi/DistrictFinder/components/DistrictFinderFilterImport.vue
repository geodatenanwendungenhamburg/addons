<script>
import {mapActions} from "vuex";

export default {
    name: "DistrictFinderFilterImport",
    emits: ["setConditionDate", "setConditionTitle", "setCardList"],
    methods: {
        ...mapActions("Alerting", ["addSingleAlert"]),

        /**
         * Loading the data from files.
         * @param {Event} evt - A input change event.
         * @returns {void}
         */
        loadFiles (evt) {
            for (const file of evt.target.files) {
                if (!file.type.match("application/json")) {
                    this.addSingleAlert({
                        content: `${file.name}: ${this.$t("additional:modules.tools.cosi.districtFinder.errors.wrongFileFormat")}`,
                        category: "Warning",
                        displayClass: "warning"
                    });
                    continue;
                }
                const reader = new FileReader();

                reader.onload = this.parseFileContent;
                reader.readAsText(file);
            }
            this.$refs.form.reset();
        },

        /**
         * Parses the file content to JSON and emits it.
         * @param {Event} evt - A file reader load event.
         * @returns {void}
         */
        parseFileContent (evt) {
            let filter = {};

            try {
                filter = JSON.parse(evt?.target?.result);
            }
            catch (err) {
                this.addSingleAlert({
                    content: `${this.$t("additional:modules.tools.cosi.districtFinder.errors.invalid")}`,
                    category: "Warning",
                    displayClass: "warning"
                });
                return;
            }

            if (!Object.prototype.hasOwnProperty.call(filter, "meta")) {
                const attribute = "meta";

                this.addSingleAlert({
                    content: `${this.$t("additional:modules.tools.cosi.districtFinder.errors.invalid")} ${this.$t("additional:modules.tools.cosi.districtFinder.errors.attErr", {attribute})}`,
                    category: "Warning",
                    displayClass: "warning"
                });
                return;
            }
            if (!Object.prototype.hasOwnProperty.call(filter?.meta, "date")) {
                const attribute = "date";

                this.addSingleAlert({
                    content: `${this.$t("additional:modules.tools.cosi.districtFinder.errors.invalid")} ${this.$t("additional:modules.tools.cosi.districtFinder.errors.attErr", {attribute})}`,
                    category: "Warning",
                    displayClass: "warning"
                });
                return;
            }
            if (!Object.prototype.hasOwnProperty.call(filter?.meta, "name")) {
                const attribute = "name";

                this.addSingleAlert({
                    content: `${this.$t("additional:modules.tools.cosi.districtFinder.errors.invalid")} ${this.$t("additional:modules.tools.cosi.districtFinder.errors.attErr", {attribute})}`,
                    category: "Warning",
                    displayClass: "warning"
                });
                return;
            }
            if (!Object.prototype.hasOwnProperty.call(filter, "data")) {
                const attribute = "data";

                this.addSingleAlert({
                    content: `${this.$t("additional:modules.tools.cosi.districtFinder.errors.invalid")} ${this.$t("additional:modules.tools.cosi.districtFinder.errors.attErr", {attribute})}`,
                    category: "Warning",
                    displayClass: "warning"
                });
                return;
            }

            this.$emit("setConditionDate", filter.meta.date);
            this.$emit("setConditionTitle", filter.meta.name);
            this.$emit("setCardList", filter.data);
        },

        /**
         * Triggers the click event on the file input to open the explorer.
         * @returns {void}
         */
        triggerFileInput () {
            this.$el.querySelector("#file-input").click();
        }
    }
};
</script>

<template lang="html">
    <div id="district-finder-import">
        <button
            class="btn btn-outline lh-1 fs-5 mb-3"
            @click="triggerFileInput"
        >
            <i class="bi bi-upload pe-2" />
            {{ $t("additional:modules.tools.cosi.districtFinder.button.import") }}
        </button>
        <form ref="form">
            <label for="file-input">
                <input
                    id="file-input"
                    type="file"
                    class="d-none"
                    @change="loadFiles"
                >
            </label>
        </form>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #district-finder-import {
        font-family: $font_family_default;

        .btn-outline {
            border-color: $light_blue;
            color: $light_blue;
        }
       .btn-outline:hover {
            cursor: pointer;
            background-color: $light_blue;
            color: $white;
       }

       form {
            height: 0;
       }
    }

</style>
