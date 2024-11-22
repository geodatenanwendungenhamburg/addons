<script>
import Tool from "../../../../src/modules/tools/ToolTemplate.vue";
import DistrictSelectorLevel from "../../DistrictSelector/components/DistrictSelectorLevel.vue";
import DistrictSelectorFilter from "../../DistrictSelector/components/DistrictSelectorFilter.vue";
import {getComponent} from "../../../../src/utils/getComponent";
import {mapGetters, mapActions, mapMutations} from "vuex";
import getters from "../store/gettersDistrictFinder";
import mutations from "../store/mutationsDistrictFinder";
import actions from "../store/actionsDistrictFinder";
import {styleSelectedDistrictLevels} from "../../DistrictSelector/utils/styleSelectedDistrictLevels";

export default {
    name: "DistrictFinder",
    components: {
        Tool,
        DistrictSelectorLevel,
        DistrictSelectorFilter
    },
    data () {
        return {
        };
    },
    computed: {
        ...mapGetters("Language", ["currentLocale"]),
        ...mapGetters("Tools/DistrictFinder", Object.keys(getters)),
        ...mapGetters("Tools/DistrictSelector", ["districtLevels", "selectedDistrictLevelId", "selectedDistrictLevel"])
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
        ...mapActions("Tools/DistrictFinder", Object.keys(actions)),
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
    >
        <template
            v-if="active"
            #toolBody
        >
            <div
                id="district-finder"
                class="container"
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
            </div>
        </template>
    </Tool>
</template>

<style lang="scss" scoped>
@import "~variables";
</style>
