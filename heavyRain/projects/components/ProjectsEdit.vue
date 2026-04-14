<script>
import HrDraw from "../../shared/components/HrDraw.vue";
import {mapGetters, mapMutations} from "vuex";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import FileUpload from "@shared/modules/inputs/components/FileUpload.vue";

export default {
    name: "ProjectsEdit",
    components: {
        HrDraw,
        InputText,
        FileUpload
    },
    props: {
        /**
         * Optional project data passed when editing an existing project.
         */
        initialData: {
            type: Object,
            default: () => ({})
        }
    },
    emits: ["update:project"],
    data () {
        return {
            uid: Date.now(),
            project: {
                name: "",
                criteria: "",
                createdBy: "",
                startDate: "",
                endDate: "",
                contact: "",
                description: "",
                geometry: null,
                quelle: "",
                contactExt: "",
                infolink: "",
                history: "",
                protectedAreas: "",
                // Merge initial data if present to override defaults
                ...this.initialData
            }
        };
    },
    computed: {
        ...mapGetters("Modules/Projects", ["currentProject"])
    },
    watch: {
        /**
         * Watch the local project object and emit changes to the parent component.
         */
        project: {
            handler (newVal) {
                this.$emit("update:project", newVal);
            },
            deep: true
        }
    },
    methods: {
        ...mapMutations("Modules/Projects", ["setCurrentProject"]),

        /**
         * Triggered when a geometry is finalized in the HrDraw component.
         * @param {Object} geojson - The GeoJSON feature emitted by HrDraw.
         * @returns {void}
         */
        handleDrawUpdate (geojson) {
            this.setCurrentProject({
                ...this.currentProject,
                geometry: geojson
            });
        },

        /**
         * Helper function to update specific form fields in the Vuex store.
         * @param {String} field - The key of the field to update.
         * @param {any} value - The new value for the field.
         * @returns {void}
         */
        updateField (field, value) {
            this.setCurrentProject({
                ...this.currentProject,
                [field]: value
            });
        }
    }
};
</script>

<template lang="html">
    <div class="projects-edit mt-3">
        <div class="mb-4">
            <h5 class="headline mb-3">
                {{ currentProject && currentProject.uid ? $t('additional:modules.projects.editProject') : $t('additional:modules.projects.createProject') }}
            </h5>
            <p>{{ $t('additional:modules.projects.description') }}</p>
        </div>

        <div>
            <h5 class="mb-3">
                {{ $t('additional:modules.projects.drawTitle') }}
            </h5>
            <HrDraw @update:drawn-geojson-feature="handleDrawUpdate" />
        </div>

        <hr class="my-4">

        <div class="row g-3">
            <div class="col-12">
                <h5 class="mb-1">
                    {{ $t('additional:modules.projects.detailsTitle') }}
                </h5>
                <p>{{ $t('additional:modules.projects.detailsDescription') }}</p>
            </div>

            <div class="col-12">
                <InputText
                    :id="'project-name-' + uid"
                    v-model="currentProject.name"
                    :label="$t('additional:modules.projects.labels.projectName')"
                    :placeholder="$t('additional:modules.projects.labels.projectName')"
                />
            </div>

            <div class="col-12">
                <InputText
                    :id="'criteria-' + uid"
                    v-model="currentProject.criteria"
                    :label="$t('additional:modules.projects.labels.criteria')"
                    :placeholder="$t('additional:modules.projects.labels.criteria')"
                />
            </div>

            <div class="col-12">
                <InputText
                    :id="'createdBy-' + uid"
                    v-model="currentProject.createdBy"
                    :label="$t('additional:modules.projects.labels.createdBy')"
                    :placeholder="$t('additional:modules.projects.labels.createdBy')"
                />
            </div>

            <div class="col-6">
                <InputText
                    :id="'startDate-' + uid"
                    v-model="currentProject.startDate"
                    type="date"
                    :label="$t('additional:modules.projects.labels.startDate')"
                    :placeholder="'YYYY-MM-DD'"
                />
            </div>
            <div class="col-6">
                <InputText
                    :id="'endDate-' + uid"
                    v-model="currentProject.endDate"
                    type="date"
                    :label="$t('additional:modules.projects.labels.endDate')"
                    :placeholder="'YYYY-MM-DD'"
                />
            </div>

            <div class="col-12">
                <InputText
                    :id="'quelle-' + uid"
                    v-model="currentProject.quelle"
                    :label="$t('additional:modules.projects.labels.source')"
                    :placeholder="$t('additional:modules.projects.labels.source')"
                />
            </div>
            <div class="col-12">
                <InputText
                    :id="'contact-' + uid"
                    v-model="currentProject.contact"
                    :label="$t('additional:modules.projects.labels.contact')"
                    :placeholder="$t('additional:modules.projects.labels.contact')"
                />
            </div>

            <div class="col-12">
                <InputText
                    :id="'contactExt-' + uid"
                    v-model="currentProject.contactExt"
                    html-type="textarea"
                    :label="$t('additional:modules.projects.labels.contactExt')"
                    :placeholder="$t('additional:modules.projects.labels.contactExt')"
                />
            </div>
            <div class="col-12">
                <InputText
                    :id="'infolink-' + uid"
                    v-model="currentProject.infolink"
                    :label="$t('additional:modules.projects.labels.infolink')"
                    :placeholder="'https://...'"
                />
            </div>

            <div class="col-12">
                <InputText
                    :id="'description-' + uid"
                    v-model="currentProject.description"
                    html-type="textarea"
                    :label="$t('additional:modules.projects.labels.description')"
                    :placeholder="$t('additional:modules.projects.labels.description')"
                />
            </div>
            <div class="col-12">
                <InputText
                    :id="'history-' + uid"
                    v-model="currentProject.history"
                    html-type="textarea"
                    :label="$t('additional:modules.projects.labels.history')"
                    :placeholder="$t('additional:modules.projects.labels.history')"
                />
            </div>

            <div class="col-12">
                <InputText
                    :id="'protectedAreas-' + uid"
                    v-model="currentProject.protectedAreas"
                    html-type="textarea"
                    :label="$t('additional:modules.projects.labels.protectedAreas')"
                    :placeholder="$t('additional:modules.projects.labels.protectedAreas')"
                />
            </div>

            <div class="col-12">
                <h5 class="mb-2">
                    {{ $t('additional:modules.projects.labels.fileUpload') }}
                </h5>
                <FileUpload
                    class="mb-5"
                    :change="() => undefined"
                    :drop="() => undefined"
                />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.projects-edit {
    .form-label {
        color: var(--bs-secondary);
    }
}
.headline {
    color: #3C5F94;
    font-family: "MasterPortalFont Bold", "Arial Narrow Bold", Arial, sans-serif;
}
</style>
