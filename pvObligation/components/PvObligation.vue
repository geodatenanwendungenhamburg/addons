<script>
import {mapGetters, mapActions} from "vuex";
import PvObligationWizard from "./PvObligationWizard.vue";
import SpinnerItem from "@shared/modules/spinner/components/SpinnerItem.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";

export default {
    name: "PvObligation",
    components: {
        PvObligationWizard,
        SpinnerItem,
        FlatButton
    },
    data () {
        return {
            allRoofsLoaded: false,
            is3D: false
        };
    },
    computed: {
        ...mapGetters("Modules/PvObligation", [
            "isCreatingReport",
            "pvAreaLayerId",
            "roofLayerId",
            "isDrawing"
        ]),
        ...mapGetters("Maps", [
            "mode"
        ]),
        ...mapGetters([
            "isMobile"
        ]),
        spinnerInfoText () {
            if (this.is3D) {
                return this.$t("additional:modules.pvObligation.notIn3DMode.infoText");
            }
            else if (!this.allRoofsLoaded) {
                return this.$t("additional:modules.pvObligation.roofsAreLoadingSpinner");
            }
            else if (this.isCreatingReport) {
                return this.$t("additional:modules.pvObligation.generateReportSpinner");
            }

            return "";
        },
        isMobileDevice () {
            const userAgentCheck = (/Mobi|Android|iPhone|iPad|iPod|Windows Phone/i).test(navigator.userAgent),
                touchCheck = "ontouchstart" in window || navigator.maxTouchPoints > 0,
                screenSizeCheck = this.isMobile;

            return userAgentCheck || (touchCheck && screenSizeCheck);
        }
    },
    watch: {
        isDrawing (value) {
            document.querySelector("div.controls-element")?.classList.toggle("d-none", value);
        },
        mode (newMode) {
            const newLayerConfigs = [];

            this.is3D = newMode === "3D";
            this.relevantLayerIds?.forEach(layerId => {
                newLayerConfigs.push({
                    id: layerId,
                    layer: {
                        id: layerId,
                        visibility: !this.is3D
                    }
                });
            });

            this.replaceByIdInLayerConfig({layerConfigs: newLayerConfigs}, {root: true});

            if (newMode === "2D") {
                mapCollection.getMapView("2D").animate({rotation: 0});
                this.zoomToExtendOfSelectedRoof();
            }
        }
    },
    async mounted () {
        await this.waitForFeaturesToBeLoaded();
    },
    methods: {
        ...mapActions(["replaceByIdInLayerConfig"]),
        ...mapActions("Maps", ["changeMapMode"]),
        ...mapActions("Modules/PvObligation", ["zoomToExtendOfSelectedRoof"]),
        async waitForFeaturesToBeLoaded () {
            const promises = [],
                map = mapCollection.getMap("2D"),
                layers = map?.getLayers()?.getArray();

            [this.roofLayerId, this.pvAreaLayerId].forEach(layerId => {
                promises.push(
                    new Promise(resolve => {
                        const layer = layers?.find(l => l.get("id") === layerId) ?? undefined;

                        if (layer && layer.isVisible()) {
                            const source = layer.getSource();

                            // Info: This workaround does not work, if a layer has no features at all.
                            if (!source.getFeatures().length) {
                                source.once("featuresloadend", resolve);
                            }
                            else {
                                resolve();
                            }
                        }
                        else {
                            this.replaceByIdInLayerConfig({
                                layerConfigs: [{
                                    id: layerId,
                                    layer: {
                                        visibility: true,
                                        showInLayerTree: true
                                    }
                                }]
                            }, {root: true}).then(() => {
                                const source = layers.find(l => l.get("id") === layerId).getSource();

                                // Info: This workaround does not work, if a layer has no features at all.
                                if (!source.getFeatures().length) {
                                    source.once("featuresloadend", resolve);
                                }
                                else {
                                    resolve();
                                }
                            }).catch(() => {
                                resolve();
                            });
                        }
                    })
                );
            });

            await Promise.all(promises);

            this.allRoofsLoaded = true;
        }
    }
};
</script>

<template lang="html">
    <div
        v-if="!isMobileDevice"
        id="pvObligation"
    >
        <PvObligationWizard />

        <div
            v-if="isCreatingReport || !allRoofsLoaded || is3D"
            class="waitingSpinner"
        >
            <SpinnerItem
                v-if="!is3D"
                custom-class="spinner"
                class="ms-3"
            />

            <p> {{ spinnerInfoText }} </p>

            <FlatButton
                v-if="is3D"
                :aria-label="$t('additional:modules.pvObligation.notIn3DMode.buttonText')"
                :text="$t('additional:modules.pvObligation.notIn3DMode.buttonText')"
                icon="bi-arrow-left-right"
                @click="changeMapMode('2D')"
            />
        </div>
    </div>

    <div
        v-else
        class="mobileMessage"
    >
        <p> {{ $t("additional:modules.pvObligation.screenToSmallMessage") }} </p>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #pvObligation{
        position: relative;
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;

        div.waitingSpinner {
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
    }

    div.mobileMessage {
        height: 100%;
        overflow: hidden;
        display: flex;
        flex-direction: column;

        p {
            max-width: 19rem;
        }
    }
</style>

