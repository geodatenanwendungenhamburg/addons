<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import SpinnerItem from "@shared/modules/spinner/components/SpinnerItem.vue";
import TabContainer from "@shared/modules/tabs/components/TabContainer.vue";
import LandRegistryFileDetails from "./LandRegistryFileDetails.vue";
import LandRegistryFileResults from "./LandRegistryFileResults.vue";
import LandRegistryFileSearch from "./LandRegistryFileSearch.vue";

export default {
    name: "LandRegistryFile",
    components: {
        SpinnerItem,
        TabContainer
    },
    data () {
        return {
            tabWatcherAttached: false,
            unwatchTabContainer: null
        };
    },
    computed: {
        ...mapGetters("Modules/LandRegistryFile", [
            "showLoadingSpinner",
            "getSortedFeatures",
            "selectedDetailFeatureId"
        ]),
        loadingSpinnerText () {
            return this.$t("additional:modules.landRegistryFile.loadingSpinnerText.general");
        },
        tabs () {
            return [
                {
                    id: "tabSearch",
                    contentId: "tabSearchContent",
                    ref: "tabSearch",
                    label: this.$t("additional:modules.landRegistryFile.tabs.tabSearch.label"),
                    component: LandRegistryFileSearch,
                    propsForTabContent: {},
                    renderComponent: true
                },
                {
                    id: "tabResults",
                    contentId: "tabResultsContent",
                    ref: "tabResults",
                    label: this.$t("additional:modules.landRegistryFile.tabs.tabResults.label"),
                    component: LandRegistryFileResults,
                    propsForTabContent: {},
                    renderComponent: true
                },
                {
                    id: "tabDetails",
                    contentId: "tabDetailsContent",
                    ref: "tabDetails",
                    label: this.$t("additional:modules.landRegistryFile.tabs.tabDetails.label"),
                    component: LandRegistryFileDetails,
                    propsForTabContent: {},
                    renderComponent: true
                }
            ];
        }
    },
    /**
     * KeepAlive: This addon uses the Masterportal module caching feature,
     * see docs/Dev/vueComponents/ModuleCaching.md
     * The mounted hook is only called once, when the component is created the first time.
     * The activated and deactivated hooks are called, when the component is
     * shown or closed via "menu" link.
     */
    async mounted () {
        if (this.oafSchema) {
            return;
        }

        this.queryOafSchema();
    },
    async activated () {
        await this.attachTabWatcher();
    },
    deactivated () {
        if (this.unwatchTabContainer) {
            this.unwatchTabContainer();
            this.unwatchTabContainer = null;
        }
        this.tabWatcherAttached = false;
    },
    methods: {
        ...mapActions("Modules/LandRegistryFile", [
            "queryOafSchema"
        ]),
        ...mapMutations("Modules/LandRegistryFile", [
            "setShowLoadingSpinner",
            "setSelectedDetailFeatureId"
        ]),
        /**
         * Handle tab changes in the TabContainer.
         * @param {Object} tabContainerRef - Reference to the TabContainer component.
         * @param {string} newTabId - Id of the newly activated tab.
         * @param {string} oldTabId - Id of the previously active tab.
         */
        handleTabChange (tabContainerRef, newTabId, oldTabId) {
            const tabResults = tabContainerRef.$refs.tabResults?.[0];

            if (newTabId === "tabDetails" && !this.selectedDetailFeatureId && this.getSortedFeatures.length > 0) {
                this.setSelectedDetailFeatureId(this.getSortedFeatures[0].id);
            }

            if (oldTabId === "tabDetails" && newTabId === "tabResults") {
                this.$nextTick(() => {
                    if (this.selectedDetailFeatureId) {
                        tabResults?.updatePageToShowSelectedFeature(this.selectedDetailFeatureId);
                        tabResults?.scrollToSelectedDetail();
                    }
                });
            }
        },
        /**
         * Activates a watcher on the activeTabIdLocal of the TabContainer to react to tab changes.
         * Calls handleTabChange when the active tab changes.
         */
        async attachTabWatcher () {
            if (this.tabWatcherAttached) {
                return;
            }
            await this.$nextTick();

            const tabContainerRef = this.$refs.tabContainer;

            if (!tabContainerRef) {
                return;
            }
            this.tabWatcherAttached = true;

            this.unwatchTabContainer = tabContainerRef.$watch("activeTabIdLocal", (newTabId, oldTabId) => {
                this.handleTabChange(tabContainerRef, newTabId, oldTabId);
            });
        }
    }
};
</script>

<template lang="html">
    <div id="landRegistryFile">
        <div class="LayoutFrame">
            <div
                v-if="showLoadingSpinner"
                class="loadingSpinner"
            >
                <SpinnerItem
                    custom-class="spinner"
                    class="ms-3"
                />

                <p v-if="loadingSpinnerText">
                    {{ loadingSpinnerText }}
                </p>
            </div>

            <TabContainer
                v-show="!showLoadingSpinner"
                ref="tabContainer"
                class="TabContainer"
                :tabs="tabs"
                initial-active-tab-id="tabSearch"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
    #landRegistryFile {
        height: 100%;
        display: flex;
        flex-direction: column;
        min-height: 0;

        div.loadingSpinner {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            gap: 2rem;
            align-items: center;
            justify-content: center;
            background: rgba(255,255,255,0.7);
            z-index: 2;

            div.spinner {
                width: 4rem;
                height: 4rem;
            }

            p {
                background-color: white;
                white-space: pre-line;
                padding: 1.5rem;
            }
        }

        :deep(div.LayoutFrame) {
            flex: 1 1 auto;
            display: flex;
            flex-direction: column;
            position: relative;
            min-height: 0;
            overflow: hidden;

            div.TabContainer {
                height: unset;
                display: flex;
                flex-direction: column;
                flex: 1 1 0%;
                min-height: 0;

                div.tab-content {
                    height: unset;
                    display: flex;
                    flex-direction: column;
                    flex: 1 1 0%;
                    min-height: 0;
                }
            }

            div.InnerLayoutFrame {
                flex: 1 1 auto;
                display: flex;
                flex-direction: column;
                min-height: 0;
            }

            div.FixedContent {
                display: flex;
                flex-shrink: 0;
                gap: 0.5rem;

                &.top-header {
                    padding: 1rem 0.25rem 0.25rem;
                }

                &.buttons-footer {
                    padding: 0.5rem 0.25rem 0.25rem;
                }

                button {
                    margin-bottom: 0;
                }
            }

            div.ScrollableContent {
                padding: 0.25rem;
                display: flex;
                flex-direction: column;
                flex: 1 1 auto;
                min-height: 0;
                overflow-y: auto;
            }
        }

        :deep(.flat-button:focus-visible),
        :deep(.action-button:focus-visible) {
            color: #fff;
            background-color: #151C27;
            box-shadow: 0 0 0 0.25rem rgba(60, 95, 148, 0.5);
        }

        :deep(.form-switch input:focus-visible) {
            box-shadow: 0 0 0 0.25rem rgba(60, 95, 148, 0.5);
        }
    }
</style>
