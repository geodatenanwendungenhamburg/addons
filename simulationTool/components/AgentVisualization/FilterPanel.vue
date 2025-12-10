<template>
    <div class="filter-panel">
        <div class="panel-header">
            <h4>Filter & Einstellungen</h4>
        </div>

        <!-- Capability Filters -->
        <div class="filter-section">
            <h5 class="section-title">Fortbewegungsart</h5>
            <div class="filter-options">
                <div class="form-check">
                    <input
                        id="filter-walking"
                        v-model="filters.walking"
                        type="checkbox"
                        class="form-check-input"
                        @change="updateFilter('walking', filters.walking)"
                    >
                    <label
                        class="form-check-label"
                        for="filter-walking"
                    >
                        <span class="filter-icon walking-icon" />
                        Zu Fuß
                        <span class="badge bg-primary">{{ walkingCount }}</span>
                    </label>
                </div>
                <div class="form-check">
                    <input
                        id="filter-rental-bike"
                        v-model="filters.rentalBike"
                        type="checkbox"
                        class="form-check-input"
                        @change="updateFilter('rentalBike', filters.rentalBike)"
                    >
                    <label
                        class="form-check-label"
                        for="filter-rental-bike"
                    >
                        <span class="filter-icon rental-bike-icon" />
                        Leihrad
                        <span class="badge bg-success">{{ rentalBikeCount }}</span>
                    </label>
                </div>
            </div>
        </div>

        <!-- Visualization Settings -->
        <div class="filter-section">
            <h5 class="section-title">Visualisierung</h5>
            
            <!-- Trail toggle -->
            <div class="form-check form-switch">
                <input
                    id="show-trails"
                    v-model="showTrails"
                    type="checkbox"
                    class="form-check-input"
                    @change="updateShowTrails"
                >
                <label
                    class="form-check-label"
                    for="show-trails"
                >
                    Bewegungspfade anzeigen
                </label>
            </div>

            <!-- Trail length slider -->
            <div
                v-if="showTrails"
                class="setting-control"
            >
                <label for="trail-length">
                    Pfadlänge: <strong>{{ trailLength }}</strong> Schritte
                </label>
                <input
                    id="trail-length"
                    v-model.number="trailLength"
                    type="range"
                    class="form-range"
                    min="2"
                    max="20"
                    step="1"
                    @input="updateTrailLength"
                >
            </div>

            <!-- Interpolation mode -->
            <div class="setting-control">
                <label for="interpolation-mode">Interpolation:</label>
                <select
                    id="interpolation-mode"
                    v-model="interpolationMode"
                    class="form-select form-select-sm"
                    @change="updateInterpolationMode"
                >
                    <option value="linear">Linear</option>
                    <option value="catmullRom">Catmull-Rom (glatt)</option>
                </select>
            </div>

            <!-- Heatmap toggle -->
            <div class="form-check form-switch">
                <input
                    id="show-heatmap"
                    v-model="showHeatmap"
                    type="checkbox"
                    class="form-check-input"
                    @change="updateShowHeatmap"
                >
                <label
                    class="form-check-label"
                    for="show-heatmap"
                >
                    Heatmap anzeigen
                </label>
            </div>
        </div>

        <!-- Performance Info -->
        <div class="filter-section">
            <h5 class="section-title">Performance</h5>
            <div class="performance-stats">
                <div class="stat-item">
                    <span class="stat-label">FPS:</span>
                    <span
                        class="stat-value"
                        :class="getFPSClass(fps)"
                    >{{ fps }}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Agenten:</span>
                    <span class="stat-value">{{ visibleAgentCount }} / {{ agentCount }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import {mapState} from "vuex";

export default {
    name: "FilterPanel",
    data () {
        return {
            filters: {
                walking: true,
                rentalBike: true
            },
            showTrails: true,
            trailLength: 5,
            interpolationMode: "catmullRom",
            showHeatmap: false
        };
    },
    computed: {
        ...mapState("agentVisualization", [
            "fps",
            "agentCount",
            "visibleAgentCount",
            "features",
            "currentTime"
        ]),

        /**
         * Count walking agents at current time
         */
        walkingCount () {
            if (!this.features || !this.currentTime) {
                return 0;
            }

            // Group features by agentId
            const agentMap = new Map();

            this.features.forEach(f => {
                const agentId = f.properties.agentId;

                if (!agentId) {
                    return;
                }

                if (!agentMap.has(agentId)) {
                    agentMap.set(agentId, []);
                }
                agentMap.get(agentId).push(f);
            });

            // Count agents with walking capability at current time
            let count = 0;

            agentMap.forEach((agentFeatures) => {
                // Find closest feature to current time
                let closestFeature = agentFeatures[0],
                    minTimeDiff = Math.abs(this.currentTime - agentFeatures[0].properties.time);

                for (const feature of agentFeatures) {
                    const timeDiff = Math.abs(this.currentTime - feature.properties.time);

                    if (timeDiff < minTimeDiff && feature.properties.time <= this.currentTime) {
                        minTimeDiff = timeDiff;
                        closestFeature = feature;
                    }
                }

                if (closestFeature.properties.activeCapability === "walking") {
                    count++;
                }
            });

            return count;
        },

        /**
         * Count rental bike agents at current time
         */
        rentalBikeCount () {
            if (!this.features || !this.currentTime) {
                return 0;
            }

            // Group features by agentId
            const agentMap = new Map();

            this.features.forEach(f => {
                const agentId = f.properties.agentId;

                if (!agentId) {
                    return;
                }

                if (!agentMap.has(agentId)) {
                    agentMap.set(agentId, []);
                }
                agentMap.get(agentId).push(f);
            });

            // Count agents with rental bike capability at current time
            let count = 0;

            agentMap.forEach((agentFeatures) => {
                // Find closest feature to current time
                let closestFeature = agentFeatures[0],
                    minTimeDiff = Math.abs(this.currentTime - agentFeatures[0].properties.time);

                for (const feature of agentFeatures) {
                    const timeDiff = Math.abs(this.currentTime - feature.properties.time);

                    if (timeDiff < minTimeDiff && feature.properties.time <= this.currentTime) {
                        minTimeDiff = timeDiff;
                        closestFeature = feature;
                    }
                }

                if (closestFeature.properties.activeCapability === "cyclingRentalBike") {
                    count++;
                }
            });

            return count;
        }
    },
    mounted () {
        // Initialize from store
        this.showTrails = this.$store.state.agentVisualization.showTrails;
        this.trailLength = this.$store.state.agentVisualization.trailLength;
        this.interpolationMode = this.$store.state.agentVisualization.interpolationMode;
        this.renderMode = this.$store.state.agentVisualization.renderMode;
        this.showHeatmap = this.$store.state.agentVisualization.showHeatmap;
        this.filters.walking = this.$store.state.agentVisualization.filters.walking;
        this.filters.rentalBike = this.$store.state.agentVisualization.filters.rentalBike || true;
    },
    methods: {
        /**
         * Update filter
         */
        updateFilter (filterName, value) {
            this.$store.dispatch("agentVisualization/updateFilter", {
                filterName,
                value
            });
        },

        /**
         * Update show trails
         */
        updateShowTrails () {
            this.$store.commit("agentVisualization/setShowTrails", this.showTrails);
        },

        /**
         * Update trail length
         */
        updateTrailLength () {
            this.$store.commit("agentVisualization/setTrailLength", this.trailLength);
        },

        /**
         * Update interpolation mode
         */
        updateInterpolationMode () {
            this.$store.commit("agentVisualization/setInterpolationMode", this.interpolationMode);
        },

        /**
         * Update show heatmap
         */
        updateShowHeatmap () {
            this.$store.commit("agentVisualization/setShowHeatmap", this.showHeatmap);
        },

        /**
         * Get FPS class for color coding
         */
        getFPSClass (fps) {
            if (fps >= 50) {
                return "text-success";
            }

            if (fps >= 30) {
                return "text-warning";
            }

            return "text-danger";
        }
    }
};
</script>

<style lang="scss" scoped>
.filter-panel {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1rem;
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.panel-header {
    h4 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: #2c3e50;
    }
}

.filter-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.section-title {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #495057;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #dee2e6;
    padding-bottom: 0.5rem;
}

.filter-options {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-check-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #2c3e50;
}

.filter-icon {
    display: inline-block;
    width: 16px;
    height: 16px;
    border-radius: 50%;

    &.walking-icon {
        background: #4287f5; // blue
    }

    &.rental-bike-icon {
        background: #28a745; // green
        border: 2px solid #155724;
    }
}

.badge {
    margin-left: auto;
    font-size: 0.75rem;
}

.setting-control {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    label {
        font-size: 0.875rem;
        color: #6c757d;
        margin: 0;
    }

    strong {
        color: #2c3e50;
    }
}

.performance-stats {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background: #f8f9fa;
    border-radius: 4px;
}

.stat-label {
    font-size: 0.875rem;
    color: #6c757d;
}

.stat-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: #2c3e50;
    font-variant-numeric: tabular-nums;

    &.text-success {
        color: #28a745;
    }

    &.text-warning {
        color: #ffc107;
    }

    &.text-danger {
        color: #dc3545;
    }
}
</style>
