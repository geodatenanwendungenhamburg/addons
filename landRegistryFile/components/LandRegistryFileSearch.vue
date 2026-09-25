<script>
import {mapActions, mapMutations} from "vuex";
import mapCollection from "@core/maps/js/mapCollection";
import epsgCodeToURI from "@modules/filter/utils/epsgCodeToURI.js";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import {TAB_SET_CURRENT} from "@shared/modules/tabs/components/TabContainer.vue";

export default {
    name: "LandRegistryFileSearch",
    components: {
        FlatButton
    },
    inject: {
        setCurrentTab: {from: TAB_SET_CURRENT, default: null}
    },
    methods: {
        ...mapMutations("Modules/LandRegistryFile", [
            "setShowLoadingSpinner"
        ]),
        ...mapActions("Modules/LandRegistryFile", [
            "queryOaf"
        ]),
        /**
        * Runs the queryOaf action with the provided parameters.
        * @param {Object} options - Query options
        * @param {string|null} [options.startDate] - The start date for filtering in YYYY-MM-DD format.
        * @param {string|null} [options.endDate] - The end date for filtering in YYYY-MM-DD format.
        * @param {string|null} [options.textValue] - The text value for text search filtering.
        * @param {Array<string>|null} [options.selectedOptions] - The selected options for select filtering.
        */
        async startSearch ({startDate, endDate, textValue, selectedOptions}) {
            const map = mapCollection.getMap("2D"),
                  view = map?.getView(),
                  bbox = view?.calculateExtent(map.getSize()),
                  projectionCode = view?.getProjection()?.getCode(),
                  crs = epsgCodeToURI(projectionCode);

            this.setShowLoadingSpinner(true);

            try {
                const success = await this.queryOaf({
                    params: {
                        startDate: startDate,
                        endDate: endDate,
                        textValue: textValue,
                        selectedOptions: selectedOptions,
                        bbox: bbox?.join(","),
                        crs
                    }
                });

                if (success) {
                    this.setCurrentTab("tabResults");
                }
            }
            finally {
                this.setShowLoadingSpinner(false);
            }
        },
        resetForm () {
            console.warn("resetForm: Noch nicht implementiert!");
        }
    }
};
</script>

<template lang="html">
    <div
        id="landRegistryFileSearch"
        class="InnerLayoutFrame"
    >
        <div class="ScrollableContent">
            <p>Suche</p>
        </div>

        <div class="FixedContent buttons-footer">
            <div
                class="spacer-div"
            />
            <FlatButton
                :aria-label="$t('additional:modules.landRegistryFile.tabs.tabSearch.searchButtonLabel')"
                text="Suche"
                @click="startSearch({})"
            />

            <FlatButton
                :aria-label="$t('additional:modules.landRegistryFile.tabs.tabSearch.resetButtonLabel')"
                text="Zurücksetzen"
                :secondary="true"
                @click="resetForm()"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
    #landRegistryFileSearch{
        height: 100%;

        p {
            background-color: white;
            white-space: pre-line;
            padding: 1.5rem;
        }

        div.spacer-div {
            flex: 1;
        }
    }
</style>
