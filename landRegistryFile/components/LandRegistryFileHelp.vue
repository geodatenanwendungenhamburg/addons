<script>
import {mapGetters, mapActions} from "vuex";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import {TAB_SET_CURRENT} from "./shared/TabContainer.vue";
import {isWebLink} from "@shared/js/utils/urlHelper.js";

export default {
    name: "LandRegistryFileHelp",
    components: {
        FlatButton
    },
    inject: {
        setCurrentTab: {from: TAB_SET_CURRENT, default: null}
    },
    computed: {
        ...mapGetters("Modules/LandRegistryFile", [
            "linkToHelp",
            "landRegistryFileTourUrl"
        ]),
        /**
         * Checks whether the help link is present and uses a valid web URL.
         * @returns {boolean} True if the help link is valid.
         */
        helpLinkIsValid () {
            return Boolean(this.linkToHelp && this.isWebLink(this.linkToHelp));
        },
        /**
         * Checks whether the tour link is present and ends with .json.
         * @returns {boolean} True if the tour link is valid.
         */
        tourLinkIsValid () {
            return Boolean(this.landRegistryFileTourUrl && this.landRegistryFileTourUrl.endsWith(".json"));
        }
    },
    methods: {
        ...mapActions("Modules/LandRegistryFile", [
            "startGuidedTour"
        ]),
        isWebLink,
        /**
         * Opens the help link in a new browser tab if it is valid.
         * @returns {void}
         */
        openHelpLink () {
            if (this.helpLinkIsValid) {
                window.open(this.linkToHelp);
            }
        },
        /**
         * Switches to the search tab and starts the guided tour.
         * @returns {void}
         */
        prepareGuidedTour () {
            this.setCurrentTab("tabSearch");
            this.startGuidedTour();
        }
    }
};
</script>

<template lang="html">
    <div
        id="LandRegistryFileHelp"
        class="InnerLayoutFrame"
    >
        <div class="ScrollableContent">
            <p v-if="!helpLinkIsValid && !tourLinkIsValid">
                {{ $t('additional:modules.landRegistryFile.tabs.tabHelp.noHelpConfigured') }}
            </p>

            <FlatButton
                v-if="helpLinkIsValid"
                :aria-label="$t('additional:modules.landRegistryFile.tabs.tabHelp.openHelpButtonLabel')"
                :text="$t('additional:modules.landRegistryFile.tabs.tabHelp.openHelpButtonLabel')"
                icon="bi-question-square"
                @click="openHelpLink()"
            />

            <FlatButton
                v-if="tourLinkIsValid"
                :aria-label="$t('additional:modules.landRegistryFile.tabs.tabHelp.startTourButtonLabel')"
                :text="$t('additional:modules.landRegistryFile.tabs.tabHelp.startTourButtonLabel')"
                icon="bi-person-raised-hand"
                @click="prepareGuidedTour()"
            />
        </div>

        <div class="FixedContent buttons-footer">
            <FlatButton
                :aria-label="$t('additional:modules.landRegistryFile.tabs.tabHelp.backToSearchButtonLabel')"
                :text="$t('additional:modules.landRegistryFile.tabs.tabHelp.backToSearchButtonLabel')"
                :secondary="true"
                @click="setCurrentTab('tabSearch')"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
    #LandRegistryFileHelp{
        height: 100%;

        div.ScrollableContent {
            align-items: center;
            margin-top: 3rem;

            p {
                font-size: 1rem;
                line-height: 1.5rem;
            }
        }
    }
</style>

<style>
    dialog.landregistry-guided-tour {
        &.shepherd-has-title .shepherd-content .shepherd-header {
            background-color: white;
        }

        footer.shepherd-footer {
            justify-content: space-between;

            button.shepherd-button:nth-child(2) {
                margin-left: 4rem;
            }
        }

        &[data-shepherd-step-id="Hilfe"] {
            footer.shepherd-footer {
                button.shepherd-button:nth-child(2) {
                    margin-left: 2rem;
                }
            }
        }
    }
</style>
