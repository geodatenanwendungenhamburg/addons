<script>
import GeoJSON from "ol/format/GeoJSON";
import layerCollection from "../../../../../src/core/layers/js/layerCollection";

/**
 * Custom input for Green4Bikes rentalStations.
 * Loads bike rental stations from the "Radstationen" layer.
 */
export default {
    name: "BikeStationLayerInput",
    props: {
        id: {
            type: String,
            required: true
        },
        label: {
            type: String,
            required: true
        },
        value: {
            type: String,
            default: null
        }
    },
    emits: ["update:value"],
    data () {
        return {
            stationCount: 0,
            sourceChangeListener: null
        };
    },
    computed: {
        stationsLayer () {
            // Stations are stored in the infrastructure layer (buildings-and-roads-features)
            // NOT in the planning-scenario layer!
            return layerCollection.getLayerById("buildings-and-roads-features");
        }
    },
    watch: {
        stationsLayer: {
            handler (newLayer, oldLayer) {
                // Clean up old listener
                if (oldLayer && this.sourceChangeListener) {
                    const oldSource = oldLayer.getLayerSource();

                    if (oldSource) {
                        oldSource.un("change", this.sourceChangeListener);
                    }
                }

                // Setup new listener
                if (newLayer) {
                    const source = newLayer.getLayerSource();

                    if (source) {
                        this.sourceChangeListener = () => {
                            this.loadStationsFromLayer();
                        };
                        source.on("change", this.sourceChangeListener);
                        // Load immediately
                        this.loadStationsFromLayer();
                    }
                }
            },
            immediate: true
        }
    },
    mounted () {
        // Auto-load stations from layer if available
        this.loadStationsFromLayer();
    },
    beforeUnmount () {
        // Clean up listener
        if (this.stationsLayer && this.sourceChangeListener) {
            const source = this.stationsLayer.getLayerSource();

            if (source) {
                source.un("change", this.sourceChangeListener);
            }
        }
    },
    methods: {
        /**
         * Loads stations from the planning scenario layer.
         */
        loadStationsFromLayer () {
            console.warn("=== BikeStationLayerInput.loadStationsFromLayer() called ===");
            
            const layer = this.stationsLayer;

            if (!layer) {
                console.warn("BikeStationLayerInput: Infrastructure layer (buildings-and-roads-features) not found");
                this.stationCount = 0;
                this.$emit("update:value", null);
                return;
            }

            console.warn("BikeStationLayerInput: Infrastructure layer found:", layer);

            const source = layer.getLayerSource();

            if (!source) {
                console.warn("BikeStationLayerInput: Source for planning scenario layer not found");
                this.stationCount = 0;
                this.$emit("update:value", null);
                return;
            }

            console.warn("BikeStationLayerInput: Source found");

            const features = source.getFeatures();

            if (!features || features.length === 0) {
                this.stationCount = 0;
                this.$emit("update:value", null);
                return;
            }

            // Debug: Log all features to see what we have
            console.warn("=== BikeStationLayerInput Debug ===");
            console.warn("Total features in planning-scenario:", features.length);
            features.forEach((f, idx) => {
                const props = f.getProperties();
                const geomType = f.getGeometry()?.getType();

                console.warn(`Feature ${idx}:`, {
                    geomType,
                    props: Object.keys(props),
                    hasAnzahlRaeder: props.anzahl_raeder !== undefined,
                    hasUid: props.uid !== undefined,
                    hasName: props.name !== undefined,
                    hasId: props.id !== undefined
                });
            });

            // Use all Point features as stations (they are loaded from the stations source)
            const stationFeatures = features.filter(feature => {
                return feature.getGeometry()?.getType() === "Point";
            });

            console.warn("Filtered station features (Points):", stationFeatures.length);

            this.stationCount = stationFeatures.length;

            if (stationFeatures.length === 0) {
                this.$emit("update:value", null);
                return;
            }            // Convert features to GeoJSON FeatureCollection
            const geoJsonFormat = new GeoJSON(),
                featureCollection = {
                    type: "FeatureCollection",
                    features: stationFeatures.map(feature => {
                        const geoJsonFeature = geoJsonFormat.writeFeatureObject(feature, {
                                dataProjection: "EPSG:4326",
                                featureProjection: "EPSG:25832"
                            }),
                            properties = geoJsonFeature.properties || {},
                            anzahlRaeder = properties.anzahl_raeder ||
                                         properties.anzahl_bike ||
                                         parseInt(properties.anzahl_pedelec || "0", 10) +
                                         parseInt(properties.anzahl_bike || "0", 10);

                        return {
                            type: "Feature",
                            geometry: geoJsonFeature.geometry,
                            properties: {
                                anzahl_raeder: anzahlRaeder,
                                uid: properties.uid,
                                name: properties.name,
                                stand: properties.stand,
                                anzahl_pedelec: properties.anzahl_pedelec,
                                anzahl_bike: properties.anzahl_bike,
                                anzahl_cargobike_electric: properties.anzahl_cargobike_electric,
                                art_der_station: properties.art_der_station
                            }
                        };
                    })
                };

            this.$emit("update:value", JSON.stringify(featureCollection));
        },

        /**
         * Reloads stations from layer.
         */
        reloadStations () {
            this.loadStationsFromLayer();
        }
    }
};
</script>

<template>
    <div class="bike-station-layer-input mb-4">
        <div class="mb-3">
            <strong>{{ label }}</strong>
        </div>

        <div class="p-3 border rounded">
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <i class="bi bi-bicycle text-success" />
                        <strong>{{ stationCount }}</strong> Stationen aus Planungsszenario
                    </div>
                    <button
                        type="button"
                        class="btn btn-outline-primary btn-sm"
                        @click="reloadStations"
                    >
                        <i class="bi bi-arrow-clockwise" />
                        Neu laden
                    </button>
                </div>
            </div>

            <div
                v-if="stationCount === 0"
                class="alert alert-warning mb-0"
            >
                <i class="bi bi-exclamation-triangle" />
                Keine Radstationen gefunden. Bitte wählen Sie im Planning Scenario Step die DataSource "StadtRAD-Stationen Hamburg" aus und speichern Sie das Szenario.
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.bike-station-layer-input {
    .border {
        background-color: #f8f9fa;
    }
}
</style>
