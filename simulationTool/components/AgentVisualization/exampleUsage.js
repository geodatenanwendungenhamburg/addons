/**
 * Example: How to use Agent Visualization programmatically
 * 
 * This example shows how to load agent data into the AgentVisualization
 * component from an external API or pre-loaded data source.
 */

// Example 1: Load from URL
async function loadAgentsFromUrl(url) {
    const response = await fetch(url);
    const featureCollection = await response.json();
    
    // Dispatch to store or pass to component
    store.dispatch("Modules/SimulationTool/setAgentData", featureCollection);
}

// Example 2: Generate sample data (for testing)
function generateSampleAgentData() {
    const features = [];
    const baseTime = new Date("2024-12-01T06:00:00");
    const numAgents = 100;
    const numTimeSteps = 60;
    
    for (let t = 0; t < numTimeSteps; t++) {
        const time = new Date(baseTime.getTime() + t * 60000); // 1 minute steps
        
        for (let i = 0; i < numAgents; i++) {
            const lat = 53.45 + (Math.random() - 0.5) * 0.01;
            const lon = 9.99 + (Math.random() - 0.5) * 0.01;
            const hasBike = Math.random() > 0.7;
            
            features.push({
                type: "Feature",
                id: `agent-${i}-t${t}`,
                geometry: {
                    type: "Point",
                    coordinates: [lon, lat]
                },
                properties: {
                    time: time.toISOString(),
                    activeCapability: hasBike ? "bike" : "walking",
                    hasBike: hasBike,
                    velocity: hasBike ? 5.5 : 1.4,
                    routeLength: Math.random() * 2000,
                    startX: 9.99e7,
                    startY: 5.345e8,
                    goalX: 9.99e7 + Math.random() * 1000,
                    goalY: 5.345e8 + Math.random() * 1000,
                    step: t,
                    gender: Math.random() > 0.5 ? "male" : "female"
                }
            });
        }
    }
    
    return {
        type: "FeatureCollection",
        features: features
    };
}

// Example 3: Filter and transform data
function filterAgentsByMode(featureCollection, mode) {
    return {
        type: "FeatureCollection",
        features: featureCollection.features.filter(
            f => f.properties.activeCapability === mode
        )
    };
}

// Example 4: Get statistics from agent data
function getAgentStatistics(featureCollection) {
    const stats = {
        totalAgents: new Set(featureCollection.features.map(f => f.id.split("-")[1])).size,
        timeSteps: new Set(featureCollection.features.map(f => f.properties.time)).size,
        averageVelocity: 0,
        modeDistribution: {}
    };
    
    let sumVelocity = 0;
    featureCollection.features.forEach(feature => {
        const mode = feature.properties.activeCapability;
        sumVelocity += feature.properties.velocity || 0;
        stats.modeDistribution[mode] = (stats.modeDistribution[mode] || 0) + 1;
    });
    
    stats.averageVelocity = sumVelocity / featureCollection.features.length;
    
    return stats;
}

// Example 5: Export current view as GeoJSON
function exportCurrentTimeStep(agentVisualizationComponent) {
    const currentTime = agentVisualizationComponent.currentTime;
    const features = agentVisualizationComponent.timeIndex[currentTime] || [];
    
    const exportData = {
        type: "FeatureCollection",
        properties: {
            timestamp: currentTime,
            agentCount: features.length
        },
        features: features
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `agents_${currentTime.replace(/:/g, "-")}.geojson`;
    link.click();
}

// Example 6: Connect to real-time simulation API
class AgentSimulationStream {
    constructor(apiUrl, updateCallback) {
        this.apiUrl = apiUrl;
        this.updateCallback = updateCallback;
        this.eventSource = null;
    }
    
    connect() {
        this.eventSource = new EventSource(this.apiUrl);
        
        this.eventSource.onmessage = (event) => {
            const agentUpdate = JSON.parse(event.data);
            this.updateCallback(agentUpdate);
        };
        
        this.eventSource.onerror = (error) => {
            console.error("Stream error:", error);
            this.disconnect();
        };
    }
    
    disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }
}

// Usage:
// const stream = new AgentSimulationStream(
//     "https://api.simulation.example/agents/stream",
//     (update) => {
//         // Add new features to visualization
//         agentVisualization.addFeatures(update.features);
//     }
// );
// stream.connect();

export {
    loadAgentsFromUrl,
    generateSampleAgentData,
    filterAgentsByMode,
    getAgentStatistics,
    exportCurrentTimeStep,
    AgentSimulationStream
};
