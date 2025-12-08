<script>
import {mapGetters, mapActions} from "vuex";
import PvObligationWizard from "./PvObligationWizard.vue";
import SpinnerItem from "@shared/modules/spinner/components/SpinnerItem.vue";

export default {
    name: "PvObligation",
    components: {
        PvObligationWizard,
        SpinnerItem
    },
    data () {
        return {
            allRoofsLoaded: false
        };
    },
    computed: {
        ...mapGetters("Modules/PvObligation", [
            "isCreatingReport",
            "relevantLayerIds",
            "isDrawing"
        ]),
        ...mapGetters([
            "isMobile"
        ]),
        spinnerInfoText () {
            if (!this.allRoofsLoaded) {
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
        }
    },
    async mounted () {
        await this.waitForFeaturesToBeLoaded();
    },
    methods: {
        ...mapActions(["replaceByIdInLayerConfig"]),
        async waitForFeaturesToBeLoaded () {
            const promises = [],
                map = mapCollection.getMap("2D"),
                layers = map?.getLayers()?.getArray();

            this.relevantLayerIds?.forEach(layerId => {
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
            v-if="isCreatingReport || !allRoofsLoaded"
            class="waitingSpinner"
        >
            <SpinnerItem
                custom-class="spinner"
                class="ms-3"
            />

            <p> {{ spinnerInfoText }} </p>
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

