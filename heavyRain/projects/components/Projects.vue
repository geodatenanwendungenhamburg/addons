<script>
import {mapGetters, mapActions, mapMutations} from "vuex";
import ProjectsEdit from "./ProjectsEdit.vue";
import HrFooter from "../../shared/components/HrFooter.vue";
import HrHeader from "../../shared/components/HrHeader.vue";
import HrSnackbar from "../../shared/components/HrSnackbar.vue";
import GeoJSON from "ol/format/GeoJSON";

export default {
    // eslint-disable-next-line vue/multi-word-component-names
    name: "Projects",
    components: {
        ProjectsEdit,
        HrFooter,
        HrHeader,
        HrSnackbar
    },
    data () {
        return {
            isCreating: false,
            showSnackbar: false,
            snackbarMessage: "",
            snackbarColor: "success"
        };
    },
    computed: {
        ...mapGetters("Modules/Projects", ["projectList", "currentProject"])
    },
    async mounted () {
        await this.addNewLayerIfNotExists({layerName: "projects_layer"}, {id: "EingezeichneteProjekte"}, {root: true});

        if (this.projectList.length > 0) {
            this.projectList.forEach(p => {
                if (p.geometry) {
                    this.$store.dispatch("Map/addFeatureToLayer", {
                        feature: p.geometry,
                        layerId: "projects_layer"
                    });
                }
            });
        }
    },
    methods: {
        ...mapActions("Maps", ["addNewLayerIfNotExists"]),
        ...mapMutations("Modules/Projects", ["setProjectList", "setCurrentProject"]),

        /**
         * Switches to edit mode.
         * @returns {void}
         */
        onEditProject (project) {
            this.setCurrentProject(project);
            this.isCreating = true;
        },

        /**
         * Switches to creation mode with a clean object.
         * @returns {void}
         */
        toggleCreateMode () {
            this.setCurrentProject({
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
                protectedAreas: ""
            });
            this.isCreating = true;
        },

        /**
         * Returns to the list view.
         * @returns {void}
         */
        onCancel () {
            this.isCreating = false;
            this.setCurrentProject({});
        },

        /**
         * Zooms the map to the project extent.
         * @returns {void}
         */
        zoomToProject (project) {
            if (!project.geometry) {
                this.showSnackbarMessage(this.$t("additional:modules.projects.messages.noGeometry"), "warning");
                return;
            }
            try {
                const geojsonFormat = new GeoJSON();
                let feature;

                if (project.geometry.type === "Feature") {
                    feature = geojsonFormat.readFeature(project.geometry);
                }
                else {
                    feature = geojsonFormat.readFeature({
                        type: "Feature",
                        geometry: project.geometry,
                        properties: {}
                    });
                }
                const extent = feature.getGeometry().getExtent();

                this.$store.dispatch("Maps/zoomToExtent", {
                    extent: extent,
                    options: {duration: 800}
                });
            }
            catch (error) {
                this.showSnackbarMessage(this.$t("additional:modules.projects.messages.geometryError"), "error");
            }
        },

        /**
         * Displays a snackbar message with a specific color.
         * Resets the snackbar state first to ensure the animation triggers even if the message is the same.
         * @param {String} message - The text message to be displayed.
         * @param {String} [color="success"] - The color/state of the snackbar (e.g., 'success', 'warning', 'error').
         * @returns {void}
         */
        showSnackbarMessage (message, color = "success") {
            this.showSnackbar = false;
            this.snackbarMessage = "";
            this.$nextTick(() => {
                this.snackbarMessage = message;
                this.snackbarColor = color;
                setTimeout(() => {
                    if (this.snackbarMessage) {
                        this.showSnackbar = true;
                    }
                }, 50);
            });
        },

        /**
         * Validates and saves the current project.
         * Updates an existing project if it has a UID, otherwise creates a new one.
         * Triggers validation messages if name or geometry are missing.
         * @returns {void}
         */
        onSave () {
            const index = this.projectList.findIndex(p => p.uid === this.currentProject.uid),
                isExistingProject = index !== -1;

            let newList,
                successMessage;

            if (isExistingProject) {
                newList = [...this.projectList];
                newList[index] = {...this.currentProject};
                successMessage = this.$t("additional:modules.projects.messages.updateSuccess");
            }
            else {
                newList = [...this.projectList, {...this.currentProject, uid: Date.now()}];
                successMessage = this.$t("additional:modules.projects.messages.saveSuccess");
            }

            this.setProjectList(newList);
            this.isCreating = false;
            this.showSnackbarMessage(successMessage, "success");
            this.setCurrentProject({});
        }
    }
};
</script>

<template lang="html">
    <div class="projects-container">
        <div v-if="!isCreating">
            <HrHeader
                :text="$t('additional:modules.projects.description')"
                :button-text="$t('additional:modules.projects.createProject')"
                @click:button="toggleCreateMode"
            />
            <div
                v-if="projectList.length !== 0"
                class="project-detail-view"
            >
                <div class="detail-header mb-4">
                    <h5 class="headline">
                        <i class="bi bi-flag-fill me-2" />
                        {{ $t('additional:modules.projects.infoTitle') }}
                    </h5>
                </div>

                <div class="hr-detail-card shadow-sm p-4 bg-white rounded position-relative">
                    <div class="badges mb-3">
                        <span class="badge rounded-pill me-2">Bauprojekte (Umsetzungsmaßnahmen)</span>
                        <span class="badge rounded-pill">Bereiche aus Postfach</span>
                    </div>

                    <h2 class="project-title mb-4">
                        {{ currentProject.name }}
                    </h2>

                    <div class="row g-3 mb-4">
                        <div class="col-6 border-end">
                            <span class="detail-label">{{ $t('additional:modules.projects.labels.createdBy') }}</span>
                            <p class="detail-value">
                                {{ currentProject.createdBy }} createdBy
                            </p>
                        </div>
                        <div class="col-6 ps-4 text-end">
                            <span class="detail-label">{{ $t('additional:modules.projects.labels.lastUpdate') }}</span>
                            <p class="detail-value">
                                23.02.2026
                            </p>
                        </div>
                        <div class="col-4">
                            <span class="detail-label">{{ $t('additional:modules.projects.labels.startDate') }}</span>
                            <p class="detail-value">
                                {{ currentProject.startDate }} 23.02.2026
                            </p>
                        </div>
                        <div class="col-4">
                            <span class="detail-label">{{ $t('additional:modules.projects.labels.endDate') }}</span>
                            <p class="detail-value">
                                {{ currentProject.endDate }} 23.02.2026
                            </p>
                        </div>
                        <div class="col-4">
                            <span class="detail-label">{{ $t('additional:modules.projects.labels.contact') }}</span>
                            <p class="detail-value">
                                {{ currentProject.contactExt }} contactExt
                            </p>
                        </div>
                    </div>

                    <div class="detail-section mb-3">
                        <span class="detail-label">{{ $t('additional:modules.projects.labels.description') }}</span>
                        <p class="detail-value text-muted">
                            {{ currentProject.description }} description
                        </p>
                        <a
                            v-if="currentProject.infolink"
                            :href="currentProject.infolink"
                            target="_blank"
                            class="d-block mt-2"
                        >
                            {{ currentProject.infolink }}
                        </a>
                        infolink
                    </div>

                    <div class="detail-section mb-3">
                        <span class="detail-label">{{ $t('additional:modules.projects.labels.source') }}</span>
                        <p class="detail-value">
                            {{ currentProject.quelle }} quelle
                        </p>
                    </div>

                    <div class="detail-section mb-3">
                        <span class="detail-label">{{ $t('additional:modules.projects.labels.contactExt') }}</span>
                        <p class="detail-value">
                            {{ currentProject.contactExt }} contactExt
                        </p>
                    </div>

                    <div class="detail-section mb-3">
                        <span class="detail-label">{{ $t('additional:modules.projects.labels.history') }}</span>
                        <p class="detail-value">
                            {{ currentProject.history }} history
                        </p>
                    </div>

                    <div class="detail-section">
                        <span class="detail-label">{{ $t('additional:modules.projects.labels.protectedAreas') }}</span>
                        <p class="detail-value">
                            {{ currentProject.protectedAreas }} protectedAreas
                        </p>
                    </div>

                    <div class="detail-actions d-flex justify-content-end align-items-center mt-4">
                        <i
                            class="bi bi-paperclip fs-4 me-3 text-muted"
                            style="cursor:pointer"
                        />
                        <button
                            class="btn btn-primary edit-fab shadow"
                            @click="onEditProject(currentProject)"
                        >
                            <i class="bi bi-pencil-fill" />
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div v-else>
            <ProjectsEdit />
            <HrFooter
                :cancel-text="$t('additional:modules.projects.cancelButtonLabel')"
                :save-text="$t('additional:modules.projects.saveButtonLabel')"
                @click:save="onSave"
                @click:cancel="onCancel"
            />
        </div>

        <HrSnackbar
            :model-value="showSnackbar"
            :message="snackbarMessage"
            :color="snackbarColor"
            @update:model-value="val => showSnackbar = val"
        />
    </div>
</template>

<style lang="scss" scoped>
.projects-container {

    .headline {
        color: #333;
        font-family: "MasterPortalFont Bold", Arial, sans-serif;
    }

    .hr-detail-card {
        border: 1px solid #e0e0e0;

        .badge {
            background-color: #a01e5a;
            padding: 0.6rem 1.2rem;
            font-weight: normal;
        }

        .project-title {
            color: #333;
            font-size: 1.75rem;
            font-family: "Arial", sans-serif;
        }

        .detail-label {
            font-weight: bold;
            font-size: 0.85rem;
            color: #000;
            display: block;
            margin-bottom: 2px;
        }

        .detail-value {
            font-size: 0.9rem;
            color: #555;
            margin-bottom: 1rem;
            line-height: 1.4;
        }

        .edit-fab {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background-color: #3C5F94;
            border: none;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }
}
</style>
