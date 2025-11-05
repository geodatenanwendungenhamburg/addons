<script>
import NavTab from "@shared/modules/tabs/components/NavTab.vue";
import TabNewContent from "./tabs/TabNewContent.vue";
import TabListContent from "./tabs/TabListContent.vue";
import TabFilterContent from "./tabs/TabFilterContent.vue";
import {mapGetters, mapActions, mapMutations} from "vuex";

export default {
    name: "GeoMarker",
    components: {
        NavTab,
        TabListContent,
        TabNewContent,
        TabFilterContent
    },
    data () {
        return {
            fullyLoaded: false
        };
    },
    computed: {
        ...mapGetters("Modules/GeoMarker", [
            "categories",
            "departments",
            "geoMarkerActiveTab",
            "geoMarkerEditLayerId",
            "rollbackGeoMarkerFeature",
            "geoMarkerFeatureList",
            "newGeoMarkerCreated",
            "newGeoMarkerFeature",
            "frozenNewGeoMarkerFeature"
        ]),
        ...mapGetters(["allLayerConfigs"]),
        ...mapGetters("Modules/Draw_old", [
            "drawInteraction",
            "selectedFeature",
            "drawOldModuleUsedByDraw"
        ])
    },
    watch: {
        geoMarkerActiveTab (newValue, oldValue) {
            switch (newValue) {
                case "tabNew":
                    this.initializeTabNew(oldValue);
                    break;
                case "tabFilter":
                    this.initializeTabFilter(oldValue);
                    break;
                case "tabList":
                    this.initializeTabList();
                    break;
                default:
                    this.setMapInteraction(null);
            }
        },
        drawOldModuleUsedByDraw (newValue) {
            if (newValue) {
                this.freezeGeoMarker();
                // Draw_old module is activated, freeze geoMarker
            } else {
                // Draw_old module is deactivated, unfreeze geoMarker
                this.unfreezeGeoMarker();
            }
        }
    },
    async mounted () {
        this.setCurrentTab("tabFilter");

        await this.loadCategories();
        await this.loadDepartments();

        const editLayerInformation = this.allLayerConfigs.filter(item => item.id === this.geoMarkerEditLayerId);

        this.setLayerInformation(editLayerInformation);
        await this.getGeoMarkerEditLayerUrl();
        this.fullyLoaded = true;
    },
    unmounted () {
        this.resetGeomarkerFeature();
    },
    methods: {
        ...mapMutations("Modules/GeoMarker", [
            "setGeoMarkerActiveTab",
            "setLayerInformation",
            "setNewGeoMarkerFeature",
            "setGeoMarkerUpdateFeature",
            "setGeoMarkerFeatureSelected",
            "setGeoMarkerFeatureList",
            "setLockListSelection",
            "setNewGeoMarkerCreated",
            "setFrozenNewGeoMarkerFeature"
        ]),
        ...mapActions("Modules/GeoMarker", [
            "loadCategories",
            "loadDepartments",
            "setMapInteraction",
            "getGeoMarkerEditLayerUrl",
            "rollbackGeoMarkerUpdateFeature",
            "clearInteractions",
            "restoreFrozenNewGeoMarkerFeature"
        ]),
        ...mapActions("Maps", ["removePointMarker"]),
        setCurrentTab (tab) {
            this.setGeoMarkerActiveTab(tab);
        },
        /**
         * It resets the selected GeoMarker feature on the map
         * when switching the tab or leaving the addon.
         */
        resetGeomarkerFeature () {
            this.setNewGeoMarkerFeature(null);
            this.setGeoMarkerUpdateFeature(null);
            this.setMapInteraction(null);
        },
        /**
         * Handles rollback operations from tabList
         * Checks if there is a rollback feature and if the old tab was tabList
         */
        handleRollbackFromTabList (oldValue) {
            if (this.rollbackGeoMarkerFeature && oldValue === "tabList") {
                this.rollbackGeoMarkerUpdateFeature();
                this.$refs.tabList && (this.$refs.tabList.geoMarkerUpdateMode = false);
            }
        },
        /**
         * Handles switching to tabNew
         * Sets up the drawing interaction for Point creation
         */
        initializeTabNew (oldValue) {
            this.setNewGeoMarkerFeature(null);
            this.setNewGeoMarkerCreated(false);
            this.setMapInteraction("Point");
            this.setGeoMarkerUpdateFeature(null);
            this.removePointMarker();
            this.handleRollbackFromTabList(oldValue);
        },
        /**
         * Handles switching to tabFilter
         * Resets the form and clears interactions
         */
        initializeTabFilter (oldValue) {
            this.$refs.tabList.resetGeoMarkerForm();
            this.setMapInteraction(null);
            this.setGeoMarkerUpdateFeature(null);
            this.removePointMarker();
            this.handleRollbackFromTabList(oldValue);
        },
        /**
         * Handles switching to tabList
         * Clears features and resets selections
         */
        initializeTabList () {
            this.setMapInteraction(null);
            this.setGeoMarkerUpdateFeature(null);
            this.setNewGeoMarkerFeature(null);

            if (!this.newGeoMarkerCreated) {
                this.setGeoMarkerFeatureSelected(null);
            }
        },
        freezeGeoMarker () {
            // Save the current new feature before freezing (if it exists)
            // But don't re-save an already frozen feature that was just restored
            if (this.newGeoMarkerFeature) {
                console.log("freeze ")
                this.setFrozenNewGeoMarkerFeature(this.newGeoMarkerFeature);
            }
            // Clear interactions and reset UI
            this.clearInteractions();
            // this.resetGeomarkerFeature();
            this.removePointMarker();
            this.setMapInteraction(null);
        },
        unfreezeGeoMarker () {
            switch (this.geoMarkerActiveTab) {
                case "tabNew":
                    // Restore the frozen feature to the map for tabNew
                    // This sets up modify and translate interactions instead of draw
                    if (this.frozenNewGeoMarkerFeature ) {
                        console.log("restore tabnew if")
                        this.restoreFrozenNewGeoMarkerFeature({feature: this.frozenNewGeoMarkerFeature});
                        // this.setNewGeoMarkerFeature(this.frozenNewGeoMarkerFeature);
                        this.setFrozenNewGeoMarkerFeature(null);
                    } else {
                        this.initializeTabNew(null);
                    }
                    break;
                case "tabFilter":
                    this.initializeTabFilter(null);
                    break;
                case "tabList":
                    this.initializeTabList();
                    break;
                default:
                    this.setMapInteraction(null);
            }
        }
    }
};
</script>

<template>
    <div id="geoMarker">
        <!-- Overlay when Draw_old module is active -->
        <div
            v-if="drawOldModuleUsedByDraw"
            class="geomarker-overlay"
            @click.stop
        >
            <div class="overlay-message">
                {{ $t('additional:modules.geoMarker.overlay.closeDrawTool') }}
            </div>
        </div>

        <ul
            id="geoMarkerTabs"
            class="nav nav-tabs nav-justified"
            role="tablist"
        >
            <NavTab
                id="tabNew"
                :active="geoMarkerActiveTab === 'tabNew'"
                target="#tabNewContent"
                :label="$t('additional:modules.geoMarker.tabs.tabNew.label')"
                @click="setCurrentTab('tabNew')"
            />

            <NavTab
                id="tabFilter"
                :active="geoMarkerActiveTab === 'tabFilter'"
                target="#tabFilterContent"
                :label="$t('additional:modules.geoMarker.tabs.tabFilter.label')"
                @click="setCurrentTab('tabFilter')"
            />

            <NavTab
                id="tabList"
                :active="geoMarkerActiveTab === 'tabList'"
                target="#tabListContent"
                :label="$t('additional:modules.geoMarker.tabs.tabList.label')"
                :active-tab="geoMarkerActiveTab === 'tabList'"
                @click="setCurrentTab('tabList')"
            />
        </ul>

        <div
            id="geomarkerTabContent"
            class="tab-content"
        >
            <div
                v-if="fullyLoaded"
                id="tabNewContent"
                :class="[
                    'tab-pane',
                    'fade',
                    geoMarkerActiveTab === 'tabNew' ? 'show active' : ''
                ]"
                role="tabpanel"
                aria-labelledby="tabNew"
                tabindex="0"
            >
                <TabNewContent />
            </div>

            <div
                id="tabFilterContent"
                :class="[
                    'tab-pane',
                    'fade',
                    geoMarkerActiveTab === 'tabFilter' ? 'show active' : ''
                ]"
                role="tabpanel"
                aria-labelledby="tabFilter"
                tabindex="0"
            >
                <TabFilterContent
                    :tab-active="geoMarkerActiveTab === 'tabFilter'"
                />
            </div>

            <div
                id="tabListContent"
                :class="[
                    'tab-pane',
                    'fade',
                    geoMarkerActiveTab === 'tabList' ? 'show active' : ''
                ]"
                role="tabpanel"
                aria-labelledby="tabList"
                tabindex="0"
            >
                <TabListContent
                    ref="tabList"
                    :tab-active="geoMarkerActiveTab === 'tabList'"
                />
            </div>
        </div>
    </div>
</template>

<style lang="scss">
div#geoMarker {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    position: relative;

    .geomarker-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        pointer-events: auto;

        .overlay-message {
            background-color: #fff;
            padding: 2rem 2.5rem;
            border-radius: 6px;
            font-size: 1rem;
            font-weight: 500;
            color: #495057;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
            max-width: 85%;
            word-wrap: break-word;
            pointer-events: auto;
        }
    }

    ul#geoMarkerTabs {
        button.nav-link {
            padding: 0.5rem;
        }
    }

    div#geomarkerTabContent {
        height: 100%;
        overflow: hidden;
        padding-top: 1rem;

        div#tabNewContent {
            height: 100%;
        }

        div#tabFilterContent.active {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            flex: 1;
            overflow: hidden;
            height: 100%;
        }

        div#tabListContent.active {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            flex: 1;
            overflow: hidden;
            height: 100%;
        }
    }
}
</style>
