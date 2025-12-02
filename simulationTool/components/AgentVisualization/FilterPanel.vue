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
                        <span class="badge bg-success">{{ walkingCount }}</span>
                    </label>
                </div>
                <div class="form-check">
                    <input
                        id="filter-bike"
                        v-model="filters.bike"
                        type="checkbox"
                        class="form-check-input"
                        @change="updateFilter('bike', filters.bike)"
                    >
                    <label
                        class="form-check-label"
                        for="filter-bike"
                    >
                        <span class="filter-icon bike-icon" />
                        Fahrrad
                        <span class="badge bg-warning">{{ bikeCount }}</span>
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
                bike: true
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
            if (!this.features) {
                return 0;
            }

            return this.features.filter(f =>
                f.properties.time === this.currentTime &&
                f.properties.activeCapability === "walking"
            ).length;
        },

        /**
         * Count bike agents at current time
         */
        bikeCount () {
            if (!this.features) {
                return 0;
            }

            return this.features.filter(f =>
                f.properties.time === this.currentTime &&
                f.properties.activeCapability === "bike"
            ).length;
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
        this.filters.bike = this.$store.state.agentVisualization.filters.bike;
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
        background: #28a745;
    }

    &.bike-icon {
        background: #fd7e14;
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
