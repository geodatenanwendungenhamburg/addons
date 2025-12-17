import {expect} from "chai";
import {
    convertToAgentTrajectoryCollection,
    convertToGeoJSON,
    getStatistics
} from "../../../../utils/agentTrajectoryParser.js";

describe("addons/simulationTool/utils/agentTrajectoryParser.js", () => {
    describe("convertToAgentTrajectoryCollection", () => {
        it("should throw error for invalid input", () => {
            expect(() => convertToAgentTrajectoryCollection(null)).to.throw("Invalid GeoJSON format");
            expect(() => convertToAgentTrajectoryCollection({})).to.throw("Invalid GeoJSON format");
            expect(() => convertToAgentTrajectoryCollection({type: "Feature"})).to.throw("Invalid GeoJSON format");
        });

        it("should convert a simple GeoJSON FeatureCollection to AgentTrajectoryCollection", () => {
            const geojson = {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        id: "agent1_step1",
                        geometry: {
                            type: "Point",
                            coordinates: [9.9648874, 53.447135]
                        },
                        properties: {
                            agentId: "agent-1",
                            time: "2024-12-10T10:00:01",
                            step: 1,
                            activeCapability: "walking",
                            velocity: 1.4,
                            expectedTravelTime: 1200,
                            gender: "male",
                            routeLength: 3680
                        }
                    },
                    {
                        type: "Feature",
                        id: "agent1_step2",
                        geometry: {
                            type: "Point",
                            coordinates: [9.9650245, 53.4475621]
                        },
                        properties: {
                            agentId: "agent-1",
                            time: "2024-12-10T10:00:02",
                            step: 2,
                            activeCapability: "walking",
                            velocity: 1.4,
                            expectedTravelTime: 1190,
                            gender: "male",
                            routeLength: 3680
                        }
                    }
                ]
            };

            const result = convertToAgentTrajectoryCollection(geojson);

            expect(result.type).to.equal("AgentTrajectoryCollection");
            expect(result.version).to.equal("2.0");
            expect(result.agents).to.be.an("object");
            expect(result.agents["agent-1"]).to.exist;
            expect(result.agents["agent-1"].agentId).to.equal("agent-1");
            expect(result.agents["agent-1"].metadata).to.exist;
            expect(result.agents["agent-1"].metadata.gender).to.equal("male");
            expect(result.agents["agent-1"].metadata.startX).to.equal(9.9648874);
            expect(result.agents["agent-1"].metadata.startY).to.equal(53.447135);
            expect(result.agents["agent-1"].trajectory).to.be.an("array");
            expect(result.agents["agent-1"].trajectory).to.have.lengthOf(2);
            expect(result.agents["agent-1"].trajectory[0].step).to.equal(1);
            expect(result.agents["agent-1"].trajectory[0].velocity).to.equal(1.4);
        });

        it("should handle multiple agents", () => {
            const geojson = {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        geometry: {type: "Point", coordinates: [9.96, 53.44]},
                        properties: {
                            agentId: "agent-1",
                            time: "2024-12-10T10:00:01",
                            activeCapability: "walking",
                            velocity: 1.4
                        }
                    },
                    {
                        type: "Feature",
                        geometry: {type: "Point", coordinates: [9.97, 53.45]},
                        properties: {
                            agentId: "agent-2",
                            time: "2024-12-10T10:00:01",
                            activeCapability: "cycling",
                            velocity: 4.2
                        }
                    }
                ]
            };

            const result = convertToAgentTrajectoryCollection(geojson);

            expect(Object.keys(result.agents)).to.have.lengthOf(2);
            expect(result.agents["agent-1"]).to.exist;
            expect(result.agents["agent-2"]).to.exist;
            expect(result.agents["agent-1"].trajectory[0].activeCapability).to.equal("walking");
            expect(result.agents["agent-2"].trajectory[0].activeCapability).to.equal("cycling");
        });

        it("should calculate routeMainModalChoice based on most frequent capability", () => {
            const geojson = {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        geometry: {type: "Point", coordinates: [9.96, 53.44]},
                        properties: {agentId: "agent-1", activeCapability: "walking"}
                    },
                    {
                        type: "Feature",
                        geometry: {type: "Point", coordinates: [9.97, 53.45]},
                        properties: {agentId: "agent-1", activeCapability: "cycling"}
                    },
                    {
                        type: "Feature",
                        geometry: {type: "Point", coordinates: [9.98, 53.46]},
                        properties: {agentId: "agent-1", activeCapability: "cycling"}
                    },
                    {
                        type: "Feature",
                        geometry: {type: "Point", coordinates: [9.99, 53.47]},
                        properties: {agentId: "agent-1", activeCapability: "cycling"}
                    }
                ]
            };

            const result = convertToAgentTrajectoryCollection(geojson);

            expect(result.agents["agent-1"].metadata.routeMainModalChoice).to.equal("cycling");
        });

        it("should preserve metadata from original GeoJSON", () => {
            const geojson = {
                type: "FeatureCollection",
                metadata: {
                    simulationId: "sim-123",
                    timestamp: "2024-12-16T10:00:00Z"
                },
                features: [
                    {
                        type: "Feature",
                        geometry: {type: "Point", coordinates: [9.96, 53.44]},
                        properties: {agentId: "agent-1", activeCapability: "walking"}
                    }
                ]
            };

            const result = convertToAgentTrajectoryCollection(geojson);

            expect(result.metadata).to.exist;
            expect(result.metadata.simulationId).to.equal("sim-123");
            expect(result.metadata.timestamp).to.equal("2024-12-16T10:00:00Z");
        });
    });

    describe("convertToGeoJSON", () => {
        it("should throw error for invalid input", () => {
            expect(() => convertToGeoJSON(null)).to.throw("Invalid format");
            expect(() => convertToGeoJSON({})).to.throw("Invalid format");
            expect(() => convertToGeoJSON({type: "FeatureCollection"})).to.throw("Invalid format");
        });

        it("should convert AgentTrajectoryCollection back to GeoJSON", () => {
            const agentCollection = {
                type: "AgentTrajectoryCollection",
                version: "2.0",
                agents: {
                    "agent-1": {
                        agentId: "agent-1",
                        metadata: {
                            gender: "male",
                            startX: 9.96,
                            startY: 53.44,
                            goalX: 9.99,
                            goalY: 53.47,
                            routeMainModalChoice: "walking",
                            routeLength: 1000
                        },
                        trajectory: [
                            {
                                time: "2024-12-10T10:00:01",
                                step: 1,
                                coordinates: [9.96, 53.44],
                                activeCapability: "walking",
                                velocity: 1.4,
                                expectedTravelTime: 100
                            }
                        ]
                    }
                }
            };

            const result = convertToGeoJSON(agentCollection);

            expect(result.type).to.equal("FeatureCollection");
            expect(result.features).to.be.an("array");
            expect(result.features).to.have.lengthOf(1);
            expect(result.features[0].type).to.equal("Feature");
            expect(result.features[0].geometry.type).to.equal("Point");
            expect(result.features[0].geometry.coordinates).to.deep.equal([9.96, 53.44]);
            expect(result.features[0].properties.agentId).to.equal("agent-1");
            expect(result.features[0].properties.activeCapability).to.equal("walking");
            expect(result.features[0].properties.gender).to.equal("male");
        });

        it("should handle hasBike property", () => {
            const agentCollection = {
                type: "AgentTrajectoryCollection",
                version: "2.0",
                agents: {
                    "agent-1": {
                        agentId: "agent-1",
                        metadata: {
                            gender: "male",
                            startX: 9.96,
                            startY: 53.44,
                            goalX: 9.99,
                            goalY: 53.47,
                            routeMainModalChoice: "cycling",
                            routeLength: 1000
                        },
                        trajectory: [
                            {
                                time: "2024-12-10T10:00:01",
                                step: 1,
                                coordinates: [9.96, 53.44],
                                activeCapability: "cyclingRentalBike",
                                velocity: 4.2,
                                expectedTravelTime: 100,
                                hasBike: true
                            }
                        ]
                    }
                }
            };

            const result = convertToGeoJSON(agentCollection);

            expect(result.features[0].properties.hasBike).to.equal(true);
        });

        it("should preserve metadata", () => {
            const agentCollection = {
                type: "AgentTrajectoryCollection",
                version: "2.0",
                metadata: {
                    simulationId: "sim-123"
                },
                agents: {
                    "agent-1": {
                        agentId: "agent-1",
                        metadata: {
                            gender: "male",
                            startX: 9.96,
                            startY: 53.44,
                            goalX: 9.99,
                            goalY: 53.47,
                            routeMainModalChoice: "walking",
                            routeLength: 1000
                        },
                        trajectory: [
                            {
                                time: "2024-12-10T10:00:01",
                                step: 1,
                                coordinates: [9.96, 53.44],
                                activeCapability: "walking",
                                velocity: 1.4,
                                expectedTravelTime: 100
                            }
                        ]
                    }
                }
            };

            const result = convertToGeoJSON(agentCollection);

            expect(result.metadata).to.exist;
            expect(result.metadata.simulationId).to.equal("sim-123");
        });
    });

    describe("getStatistics", () => {
        it("should return null for invalid input", () => {
            expect(getStatistics(null)).to.be.null;
            expect(getStatistics({})).to.be.null;
        });

        it("should calculate statistics correctly", () => {
            const agentCollection = {
                type: "AgentTrajectoryCollection",
                version: "2.0",
                agents: {
                    "agent-1": {
                        agentId: "agent-1",
                        metadata: {
                            routeMainModalChoice: "walking"
                        },
                        trajectory: [{}, {}, {}] // 3 steps
                    },
                    "agent-2": {
                        agentId: "agent-2",
                        metadata: {
                            routeMainModalChoice: "cycling"
                        },
                        trajectory: [{}, {}] // 2 steps
                    },
                    "agent-3": {
                        agentId: "agent-3",
                        metadata: {
                            routeMainModalChoice: "walking"
                        },
                        trajectory: [{}] // 1 step
                    }
                }
            };

            const result = getStatistics(agentCollection);

            expect(result.totalAgents).to.equal(3);
            expect(result.totalSteps).to.equal(6);
            expect(result.averageStepsPerAgent).to.equal(2);
            expect(result.modalChoices).to.deep.equal({
                walking: 2,
                cycling: 1
            });
        });
    });

    describe("Round-trip conversion", () => {
        it("should maintain data integrity in round-trip conversion", () => {
            const originalGeoJSON = {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        geometry: {type: "Point", coordinates: [9.96, 53.44]},
                        properties: {
                            agentId: "agent-1",
                            time: "2024-12-10T10:00:01",
                            step: 1,
                            activeCapability: "walking",
                            velocity: 1.4,
                            expectedTravelTime: 100,
                            gender: "male"
                        }
                    },
                    {
                        type: "Feature",
                        geometry: {type: "Point", coordinates: [9.97, 53.45]},
                        properties: {
                            agentId: "agent-1",
                            time: "2024-12-10T10:00:02",
                            step: 2,
                            activeCapability: "walking",
                            velocity: 1.4,
                            expectedTravelTime: 90,
                            gender: "male"
                        }
                    }
                ]
            };

            const compactFormat = convertToAgentTrajectoryCollection(originalGeoJSON);
            const reconstructedGeoJSON = convertToGeoJSON(compactFormat);

            expect(reconstructedGeoJSON.type).to.equal("FeatureCollection");
            expect(reconstructedGeoJSON.features).to.have.lengthOf(2);
            expect(reconstructedGeoJSON.features[0].properties.agentId).to.equal("agent-1");
            expect(reconstructedGeoJSON.features[0].properties.step).to.equal(1);
            expect(reconstructedGeoJSON.features[1].properties.step).to.equal(2);
            expect(reconstructedGeoJSON.features[0].geometry.coordinates).to.deep.equal([9.96, 53.44]);
            expect(reconstructedGeoJSON.features[1].geometry.coordinates).to.deep.equal([9.97, 53.45]);
        });
    });
});
