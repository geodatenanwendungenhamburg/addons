<script>
import PvObligationWizardStepScriptExtends from "./PvObligationWizardStepScriptExtends.vue";
import mapCollection from "@core/maps/js/mapCollection";
import {mapActions, mapGetters} from "vuex";
import {Style, Stroke, Fill} from "ol/style";
import PvObligationRestrictionList from "./PvObligationRestrictionList.vue";
import thousandsSeparator from "@shared/js/utils/thousandsSeparator";
import PvObligationSimpleTable from "./PvObligationSimpleTable.vue";
import calculateRestrictedArea from "../js/calculateRestrictedArea";

export default {
    name: "PvObligationWizardStepNetArea",
    components: {
        PvObligationRestrictionList,
        PvObligationSimpleTable
    },
    extends: PvObligationWizardStepScriptExtends,
    data () {
        return {
            /** @override */
            componentFormData: {
                netRoofArea: null,
                netRoofAreaWithoutExcludes: null,
                restrictedListItems: []
            },
            componentFormDataIsDirtyIgnore: [
                "netRoofArea",
                "netRoofAreaWithoutExcludes"
            ],
            excludedArea: 0,
            obligatedArea: null
        };
    },
    computed: {
        ...mapGetters("Modules/PvObligation", [
            "pvAreaLayerId",
            "selectedRoofExtent",
            "isDrawing",
            "selectedRoofId"
        ]),
        ...mapGetters("Menu", [
            "expanded"
        ]),
        /**
         * Checks if the menu sides are open or closed and
         * calculates the padding for the zoomToExtent function, depending on the opening state
         * @returns {Number[]} Padding values for an extent, fitting inbetween the menu sides.
         */
        mapZoomToExtentPadding () {
            let rightPadding = 20,
                leftPadding = 20;

            if (this.expanded("secondaryMenu")) {
                const el = document.getElementById("mp-menu-secondaryMenu");

                rightPadding = el ? el.offsetWidth + 20 : 20;
            }

            if (this.expanded("mainMenu")) {
                const el = document.getElementById("mp-menu-mainMenu");

                leftPadding = el ? el.offsetWidth + 20 : 20;
            }

            return [20, rightPadding, 20, leftPadding];
        }
    },
    watch: {
        /** @override */
        wizardStepIsActive: {
            handler (isNowActive) {
                if (isNowActive && this.wizardStepsFormData?.PvObligationWizardStepGrossArea?.isValid) {
                    this.defineNetArea({layerName: "Module/pvObligation/layer/roofArea_pv_suitable"});

                    const layer = mapCollection.getMap("2D")?.getLayers()?.getArray().find(l => {
                        return l.get("id") === "Module/pvObligation/layer/roofArea_pv_suitable";
                    });

                    if (layer) {
                        layer.setVisible(true);
                    }

                    this.zoomToExtent({
                        extent: this.selectedRoofExtent,
                        options: {
                            padding: this.mapZoomToExtentPadding
                        }
                    });
                }
            },
            immediate: true
        }
    },
    methods: {
        ...mapActions("Modules/PvObligation", [
            "dissolveRoofFeaturesAndCalculateArea",
            "calculateNetAreaAndRestrictedAreas"
        ]),
        ...mapActions("Maps", [
            "addNewLayerIfNotExists",
            "zoomToExtent"
        ]),
        /** @override */
        resetWizardStepData () {
            if (!this.componentFormData.restrictedListItems.length) {
                return;
            }

            mapCollection.getMap("2D").getLayers().getArray().find(layer => {
                return layer.get("id") === "module/pvObligation/drawLayer";
            }).getSource().clear();

            this.componentFormData.netRoofArea = null;
            this.componentFormData.netRoofAreaWithoutExcludes = null;
            this.componentFormData.restrictedListItems.splice(0);
            this.excludedArea = 0;
            this.obligatedArea = null;
        },
        async defineNetArea (payload) {
            const outlineLayer = await this.addNewLayerIfNotExists({layerName: payload.layerName, alwaysOnTop: true});

            outlineLayer.setStyle(new Style({
                stroke: new Stroke({color: "rgba(192, 12, 247, 1)", width: 3}),
                fill: new Fill({color: "rgba(0, 0, 0, 0)"})
            }));

            // eslint-disable-next-line
            const areaData = await this.calculateNetAreaAndRestrictedAreas({
                netArea: this.componentFormData.netRoofArea !== null
                    ? this.componentFormData.netRoofArea
                    : await this.dissolveRoofFeaturesAndCalculateArea({
                        roofId: this.selectedRoofId,
                        outlineLayer: outlineLayer,
                        layerId: this.pvAreaLayerId
                    }),
                restrictedAreaItems: this.componentFormData.restrictedListItems ?? []
            });

            this.componentFormData.netRoofArea = areaData.netArea;
            this.obligatedArea = areaData.obligatedArea;
        },
        onListItems (listItems) {
            this.componentFormData.restrictedListItems = listItems;

            this.excludedArea = calculateRestrictedArea(this.componentFormData.restrictedListItems);
            this.componentFormData.netRoofAreaWithoutExcludes = this.excludedArea !== 0 ? this.componentFormData.netRoofArea - this.excludedArea : null;
            this.obligatedArea = this.componentFormData.netRoofAreaWithoutExcludes * 0.3;
        },
        formatNumberForArea (value) {
            return thousandsSeparator(Math.round(value * 10) / 10);
        }
    }
};
</script>

<template lang="html">
    <div id="pvObligationWizardStepNetArea">
        <div v-if="!wizardStepsFormData?.PvObligationWizardStepGrossArea?.isValid">
            <p class="error">
                {{ $t("additional:modules.pvObligation.wizard.step.netArea.component.missingStepGrossAreaError") }}
            </p>

            <p>
                {{ $t("additional:modules.pvObligation.wizard.step.netArea.component.missingStepGrossAreaMessage") }}
            </p>
        </div>

        <div v-else>
            <div v-if="isDrawing">
                <p class="error">
                    {{ $t("additional:modules.pvObligation.wizard.step.netArea.component.drawingIsNotCompletedError") }}
                </p>
            </div>

            <p>
                {{ $t("additional:modules.pvObligation.wizard.step.netArea.component.introduction") }}
            </p>

            <p>
                {{ $t("additional:modules.pvObligation.wizard.step.netArea.component.introductionHint") }}
            </p>

            <PvObligationRestrictionList
                class="restrictionList"
                index-prefix="N"
                :is-disabled="false"
                @list-items="onListItems"
            />

            <p>
                {{ $t("additional:modules.pvObligation.wizard.step.netArea.component.substractFromNetArea") }}
            </p>

            <PvObligationSimpleTable
                :rows="[
                    excludedArea === 0
                        ? {
                            label: $t('additional:modules.pvObligation.wizard.step.netArea.component.substractFromNetAreaLabel'),
                            value: `${formatNumberForArea(componentFormData.netRoofArea)} m²`
                        }
                        : {
                            label: $t('additional:modules.pvObligation.wizard.step.netArea.component.substractFromNetAreaValueLabel', {
                                squareMeters: formatNumberForArea(excludedArea)
                            }),
                            value: `${formatNumberForArea(componentFormData.netRoofAreaWithoutExcludes)} m²`
                        }
                ]"
            />

            <p>
                {{ $t("additional:modules.pvObligation.wizard.step.netArea.component.minPvRequirement") }}
            </p>

            <PvObligationSimpleTable
                :rows="[
                    {
                        label: $t('additional:modules.pvObligation.wizard.step.netArea.component.minPvRequirementLabel'),
                        value: `${formatNumberForArea(obligatedArea)} m²`
                    }
                ]"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #pvObligationWizardStepNetArea{
        margin-top: 0.5rem;

        strong {
            display: block;
            margin-bottom: 1rem;
            text-align: center;
            font-size: 1.25rem;
        }

        div.restrictionList {
            margin: 1.5rem 0;
        }

        p.error {
            color: $light_red;
        }
    }
</style>
