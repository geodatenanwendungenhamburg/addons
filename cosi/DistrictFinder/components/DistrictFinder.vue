<script>
import AccordionItem from "../../components/AccordionItem.vue";
import DistrictFinderFilter from "./DistrictFinderFilter.vue";
import DistrictFinderSelector from "./DistrictFinderSelector.vue";
import {getComponent} from "../../../../src/utils/getComponent";
import getters from "../store/gettersDistrictFinder";
import {mapGetters, mapMutations} from "vuex";
import Tool from "../../../../src/modules/tools/ToolTemplate.vue";

export default {
    name: "DistrictFinder",
    components: {
        AccordionItem,
        DistrictFinderFilter,
        DistrictFinderSelector,
        Tool
    },
    computed: {
        ...mapGetters("Language", ["currentLocale"]),
        ...mapGetters("Tools/DistrictFinder", Object.keys(getters))
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
        ...mapMutations("Tools/DistrictFinder", ["setActive"])
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
                    :title="$t('additional:modules.tools.cosi.districtFinder.selector.title')"
                    :title-badge="selectedDistricts.length"
                >
                    <DistrictFinderSelector />
                </AccordionItem>
                <hr class="my-2 mx-0 text-black-50">
                <DistrictFinderFilter />
            </div>
        </template>
    </Tool>
</template>
