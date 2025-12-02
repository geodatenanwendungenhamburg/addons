/**
 * AgentInterpolator - Smooth position interpolation for agent movement
 * Provides linear and spline interpolation between timesteps
 */

/**
 * Linear interpolation between two values
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Linear interpolation between two coordinate arrays
 * @param {Array<number>} coord1 - Start coordinate [x, y]
 * @param {Array<number>} coord2 - End coordinate [x, y]
 * @param {number} t - Interpolation factor (0-1)
 * @returns {Array<number>} Interpolated coordinate
 */
export function lerpCoordinate(coord1, coord2, t) {
    return [
        lerp(coord1[0], coord2[0], t),
        lerp(coord1[1], coord2[1], t)
    ];
}

/**
 * Catmull-Rom spline interpolation for smooth curves
 * @param {number} p0 - Previous control point
 * @param {number} p1 - Start point
 * @param {number} p2 - End point
 * @param {number} p3 - Next control point
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export function catmullRom(p0, p1, p2, p3, t) {
    const t2 = t * t;
    const t3 = t2 * t;

    return 0.5 * (
        (2 * p1) +
        (-p0 + p2) * t +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
        (-p0 + 3 * p1 - 3 * p2 + p3) * t3
    );
}

/**
 * Catmull-Rom spline interpolation for coordinates
 * @param {Array<number>} c0 - Previous control point [x, y]
 * @param {Array<number>} c1 - Start point [x, y]
 * @param {Array<number>} c2 - End point [x, y]
 * @param {Array<number>} c3 - Next control point [x, y]
 * @param {number} t - Interpolation factor (0-1)
 * @returns {Array<number>} Interpolated coordinate
 */
export function catmullRomCoordinate(c0, c1, c2, c3, t) {
    return [
        catmullRom(c0[0], c1[0], c2[0], c3[0], t),
        catmullRom(c0[1], c1[1], c2[1], c3[1], t)
    ];
}

export default class AgentInterpolator {
    constructor() {
        this.agentPositions = new Map(); // agentId -> array of {time, coordinate}
        this.interpolationMode = "catmullRom"; // "linear" or "catmullRom"
    }

    /**
     * Set interpolation mode
     * @param {string} mode - "linear" or "catmullRom"
     */
    setMode(mode) {
        if (mode === "linear" || mode === "catmullRom") {
            this.interpolationMode = mode;
        }
    }

    /**
     * Load agent trajectory data
     * @param {Array} features - GeoJSON features with agent positions
     */
    loadTrajectories(features) {
        this.agentPositions.clear();

        features.forEach(feature => {
            const agentId = feature.properties.agentId;
            const time = feature.properties.time;
            const coordinate = feature.geometry.coordinates;

            if (!this.agentPositions.has(agentId)) {
                this.agentPositions.set(agentId, []);
            }

            this.agentPositions.get(agentId).push({
                time,
                coordinate
            });
        });

        // Sort positions by time for each agent
        this.agentPositions.forEach(positions => {
            positions.sort((a, b) => a.time - b.time);
        });
    }

    /**
     * Get interpolated position for an agent at a specific time
     * @param {string} agentId - Agent identifier
     * @param {number} currentTime - Current simulation time
     * @returns {Object|null} Interpolated feature or null
     */
    getInterpolatedPosition(agentId, currentTime) {
        const positions = this.agentPositions.get(agentId);
        if (!positions || positions.length === 0) {
            return null;
        }

        // Find surrounding timesteps
        let beforeIndex = -1;
        let afterIndex = -1;

        for (let i = 0; i < positions.length; i++) {
            if (positions[i].time <= currentTime) {
                beforeIndex = i;
            }
            if (positions[i].time >= currentTime && afterIndex === -1) {
                afterIndex = i;
                break;
            }
        }

        // Handle edge cases
        if (beforeIndex === -1) {
            return positions[0]; // Before start
        }
        if (afterIndex === -1) {
            return positions[positions.length - 1]; // After end
        }
        if (beforeIndex === afterIndex) {
            return positions[beforeIndex]; // Exact match
        }

        // Interpolate
        const pos1 = positions[beforeIndex];
        const pos2 = positions[afterIndex];
        const timeDelta = pos2.time - pos1.time;
        const t = timeDelta > 0 ? (currentTime - pos1.time) / timeDelta : 0;

        let interpolatedCoord;

        if (this.interpolationMode === "catmullRom" && positions.length >= 4) {
            // Get control points for Catmull-Rom
            const pos0 = positions[Math.max(0, beforeIndex - 1)];
            const pos3 = positions[Math.min(positions.length - 1, afterIndex + 1)];

            interpolatedCoord = catmullRomCoordinate(
                pos0.coordinate,
                pos1.coordinate,
                pos2.coordinate,
                pos3.coordinate,
                t
            );
        } else {
            // Linear interpolation
            interpolatedCoord = lerpCoordinate(pos1.coordinate, pos2.coordinate, t);
        }

        return {
            time: currentTime,
            coordinate: interpolatedCoord,
            // Interpolate velocity if available
            velocity: pos1.velocity && pos2.velocity 
                ? lerp(pos1.velocity, pos2.velocity, t)
                : pos1.velocity
        };
    }

    /**
     * Get all interpolated positions for current time
     * @param {number} currentTime - Current simulation time
     * @returns {Map} Map of agentId -> interpolated position
     */
    getAllInterpolatedPositions(currentTime) {
        const result = new Map();

        this.agentPositions.forEach((positions, agentId) => {
            const interpolated = this.getInterpolatedPosition(agentId, currentTime);
            if (interpolated) {
                result.set(agentId, interpolated);
            }
        });

        return result;
    }

    /**
     * Get trail path for an agent
     * @param {string} agentId - Agent identifier
     * @param {number} currentTime - Current simulation time
     * @param {number} trailLength - Number of previous positions to include
     * @returns {Array<Array<number>>} Array of coordinates for trail
     */
    getTrailPath(agentId, currentTime, trailLength = 5) {
        const positions = this.agentPositions.get(agentId);
        if (!positions || positions.length === 0) {
            return [];
        }

        const trail = [];
        const currentPos = this.getInterpolatedPosition(agentId, currentTime);
        
        if (currentPos) {
            trail.push(currentPos.coordinate);
        }

        // Add previous positions
        for (let i = positions.length - 1; i >= 0 && trail.length < trailLength; i--) {
            if (positions[i].time < currentTime) {
                trail.push(positions[i].coordinate);
            }
        }

        return trail;
    }

    /**
     * Clear all trajectory data
     */
    clear() {
        this.agentPositions.clear();
    }

    /**
     * Get number of agents
     * @returns {number} Number of agents with trajectories
     */
    getAgentCount() {
        return this.agentPositions.size;
    }

    /**
     * Get time range
     * @returns {Object} {minTime, maxTime}
     */
    getTimeRange() {
        let minTime = Infinity;
        let maxTime = -Infinity;

        this.agentPositions.forEach(positions => {
            if (positions.length > 0) {
                minTime = Math.min(minTime, positions[0].time);
                maxTime = Math.max(maxTime, positions[positions.length - 1].time);
            }
        });

        return {
            minTime: minTime === Infinity ? 0 : minTime,
            maxTime: maxTime === -Infinity ? 0 : maxTime
        };
    }
}
