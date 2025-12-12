<script>
import PvObligationRestrictionList from "./PvObligationRestrictionList.vue";
import PvObligationSimpleTable from "./PvObligationSimpleTable.vue";
import PvObligationWizardStepScriptExtends from "./PvObligationWizardStepScriptExtends.vue";
import {mapGetters, mapActions} from "vuex";
import {Style, Stroke, Fill} from "ol/style";
import thousandsSeparator from "@shared/js/utils/thousandsSeparator";

export default {
    name: "PvObligationWizardStepNetRestrictedAreas",
    components: {
        PvObligationRestrictionList,
        PvObligationSimpleTable
    },
    extends: PvObligationWizardStepScriptExtends,
    data () {
        return {
            /** @override */
            componentFormData: {
                netRoofArea: 0,
                netRoofAreaWithoutExcludes: 0,
                restrictedArea: 0,
                restrictedListItems: []
            },
            componentFormDataIsDirtyIgnore: [
                "netRoofArea",
                "netRoofAreaWithoutExcludes",
                "restrictedArea"
            ],
            stepNetAreaDataObligatedArea: 0,
            stepNetAreaWithoutRestrictedArea: 0,
            restrictedAreaSum: 0,
            netAreaMinusSubstractedArea: 0,
            isNetAreaMinusSubstractedAreaHigher: false
        };
    },
    computed: {
        ...mapGetters("Modules/PvObligation", [
            "isDrawing",
            "selectedRoofId",
            "pvAreaLayerId"
        ])
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
                }
            },
            immediate: true
        }
    },
    methods: {
        ...mapActions("Modules/PvObligation", [
            "dissolveRoofFeaturesAndCalculateArea",
            "calculateNetAreaAndRestrictedAreas",
            "calculateNetRestrictedAreaAndRestrictedAreas"
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

            this.componentFormData.restrictedListItems.splice(0);
        },
        async defineNetArea (payload) {
            const outlineLayer = await this.addNewLayerIfNotExists({layerName: payload.layerName, alwaysOnTop: true});

            outlineLayer.setStyle(new Style({
                stroke: new Stroke({color: "rgba(192, 12, 247, 1)", width: 3}),
                fill: new Fill({color: "rgba(0, 0, 0, 0)"})
            }));

            // eslint-disable-next-line
            const stepNetAreaData = await this.calculateNetAreaAndRestrictedAreas({
                netArea: this.wizardStepsFormData?.PvObligationWizardStepNetArea?.formData?.netRoofArea !== null
                    ? this.wizardStepsFormData?.PvObligationWizardStepNetArea?.formData?.netRoofArea
                    : await this.dissolveRoofFeaturesAndCalculateArea({
                        roofId: this.selectedRoofId,
                        outlineLayer: outlineLayer,
                        layerId: this.pvAreaLayerId
                    }),
                restrictedAreaItems: this.wizardStepsFormData?.PvObligationWizardStepNetArea?.formData?.restrictedListItems ?? []
            });

            this.stepNetAreaDataObligatedArea = stepNetAreaData.obligatedArea;
            this.stepNetAreaWithoutRestrictedArea = stepNetAreaData.netAreaWithoutRestrictedArea;

            await this.calculateData();
        },
        async onListItems (listItems) {
            this.componentFormData.restrictedListItems = listItems;

            await this.calculateData();
        },
        async calculateData () {
            const stepNetRestrictedAreaData = await this.calculateNetRestrictedAreaAndRestrictedAreas({
                restrictedAreaItems: this.componentFormData.restrictedListItems,
                stepNetAreaWithoutRestrictedArea: this.stepNetAreaWithoutRestrictedArea,
                stepNetAreaDataObligatedArea: this.stepNetAreaDataObligatedArea
            });

            this.isNetAreaMinusSubstractedAreaHigher = stepNetRestrictedAreaData.isNetAreaMinusSubstractedAreaHigher;
            this.restrictedAreaSum = stepNetRestrictedAreaData.restrictedArea;
            this.netAreaMinusSubstractedArea = stepNetRestrictedAreaData.netAreaMinusSubstractedArea;
        },
        formatNumberForArea (value) {
            return thousandsSeparator(Math.round(value * 10) / 10);
        }
    }
};
</script>

<template lang="html">
    <div id="pvObligationWizardStepNetRestrictedAreas">
        <div v-if="!wizardStepsFormData?.PvObligationWizardStepGrossArea?.isValid">
            <p class="error">
                {{ $t("additional:modules.pvObligation.wizard.step.netRestrictedAreas.component.missingStepGrossAreaError") }}
            </p>

            <p>
                {{ $t("additional:modules.pvObligation.wizard.step.netRestrictedAreas.component.missingStepGrossAreaMessage") }}
            </p>
        </div>

        <div v-else>
            <div v-if="isDrawing">
                <p class="error">
                    {{ $t("additional:modules.pvObligation.wizard.step.netArea.component.drawingIsNotCompletedError") }}
                </p>
            </div>

            <p>
                {{ $t("additional:modules.pvObligation.wizard.step.netRestrictedAreas.component.introduction") }}
            </p>

            <PvObligationRestrictionList
                class="restrictionList"
                index-prefix="S"
                :is-disabled="false"
                @list-items="onListItems"
            />

            <PvObligationSimpleTable
                v-if="isNetAreaMinusSubstractedAreaHigher"
                :rows="[
                    restrictedAreaSum
                        ? {
                            label: $t('additional:modules.pvObligation.wizard.step.netRestrictedAreas.component.tableCellRestrictedAreasSumLabel'),
                            value: `${formatNumberForArea(restrictedAreaSum)} m²`
                        }
                        : null,
                    {
                        label: $t('additional:modules.pvObligation.wizard.step.netRestrictedAreas.component.tableCellPvAreaRequirementLabel'),
                        value: `${formatNumberForArea(stepNetAreaDataObligatedArea)} m²`
                    }
                ].filter(row => row !== null)"
            />

            <PvObligationSimpleTable
                v-else
                :rows="[
                    {
                        label: $t('additional:modules.pvObligation.wizard.step.netRestrictedAreas.component.tableCellRestrictedAreasSumLabel'),
                        value: `${formatNumberForArea(restrictedAreaSum)} m²`
                    },
                    {
                        label: $t(
                            'additional:modules.pvObligation.wizard.step.netRestrictedAreas.component.tableCellPvAreaRequirementReducedLabel', {
                                squareMeters: formatNumberForArea(stepNetAreaDataObligatedArea)
                            }
                        ),
                        value: `${formatNumberForArea(netAreaMinusSubstractedArea)} m²`
                    }
                ]"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #pvObligationWizardStepNetRestrictedAreas{
        margin-top: 0.5rem;

        div.restrictionList {
            margin: 1.5rem 0;
        }

        p.error {
            color: $light_red;
        }
    }
</style>

