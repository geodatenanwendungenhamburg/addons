// ============================================================================
// GREEN4BIKES API - LARGER SIMULATION TEST
// ============================================================================
// Größere Distanz innerhalb Hamburg mit 5 Radstationen
// Von HafenCity (Ost) nach Altona (West) - ca. 6km
// ============================================================================

(function () {
    const token = document.cookie
            .split("; ")
            .find((row) => row.startsWith("token="))
            .split("=")[1];

    console.log("🚴 Larger Hamburg Simulation Test - Token:", token.substring(0, 20) + "...");

    /**
     * Poll job status until completion
     * @param {string} jobId - The job ID to poll
     * @param {number} interval - Polling interval in milliseconds
     */
    function pollJobStatus (jobId, interval = 2000) {
        const checkStatus = () => {
            fetch(
                `https://ump-lgv.germanywestcentral.cloudapp.azure.com/api/jobs/${jobId}`,
                {
                    headers: {Authorization: `Bearer ${token}`}
                }
            )
                .then((r) => r.json())
                .then((d) => {
                    console.log(`Status: ${d.status} | Updated: ${d.updated}`);
                    if (d.status === "successful") {
                        console.log("✅ Job completed!");
                        console.log("Results:", d.links[0].href);
                        // Fetch results
                        if (d.links && d.links[0]) {
                            fetch(d.links[0].href, {
                                headers: {Authorization: `Bearer ${token}`}
                            })
                                .then((r) => r.json())
                                .then((results) => {
                                    console.log("📊 Results:", results);
                                    
                                    // Download results as GeoJSON file
                                    const blob = new Blob([JSON.stringify(results, null, 2)], {
                                            type: "application/json"
                                        }),
                                        url = URL.createObjectURL(blob),
                                        a = document.createElement("a"),
                                        timestamp = new Date().toISOString().replace(/[:.]/g, "-");

                                    a.href = url;
                                    a.download = `green4bikes-results-larger-${timestamp}.geojson`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                    console.log("💾 Results downloaded as GeoJSON file!");
                                });
                        }
                    }
                    else if (d.status === "failed") {
                        console.error("❌ Failed:", d.message);
                        console.error("📋 Full Job Details:", d);
                        // Check if there are any error logs or exceptions
                        if (d.exception) {
                            console.error("🔥 Exception:", d.exception);
                        }
                        if (d.logs) {
                            console.error("📝 Logs:", d.logs);
                        }
                    }
                    else if (d.status === "running") {
                        console.log("⏳ Still running...");
                        setTimeout(checkStatus, interval);
                    }
                });
        };

        checkStatus();
    }

    fetch(
        "https://ump-lgv.germanywestcentral.cloudapp.azure.com/api/processes/mars:sim-green4Bikes-default/execution",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                inputs: {
                    startPoint: "2024-12-01T06:45:00",
                    endPoint: "2024-12-01T07:15:00",
                    cycleTravelerSource: {
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: [9.9878, 53.5828]
                        },
                        properties: {
                            spawningAmount: "50"
                        }
                    },
                    cycleTravelerTarget: {
                        type: "Point",
                        coordinates: [9.9833, 53.5536]
                    },
                    rentalStations: {
                        type: "FeatureCollection",
                        features: [
                            {
                                type: "Feature",
                                geometry: {
                                    type: "Point",
                                    coordinates: [9.9803, 53.5708]
                                },
                                properties: {
                                    anzahl_raeder: 10
                                }
                            },
                            {
                                type: "Feature",
                                geometry: {
                                    type: "Point",
                                    coordinates: [9.9933, 53.5775]
                                },
                                properties: {
                                    anzahl_raeder: 10
                                }
                            },
                            {
                                type: "Feature",
                                geometry: {
                                    type: "Point",
                                    coordinates: [9.9878, 53.5558]
                                },
                                properties: {
                                    anzahl_raeder: 10
                                }
                            },
                            {
                                type: "Feature",
                                geometry: {
                                    type: "Point",
                                    coordinates: [9.9781, 53.5608]
                                },
                                properties: {
                                    anzahl_raeder: 10
                                }
                            },
                            {
                                type: "Feature",
                                geometry: {
                                    type: "Point",
                                    coordinates: [9.9872, 53.5811]
                                },
                                properties: {
                                    anzahl_raeder: 10
                                }
                            }
                        ]
                    }
                },
                outputs: {
                    agents: {}
                },
                jobIdentifier: "bikesLarger_" + Date.now()
            })
        }
    )
        .then((r) => r.json())
        .then((d) => {
            console.log("📤 Initial Response:", d);
            if (d.jobID) {
                console.log("✅ Job started! ID:", d.jobID);
                console.log("🚴 Agents: 50");
                console.log("🚲 Rental Stations: 5");
                pollJobStatus(d.jobID);
            }
            else {
                console.error("❌ Failed to start job:", d.detail || d);
            }
        })
        .catch((e) => console.error("❌ Request Error:", e));
})();
