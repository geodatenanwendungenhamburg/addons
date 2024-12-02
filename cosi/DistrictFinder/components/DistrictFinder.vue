<script>
import AccordionItem from "../../components/AccordionItem.vue";
import DistrictFinderFilter from "./DistrictFinderFilter.vue";
import DistrictSelectorLevel from "../../DistrictSelector/components/DistrictSelectorLevel.vue";
import DistrictSelectorFilter from "../../DistrictSelector/components/DistrictSelectorFilter.vue";
import {getComponent} from "../../../../src/utils/getComponent";
import getters from "../store/gettersDistrictFinder";
import {mapGetters, mapMutations} from "vuex";
import mutations from "../store/mutationsDistrictFinder";
import {styleSelectedDistrictLevels} from "../../DistrictSelector/utils/styleSelectedDistrictLevels";
import Tool from "../../../../src/modules/tools/ToolTemplate.vue";

export default {
    name: "DistrictFinder",
    components: {
        AccordionItem,
        DistrictFinderFilter,
        DistrictSelectorLevel,
        DistrictSelectorFilter,
        Tool
    },
    computed: {
        ...mapGetters("Language", ["currentLocale"]),
        ...mapGetters("Tools/DistrictFinder", Object.keys(getters)),
        ...mapGetters("Tools/DistrictSelector", [
            "districtLevels",
            "selectedDistrictLevelId",
            "selectedDistrictLevel"
        ])
    },
    watch: {
        /**
         * Unselect the Menu item if the tool is deactivated
         * @param {boolean} state - Defines if the tool is active.
         * @returns {void}
         */
        active (state) {
            if (!state) {
                const model = getComponent(this.id);

                if (model) {
                    model.set("isActive", false);
                }
            }
            else {
                styleSelectedDistrictLevels(this.districtLevels, this.selectedDistrictLevelId, this.selectedDistrictLevel.activeStyle);
            }
        }
    },
    created () {
        /**
         * listens to the close event of the Tool Component
         * @listens #close
         */
        this.$on("close", () => {
            this.setActive(false);
        });
    },
    methods: {
        ...mapMutations("Tools/DistrictFinder", Object.keys(mutations)),
        ...mapMutations("Tools/DistrictSelector", ["setSelectedDistrictLevelId"]),

        /**
         * Emits the root event 'updateSelectedDistricts' with the given districts names.
         * @param {String[]} districtsNames - Names of the districts to be selected.
         * @returns {void}
         */
        emitSelectedDistricts (districtsNames) {
            this.$root.$emit("updateSelectedDistricts", districtsNames);
        }
    }
};
</script>

<template lang="html">
    <Tool
        ref="tool"
        :title="$t('additional:modules.tools.cosi.districtFinder.title')"
        :icon="icon"
        :active="active"
        :render-to-window="renderToWindow"
        :resizable-window="resizableWindow"
        :deactivate-gfi="deactivateGFI"
        :initial-width="600"
    >
        <template
            v-if="active"
            #toolBody
        >
            <div
                id="district-finder"
                class="container"
            >
                <AccordionItem
                    id="district-selection"
                    :title="$t('additional:modules.tools.cosi.districtSelector.title')"
                    icon="bi bi-plus-circle"
                >
                    <DistrictSelectorLevel
                        :district-levels="districtLevels"
                        :selected-level-id="selectedDistrictLevelId"
                        @setSelectedDistrictLevelId="setSelectedDistrictLevelId"
                    />
                    <DistrictSelectorFilter
                        :district-levels="districtLevels"
                        :selected-level-id="selectedDistrictLevelId"
                        @updateSelectedDistricts="emitSelectedDistricts"
                    />
                </AccordionItem>
                <hr class="my-2 mx-0 text-black-50">
                <DistrictFinderFilter />
            </div>
        </template>
    </Tool>
</template>
