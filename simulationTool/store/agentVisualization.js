/**
 * Vuex module for Agent Visualization
 * Manages state for time control, filters, and agent data
 */

const state = {
    // Data
    agentData: null,
    planningScenarioData: null,
    timeSteps: [],
    features: [],
    
    // Time control
    currentTime: null,
    isPlaying: false,
    speed: 1.0,
    loop: false,
    
    // Filters
    filters: {
        walking: true,
        bike: true,
        rentalBike: true,
        zones: [],
        agentIds: []
    },
    
    // Visualization settings
    showTrails: true,
    trailLength: 5,
    interpolationMode: "catmullRom", // "linear" or "catmullRom"
    showHeatmap: false,
    
    // Performance
    fps: 0,
    agentCount: 0,
    visibleAgentCount: 0,
    
    // UI state
    selectedAgentId: null,
    hoveredAgentId: null,
    timeSeriesMetrics: []
};

const getters = {
    /**
     * Get filtered features based on current filters
     */
    filteredFeatures: (state) => {
        if (!state.features || state.features.length === 0) {
            return [];
        }

        return state.features.filter(feature => {
            const props = feature.properties;

            // Filter by capability
            if (props.activeCapability === "walking" && !state.filters.walking) {
                return false;
            }

            if (props.activeCapability === "bike" && !state.filters.bike) {
                return false;
            }

            if (props.activeCapability === "cyclingRentalBike" && !state.filters.rentalBike) {
                return false;
            }

            // Filter by agent ID
            if (state.filters.agentIds.length > 0 && 
                !state.filters.agentIds.includes(props.agentId)) {
                return false;
            }

            return true;
        });
    },

    /**
     * Get current time as formatted string
     */
    formattedCurrentTime: (state) => {
        if (!state.currentTime) {
            return "--:--:--";
        }

        const date = new Date(state.currentTime);

        if (isNaN(date.getTime())) {
            return "--:--:--";
        }

        return date.toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });
    },

    /**
     * Get time range
     */
    timeRange: (state) => {
        if (!state.timeSteps || state.timeSteps.length === 0) {
            return {min: 0, max: 0};
        }

        return {
            min: state.timeSteps[0],
            max: state.timeSteps[state.timeSteps.length - 1]
        };
    },

    /**
     * Get current timestep index
     */
    currentTimeStepIndex: (state) => {
        if (!state.timeSteps || state.timeSteps.length === 0) {
            return 0;
        }

        return state.timeSteps.findIndex(t => t >= state.currentTime);
    },

    /**
     * Check if at end of timeline
     */
    isAtEnd: (state, getters) => {
        const range = getters.timeRange;

        return state.currentTime >= range.max;
    },

    /**
     * Check if at start of timeline
     */
    isAtStart: (state, getters) => {
        const range = getters.timeRange;

        return state.currentTime <= range.min;
    }
};

const mutations = {
    /**
     * Set agent data
     */
    setAgentData (state, data) {
        state.agentData = data;
    },

    /**
     * Set planning scenario data
     */
    setPlanningScenarioData (state, data) {
        state.planningScenarioData = data;
    },

    /**
     * Set timesteps
     */
    setTimeSteps (state, timeSteps) {
        state.timeSteps = timeSteps;
    },

    /**
     * Set features
     */
    setFeatures (state, features) {
        state.features = features;
    },

    /**
     * Set current time
     */
    setCurrentTime (state, time) {
        state.currentTime = time;
    },

    /**
     * Set playing state
     */
    setPlaying (state, isPlaying) {
        state.isPlaying = isPlaying;
    },

    /**
     * Set speed
     */
    setSpeed (state, speed) {
        state.speed = speed;
    },

    /**
     * Set loop mode
     */
    setLoop (state, loop) {
        state.loop = loop;
    },

    /**
     * Set filter value
     */
    setFilter (state, {filterName, value}) {
        if (state.filters.hasOwnProperty(filterName)) {
            state.filters[filterName] = value;
        }
    },

    /**
     * Toggle filter
     */
    toggleFilter (state, filterName) {
        if (typeof state.filters[filterName] === "boolean") {
            state.filters[filterName] = !state.filters[filterName];
        }
    },

    /**
     * Set show trails
     */
    setShowTrails (state, show) {
        state.showTrails = show;
    },

    /**
     * Set trail length
     */
    setTrailLength (state, length) {
        state.trailLength = length;
    },

    /**
     * Set interpolation mode
     */
    setInterpolationMode (state, mode) {
        state.interpolationMode = mode;
    },

    /**
     * Set render mode
     */
    setRenderMode (state, mode) {
        state.renderMode = mode;
    },

    /**
     * Set show heatmap
     */
    setShowHeatmap (state, show) {
        state.showHeatmap = show;
    },

    /**
     * Set FPS
     */
    setFPS (state, fps) {
        state.fps = fps;
    },

    /**
     * Set agent count
     */
    setAgentCount (state, count) {
        state.agentCount = count;
    },

    /**
     * Set visible agent count
     */
    setVisibleAgentCount (state, count) {
        state.visibleAgentCount = count;
    },

    /**
     * Set selected agent ID
     */
    setSelectedAgentId (state, agentId) {
        state.selectedAgentId = agentId;
    },

    /**
     * Set hovered agent ID
     */
    setHoveredAgentId (state, agentId) {
        state.hoveredAgentId = agentId;
    },

    /**
     * Set time series metrics
     */
    setTimeSeriesMetrics (state, metrics) {
        state.timeSeriesMetrics = metrics;
    }
};

const actions = {
    /**
     * Load agent data from GeoJSON
     */
    loadAgentData ({commit}, geojson) {
        commit("setAgentData", geojson);

        // Extract features
        const features = geojson.features || [];

        // Extract unique timesteps and convert to timestamps if needed
        const timeSet = new Set();

        features.forEach(feature => {
            if (feature.properties && feature.properties.time) {
                let timestamp = feature.properties.time;

                // Convert ISO string to timestamp if needed
                if (typeof timestamp === "string") {
                    timestamp = new Date(timestamp).getTime();
                    // Update the feature property to use timestamp
                    feature.properties.time = timestamp;
                }

                timeSet.add(timestamp);
            }

            // Extract agentId from feature.id if not in properties
            if (!feature.properties.agentId && feature.id) {
                // For new green4bikes data: the UUID IS the agentId (same UUID = same agent over time)
                // For old format: "agent-0-t0" -> agentId = "agent-0"
                const idParts = feature.id.split("-");

                // Check if it's a UUID (5 parts) or old format (2-3 parts)
                if (idParts.length === 5) {
                    // UUID format: the entire UUID identifies the agent
                    feature.properties.agentId = feature.id;
                }
                else if (idParts.length >= 2) {
                    // Old format
                    feature.properties.agentId = idParts[0] + "-" + idParts[1];
                }
            }
        });

        // Commit features AFTER time conversion so they have numeric timestamps
        commit("setFeatures", features);

        const timeSteps = Array.from(timeSet).sort((a, b) => a - b);

        commit("setTimeSteps", timeSteps);

        // Set initial time
        if (timeSteps.length > 0) {
            commit("setCurrentTime", timeSteps[0]);
        }

        // Calculate agent count
        const agentIds = new Set();

        features.forEach(feature => {
            if (feature.properties && feature.properties.agentId) {
                agentIds.add(feature.properties.agentId);
            }
        });

        commit("setAgentCount", agentIds.size);
    },

    /**
     * Load planning scenario data (scenario area, source, target)
     */
    loadPlanningScenarioData ({commit}, geojson) {
        commit("setPlanningScenarioData", geojson);
    },

    /**
     * Set current time
     */
    setCurrentTime ({commit}, time) {
        commit("setCurrentTime", time);
    },

    /**
     * Set playing state
     */
    setPlaying ({commit}, isPlaying) {
        commit("setPlaying", isPlaying);
    },

    /**
     * Set speed
     */
    setSpeed ({commit}, speed) {
        commit("setSpeed", speed);
    },

    /**
     * Set loop mode
     */
    setLoop ({commit}, loop) {
        commit("setLoop", loop);
    },

    /**
     * Update filter
     */
    updateFilter ({commit}, {filterName, value}) {
        commit("setFilter", {filterName, value});
    },

    /**
     * Toggle filter
     */
    toggleFilter ({commit}, filterName) {
        commit("toggleFilter", filterName);
    },

    /**
     * Set FPS
     */
    setFPS ({commit}, fps) {
        commit("setFPS", fps);
    },

    /**
     * Select agent
     */
    selectAgent ({commit}, agentId) {
        commit("setSelectedAgentId", agentId);
    },

    /**
     * Hover agent
     */
    hoverAgent ({commit}, agentId) {
        commit("setHoveredAgentId", agentId);
    },

    /**
     * Calculate time series metrics
     */
    calculateTimeSeriesMetrics ({state, commit}) {
        const metrics = [];
        const timeSteps = state.timeSteps;

        timeSteps.forEach(time => {
            const featuresAtTime = state.features.filter(
                f => f.properties.time === time
            );

            const walkingCount = featuresAtTime.filter(
                f => f.properties.activeCapability === "walking"
            ).length;

            const rentalBikeCount = featuresAtTime.filter(
                f => f.properties.activeCapability === "cyclingRentalBike"
            ).length;

            const velocities = featuresAtTime
                .map(f => f.properties.velocity || 0)
                .filter(v => v > 0);

            const avgVelocity = velocities.length > 0
                ? velocities.reduce((sum, v) => sum + v, 0) / velocities.length
                : 0;

            metrics.push({
                time,
                totalCount: featuresAtTime.length,
                walkingCount,
                rentalBikeCount,
                avgVelocity
            });
        });

        commit("setTimeSeriesMetrics", metrics);
    }
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions
};
