/**
 * Parser for converting simulation GeoJSON data into compact AgentTrajectoryCollection format.
 * This format separates static metadata from dynamic trajectory data for more efficient storage.
 */

/**
 * Extracts static metadata from the first feature of an agent
 * @param {Object} firstFeature - The first feature of the agent's trajectory
 * @param {Object[]} allFeatures - All features of the agent
 * @returns {Object} Static metadata object
 */
function extractMetadata (firstFeature, allFeatures) {
    const properties = firstFeature?.properties || {},
        lastFeature = allFeatures[allFeatures.length - 1],
        firstCoords = firstFeature?.geometry?.coordinates || [0, 0],
        lastCoords = lastFeature?.geometry?.coordinates || [0, 0],
        // Calculate main modal choice (most frequently used capability)
        capabilityCounts = {};

    allFeatures.forEach(feature => {
        const capability = feature?.properties?.activeCapability || "unknown";

        capabilityCounts[capability] = (capabilityCounts[capability] || 0) + 1;
    });

    return {
        gender: properties.gender || "unknown",
        startX: firstCoords[0],
        startY: firstCoords[1],
        goalX: lastCoords[0],
        goalY: lastCoords[1],
        distanceStartGoal: properties.distanceStartGoal || calculateDistance(firstCoords, lastCoords),
        routeMainModalChoice: Object.entries(capabilityCounts)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || "unknown",
        routeLength: properties.routeLength || properties.travelDistance || 0
    };
}

/**
 * Simple haversine distance calculation in meters
 * @param {Array} coord1 - [longitude, latitude]
 * @param {Array} coord2 - [longitude, latitude]
 * @returns {Number} Distance in meters
 */
function calculateDistance (coord1, coord2) {
    const R = 6371000, // Earth radius in meters
        lat1 = coord1[1] * Math.PI / 180,
        lat2 = coord2[1] * Math.PI / 180,
        deltaLat = (coord2[1] - coord1[1]) * Math.PI / 180,
        deltaLon = (coord2[0] - coord1[0]) * Math.PI / 180,
        a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2),
        c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Converts a feature to a trajectory step
 * @param {Object} feature - GeoJSON feature
 * @param {Number} index - Step index
 * @returns {Object} Trajectory step object
 */
function featureToTrajectoryStep (feature, index) {
    const properties = feature?.properties || {},
        coordinates = feature?.geometry?.coordinates || [0, 0],
        step = {
            time: properties.time || properties.timestamp || new Date().toISOString(),
            step: index + 1,
            coordinates: coordinates,
            activeCapability: properties.activeCapability || properties.capability || "walking",
            velocity: properties.velocity !== undefined ? properties.velocity : 0,
            expectedTravelTime: properties.expectedTravelTime !== undefined ? properties.expectedTravelTime : 0,
            comment: properties.comment || ""
        };

    // Add optional hasBike property if present
    if (properties.hasBike !== undefined) {
        step.hasBike = properties.hasBike;
    }

    return step;
}

/**
 * Converts a GeoJSON FeatureCollection to AgentTrajectoryCollection format
 * @param {Object} geojson - GeoJSON FeatureCollection with agent trajectories
 * @returns {Object} AgentTrajectoryCollection with compact format
 */
export function convertToAgentTrajectoryCollection (geojson) {
    if (!geojson || geojson.type !== "FeatureCollection" || !Array.isArray(geojson.features)) {
        throw new Error("Invalid GeoJSON format. Expected a FeatureCollection with features array.");
    }

    // Group features by agentId
    const agentGroups = {};

    geojson.features.forEach(feature => {
        const agentId = feature?.properties?.agentId || feature?.properties?.agent_id || feature?.id || "unknown";

        if (!agentGroups[agentId]) {
            agentGroups[agentId] = [];
        }
        agentGroups[agentId].push(feature);
    });

    // Sort each agent's features by time or step
    Object.keys(agentGroups).forEach(agentId => {
        agentGroups[agentId].sort((a, b) => {
            const timeA = a?.properties?.time || a?.properties?.timestamp || a?.properties?.step || 0,
                timeB = b?.properties?.time || b?.properties?.timestamp || b?.properties?.step || 0;

            if (typeof timeA === "string" && typeof timeB === "string") {
                return timeA.localeCompare(timeB);
            }
            return timeA - timeB;
        });
    });

    // Build the compact structure
    // eslint-disable-next-line one-var
    const agents = {};

    Object.entries(agentGroups).forEach(([agentId, features]) => {
        if (features.length === 0) {
            return;
        }

        agents[agentId] = {
            agentId: agentId,
            metadata: extractMetadata(features[0], features),
            trajectory: features.map((feature, index) => featureToTrajectoryStep(feature, index))
        };
    });

    // eslint-disable-next-line one-var
    const result = {
        type: "AgentTrajectoryCollection",
        description: "Gruppierte Agenten-Trajektorien - Kompakte Datenstruktur",
        version: "2.0",
        agents: agents
    };

    // Preserve metadata from original GeoJSON if present
    if (geojson.metadata) {
        result.metadata = geojson.metadata;
    }

    return result;
}

/**
 * Converts AgentTrajectoryCollection back to GeoJSON FeatureCollection
 * This is useful for loading compact format back into the visualization
 * @param {Object} agentCollection - AgentTrajectoryCollection object
 * @returns {Object} GeoJSON FeatureCollection
 */
export function convertToGeoJSON (agentCollection) {
    if (!agentCollection || agentCollection.type !== "AgentTrajectoryCollection") {
        throw new Error("Invalid format. Expected AgentTrajectoryCollection.");
    }

    const features = [];

    Object.entries(agentCollection.agents || {}).forEach(([agentId, agent]) => {
        agent.trajectory.forEach(step => {
            const feature = {
                type: "Feature",
                id: `${agentId}_step_${step.step}`,
                geometry: {
                    type: "Point",
                    coordinates: step.coordinates
                },
                properties: {
                    agentId: agentId,
                    time: step.time,
                    step: step.step,
                    activeCapability: step.activeCapability,
                    velocity: step.velocity,
                    expectedTravelTime: step.expectedTravelTime,
                    comment: step.comment,
                    // Include metadata for reference
                    gender: agent.metadata.gender,
                    routeMainModalChoice: agent.metadata.routeMainModalChoice
                }
            };

            if (step.hasBike !== undefined) {
                feature.properties.hasBike = step.hasBike;
            }

            features.push(feature);
        });
    });

    // eslint-disable-next-line one-var
    const geojson = {
        type: "FeatureCollection",
        features: features
    };

    // Preserve metadata if present
    if (agentCollection.metadata) {
        geojson.metadata = agentCollection.metadata;
    }

    return geojson;
}

/**
 * Gets statistics about the agent trajectory collection
 * @param {Object} agentCollection - AgentTrajectoryCollection object
 * @returns {Object} Statistics object
 */
export function getStatistics (agentCollection) {
    if (!agentCollection || !agentCollection.agents) {
        return null;
    }

    const agents = Object.values(agentCollection.agents),
        totalAgents = agents.length,
        modalChoices = {};
    let totalSteps = 0;

    agents.forEach(agent => {
        totalSteps += agent.trajectory.length;
        const choice = agent.metadata.routeMainModalChoice;

        modalChoices[choice] = (modalChoices[choice] || 0) + 1;
    });

    return {
        totalAgents,
        totalSteps,
        averageStepsPerAgent: totalAgents > 0 ? Math.round(totalSteps / totalAgents) : 0,
        modalChoices
    };
}

export default {
    convertToAgentTrajectoryCollection,
    convertToGeoJSON,
    getStatistics
};
