/**
 * Helper functions for Agent Visualization
 */

/**
 * Color mapping for agent capabilities
 */
export const CAPABILITY_COLORS = {
    walking: [66, 135, 245], // blue
    bike: [253, 126, 20], // orange
    cyclingRentalBike: [40, 167, 69], // green
    default: [100, 100, 100] // gray
};

/**
 * Get color for capability
 * @param {string} capability - Agent capability
 * @returns {Array} RGB color array
 */
export function getCapabilityColor (capability) {
    return CAPABILITY_COLORS[capability] || CAPABILITY_COLORS.default;
}

/**
 * Binary search to find closest feature to current time
 * @param {Array} features - Sorted array of features by time
 * @param {number} currentTime - Target time
 * @returns {Object|null} Closest feature
 */
export function findClosestFeature (features, currentTime) {
    if (!features || features.length === 0) {
        return null;
    }

    if (features.length === 1) {
        return features[0];
    }

    // Binary search for closest time
    let left = 0,
        right = features.length - 1,
        closest = features[0];

    while (left <= right) {
        const mid = Math.floor((left + right) / 2),
            feature = features[mid],
            time = feature.properties.time;

        if (time === currentTime) {
            return feature;
        }

        // Update closest if this is closer
        if (Math.abs(time - currentTime) < Math.abs(closest.properties.time - currentTime)) {
            closest = feature;
        }

        if (time < currentTime) {
            left = mid + 1;
        }
        else {
            right = mid - 1;
        }
    }

    return closest;
}

/**
 * Check if agent passes filters
 * @param {string} capability - Agent capability
 * @param {Object} filters - Filter object {walking: bool, bike: bool, rentalBike: bool}
 * @returns {boolean} True if agent should be shown
 */
export function passesFilters (capability, filters) {
    if (capability === "walking" && !filters.walking) {
        return false;
    }
    if (capability === "bike" && !filters.bike) {
        return false;
    }
    if (capability === "cyclingRentalBike" && !filters.rentalBike) {
        return false;
    }
    return true;
}

/**
 * Get capability label for display
 * @param {string} capability - Capability key
 * @returns {string} Localized label
 */
export function getCapabilityLabel (capability) {
    const labels = {
        walking: "Zu Fuß",
        bike: "Fahrrad",
        cyclingRentalBike: "Leihrad"
    };

    return labels[capability] || capability;
}
