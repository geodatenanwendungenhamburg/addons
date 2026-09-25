<script>
import {mapGetters, mapMutations} from "vuex";
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
    computed: {
        ...mapGetters("Modules/LandRegistryFile", [
            "showLoadingSpinner"
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
        // this.setShowLoadingSpinner(true);
    },
    activated () {
        // Handle KeepAlive visibility. Triggered if component is activated
    },
    deactivated () {
        // Handle KeepAlive visibility. Triggered if component is deactivated
    },
    methods: {
        ...mapMutations("Modules/LandRegistryFile", [
            "setShowLoadingSpinner"
        ])
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
    #landRegistryFile{
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
                    padding-top: 1rem;
                    padding-bottom: 0.25rem;
                }

                &.buttons-footer {
                    padding-top: 0.5rem;
                    padding-bottom: 0;
                }

                button {
                    margin-bottom: 0;
                }
            }

            div.ScrollableContent {
                display: flex;
                flex-direction: column;
                flex: 1 1 auto;
                min-height: 0;
                overflow-y: auto;
                padding-right: 0.5rem;
            }
        }
    }
</style>
