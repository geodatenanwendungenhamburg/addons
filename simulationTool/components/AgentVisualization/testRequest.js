// ============================================================================
// GREEN4BIKES API TEST SUITE
// ============================================================================
// API: https://ump-lgv.germanywestcentral.cloudapp.azure.com/api/processes/mars:sim-green4Bikes-default
//
// WICHTIGE ERKENNTNISSE (Stand: Dezember 2025):
// ✅ cycleTravelerLayer: GeoJSON FeatureCollection mit LineString (source→target)
// ✅ rentalStations: GeoJSON FeatureCollection (Objekt, NICHT stringified)
// ✅ roadNetwork: GeoJSON FeatureCollection (Objekt, NICHT stringified)
// ❌ rentalBicycle: Flat Object funktioniert NICHT - Backend-Problem
// ❌ LineString Format: Job wird erstellt, schlägt aber sofort fehl ("simulation created")
// ⚠️ Mindestdauer: 30 Minuten (kürzere Simulationen werden abgelehnt)
// ⚠️ Timeout: 30 Minuten ab Job-Erstellung (inkl. ~23min Queue-Zeit)
// ⚠️ AKTUELLES PROBLEM: Server akzeptiert cycleTravelerLayer als FeatureCollection,
//    aber Simulation schlägt mit "simulation created" fehl. Keine Exception/Logs.
//    Vermutlich erwartet Server ein anderes Format oder zwei separate Features.
// ============================================================================

// Token aus Cookie holen
const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    .split("=")[1];

console.log("Current token:", token);

// Polling-Funktion für Job-Status
/**
 * Polls the job status until it's completed or failed
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
                    console.log("✅ Job completed successfully!");
                    console.log("Results link:", d.links[0].href);

                    // Ergebnisse abrufen
                    fetch(d.links[0].href, {
                        headers: {Authorization: `Bearer ${token}`}
                    })
                        .then((r) => r.json())
                        .then((results) => console.log("Results:", results));
                }
                else if (d.status === "failed") {
                    console.error("❌ Job failed:", d.message);
                    console.error("Full details:", d);
                }
                else if (d.status === "running") {
                    console.log("⏳ Still running...");
                    setTimeout(checkStatus, interval);
                }
            });
    };

    checkStatus();
}

// ============================================================================
// 1. PROZESS-BESCHREIBUNG ABRUFEN
// ============================================================================
// Lädt die OpenAPI-Schema-Beschreibung und zeigt required inputs

fetch(
    "https://ump-lgv.germanywestcentral.cloudapp.azure.com/api/processes/mars:sim-green4Bikes-default",
    {
        headers: {Authorization: `Bearer ${token}`}
    }
)
    .then((r) => r.json())
    .then((d) => {
        console.log("Process Description:", d);
        console.log("\nInputs:", d.inputs);
        const requiredInputs = Object.entries(d.inputs || {})
            .filter(([, v]) => v.minOccurs === 1)
            .map(([k]) => k);

        console.log("\nRequired inputs:", requiredInputs);

        // Download als JSON-Datei
        const blob = new Blob([JSON.stringify(d, null, 2)], {
                type: "application/json"
            }),
            url = URL.createObjectURL(blob),
            a = document.createElement("a");

        a.href = url;
        a.download = "process-description-green4bikes.json";
        a.click();
        URL.revokeObjectURL(url);
        console.log("✅ Process description downloaded!");
    });

// ============================================================================
// 2. JOB-STATUS ABFRAGEN
// ============================================================================
// Job-ID hier einfügen

const jobId = "job-job-sim-green4Bikes-default-XXX-YYY";

fetch(
    `https://ump-lgv.germanywestcentral.cloudapp.azure.com/api/jobs/${jobId}`,
    {
        headers: {Authorization: `Bearer ${token}`}
    }
)
    .then((r) => r.json())
    .then((d) => console.log("Job Status:", d));

// ============================================================================
// 3. FUNKTIONIERENDE REQUEST - GeoJSON FeatureCollection für cycleTravelerLayer
// ============================================================================
// ✅ AKTUELLES FORMAT (Dezember 2025) - GeoJSON FeatureCollection
// Format: LineString von Startbereich-Zentroid zu Zielbereich-Zentroid
// Properties: spawningAmount, spawningIntervalInMinutes, startTime, endTime, etc.

// --- TEST A: Backend Developer Format (Source + Target Points) ---
(function () {
    const token = document.cookie
            .split("; ")
            .find((row) => row.startsWith("token="))
            .split("=")[1];

    console.log("✅ Backend Developer Format Test (Source + Target) - Token:", token.substring(0, 20) + "...");

    /**
   *
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
                                    a.download = `green4bikes-results-${timestamp}.geojson`;
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
                            coordinates: [9.9870202019994, 53.45638324750834]
                        },
                        properties: {
                            spawningAmount: "10"
                        }
                    },
                    cycleTravelerTarget: {
                        type: "Point",
                        coordinates: [9.990653573687837, 53.45226506110822]
                    },
                    rentalStations: {
                        type: "FeatureCollection",
                        features: [
                            {
                                type: "Feature",
                                geometry: {
                                    type: "Point",
                                    coordinates: [9.9871454906785, 53.455443261874166]
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
                jobIdentifier: "bikesSingle_" + Date.now()
            })
        }
    )
        .then((r) => r.json())
        .then((d) => {
            console.log("📤 Initial Response:", d);
            if (d.jobID) {
                console.log("✅ Job started! ID:", d.jobID);
                pollJobStatus(d.jobID);
            }
            else {
                console.error("❌ Failed to start job:", d.detail || d);
            }
        })
        .catch((e) => console.error("❌ Request Error:", e));
})();

// ============================================================================
// 4. ALTE/FEHLERHAFTE TESTS (nur zur Dokumentation)
// ============================================================================

// --- VERALTETER TEST - Falsches Property-Format ---
// Problem: Alte Property-Namen (startTime/endTime statt ISO-Format)
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
                startPoint: "2024-12-01T07:00:00",
                endPoint: "2024-12-01T07:05:00",
                steps: 300, // 5 Minuten = 300 Sekunden
                cycleTravelerLayer: {
                    type: "FeatureCollection",
                    features: [
                        {
                            type: "Feature",
                            geometry: {
                                type: "LineString",
                                coordinates: [
                                    [9.9870202, 53.4563832], // Start
                                    [9.9906536, 53.4522651] // Ziel
                                ]
                            },
                            properties: {
                                // VERALTET - Neue Version verwendet ISO 8601 Format
                                spawningAmount: 50,
                                spawningIntervalInMinutes: 20,
                                startTime: "01.01.0001T07:00",
                                endTime: "01.01.0001T14:00",
                                gender: "male",
                                mass: 80,
                                hasOwnBikeProbability: 0,
                                gradient: null
                            }
                        }
                    ]
                },
                rentalStations: {
                    type: "FeatureCollection",
                    features: [
                        {
                            type: "Feature",
                            geometry: {
                                type: "Point",
                                coordinates: [9.9871455, 53.4554433]
                            },
                            properties: {
                                anzahl_raeder: 10
                            }
                        }
                    ]
                },
                roadNetwork: {
                    type: "FeatureCollection",
                    features: [
                        {
                            type: "Feature",
                            geometry: {
                                type: "LineString",
                                coordinates: [
                                    [9.9870202, 53.4563832],
                                    [9.9871455, 53.4554433],
                                    [9.9906536, 53.4522651]
                                ]
                            },
                            properties: {
                                lanes: 2
                            }
                        }
                    ]
                },
                rentalBicycle: {
                    type: "standard",
                    maxSpeed: 25,
                    maxAcceleration: 2.0,
                    maxDeceleration: 3.0,
                    length: 1.8,
                    width: 0.6,
                    height: 1.1
                },
                config: {}
            },
            outputs: {
                agents: {}
            },
            jobIdentifier: "bikesTest"
        })
    }
)
    .then((r) => r.json())
    .then((d) => {
        console.log("Success:", d);
        if (d.jobID) {
            console.log("Job started! ID:", d.jobID);
            console.log("Status:", d.status);

            // Automatisch Polling starten
            if (d.status === "failed") {
                console.error(
                    "❌ Job failed immediately! Check the full status for details."
                );
            }
            pollJobStatus(d.jobID);
        }
    })
    .catch((e) => console.error("Error:", e));

// ============================================================================
// 5. EXPERIMENTELLE TESTS (FEHLGESCHLAGEN)
// ============================================================================

// --- TEST: CSV als File Reference (Base64) ---
// Ergebnis: ❌ Fehlgeschlagen - Backend erkennt Format nicht
(function () {
    const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        .split("=")[1];

    console.log("CSV File Format Test - Token:", token.substring(0, 20) + "...");

    /**
   *
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
                    console.log(
                        `CSV File Test Status: ${d.status} | Updated: ${d.updated}`
                    );

                    if (d.status === "successful") {
                        console.log("✅ CSV File Test Job completed successfully!");
                        console.log("Results link:", d.links[0].href);

                        fetch(d.links[0].href, {
                            headers: {Authorization: `Bearer ${token}`}
                        })
                            .then((r) => r.json())
                            .then((results) => console.log("CSV File Test Results:", results)
                            );
                    }
                    else if (d.status === "failed") {
                        console.error("❌ CSV File Test Job failed:", d.message);
                        console.error("Full details:", d);
                    }
                    else if (d.status === "running") {
                        console.log("⏳ CSV File Test still running...");
                        setTimeout(checkStatus, interval);
                    }
                })
                .catch((err) => {
                    console.error("Error fetching status:", err);
                });
        };

        checkStatus();
    }

    // Try wrapping CSV in a file-like structure
    const csvData = {
        file:
      "data:text/csv;base64," +
      btoa(
          "startTime,endTime,spawningIntervalInMinutes,spawningAmount,gender,mass,perceptionInMeter,hasOwnBikeProbability,source,destination\n07:00,07:30,10,1,male,75,1.0,0.5,\"POINT(9.9870202 53.4563832)\",\"POINT(9.9906536 53.4522651)\""
      )
    };

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
                    startPoint: "2025-12-05T07:00:00",
                    endPoint: "2025-12-05T07:30:00",
                    steps: 1800,
                    cycleTravelerLayer: csvData,
                    rentalStations: {
                        type: "FeatureCollection",
                        features: [
                            {
                                type: "Feature",
                                geometry: {
                                    type: "Point",
                                    coordinates: [9.9871455, 53.4554433]
                                },
                                properties: {
                                    amount_bicycles: 10
                                }
                            }
                        ]
                    },
                    roadNetwork: {
                        type: "FeatureCollection",
                        features: [
                            {
                                type: "Feature",
                                geometry: {
                                    type: "LineString",
                                    coordinates: [
                                        [9.9870202, 53.4563832],
                                        [9.9871455, 53.4554433],
                                        [9.9906536, 53.4522651]
                                    ]
                                },
                                properties: {
                                    lanes: 2
                                }
                            }
                        ]
                    },
                    rentalBicycle: {
                        type: "standard",
                        maxSpeed: 25,
                        maxAcceleration: 2.0,
                        maxDeceleration: 3.0,
                        length: 1.8,
                        width: 0.6,
                        height: 1.1
                    },
                    config: {}
                },
                outputs: {
                    agents: {}
                },
                jobIdentifier: "csvFileTest_" + Date.now()
            })
        }
    )
        .then((r) => r.json())
        .then((d) => {
            console.log("CSV File Test Response:", d);
            if (d.jobID) {
                console.log("CSV File Test Job started! ID:", d.jobID);
                console.log("Status:", d.status);
                pollJobStatus(d.jobID);
            }
            else if (d.status === 500) {
                console.error("CSV File Test Server Error:", d.detail);
            }
        })
        .catch((e) => console.error("CSV File Test Error:", e));
})();

// --- TEST: CSV mit Content-Wrapper ---
// Ergebnis: ❌ HTTP 500 - DomainDataImporter erwartet kein Content-Property
(function () {
    const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        .split("=")[1];

    console.log(
        "CSV Content Wrapper Test - Token:",
        token.substring(0, 20) + "..."
    );

    /**
   *
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
                    console.log(
                        `Content Wrapper Test Status: ${d.status} | Updated: ${d.updated}`
                    );

                    if (d.status === "successful") {
                        console.log("✅ Content Wrapper Test Job completed!");
                        console.log("Results link:", d.links[0].href);

                        fetch(d.links[0].href, {
                            headers: {Authorization: `Bearer ${token}`}
                        })
                            .then((r) => r.json())
                            .then((results) => console.log("Content Wrapper Results:", results)
                            );
                    }
                    else if (d.status === "failed") {
                        console.error("❌ Content Wrapper Test Job failed:", d.message);
                        console.error("Full details:", d);
                    }
                    else if (d.status === "running") {
                        console.log("⏳ Content Wrapper Test still running...");
                        setTimeout(checkStatus, interval);
                    }
                })
                .catch((err) => console.error("Error fetching status:", err));
        };

        checkStatus();
    }

    // Try with content property
    const csvDataWrapped = {
        content:
      "startTime,endTime,spawningIntervalInMinutes,spawningAmount,gender,mass,perceptionInMeter,hasOwnBikeProbability,source,destination\n07:00,07:30,10,1,male,75,1.0,0.5,\"POINT(9.9870202 53.4563832)\",\"POINT(9.9906536 53.4522651)\""
    };

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
                    startPoint: "2025-12-05T07:00:00",
                    endPoint: "2025-12-05T07:30:00",
                    steps: 1800,
                    cycleTravelerLayer: csvDataWrapped,
                    rentalStations: {
                        type: "FeatureCollection",
                        features: [
                            {
                                type: "Feature",
                                geometry: {
                                    type: "Point",
                                    coordinates: [9.9871455, 53.4554433]
                                },
                                properties: {
                                    amount_bicycles: 10
                                }
                            }
                        ]
                    },
                    roadNetwork: {
                        type: "FeatureCollection",
                        features: [
                            {
                                type: "Feature",
                                geometry: {
                                    type: "LineString",
                                    coordinates: [
                                        [9.9870202, 53.4563832],
                                        [9.9871455, 53.4554433],
                                        [9.9906536, 53.4522651]
                                    ]
                                },
                                properties: {
                                    lanes: 2
                                }
                            }
                        ]
                    },
                    rentalBicycle: {
                        type: "standard",
                        maxSpeed: 25,
                        maxAcceleration: 2.0,
                        maxDeceleration: 3.0,
                        length: 1.8,
                        width: 0.6,
                        height: 1.1
                    },
                    config: {}
                },
                outputs: {
                    agents: {}
                },
                jobIdentifier: "csvContentTest_" + Date.now()
            })
        }
    )
        .then((r) => r.json())
        .then((d) => {
            console.log("Content Wrapper Test Response:", d);
            if (d.jobID) {
                console.log("Content Wrapper Test Job started! ID:", d.jobID);
                console.log("Status:", d.status);
                pollJobStatus(d.jobID);
            }
            else if (d.status === 500) {
                console.error("Content Wrapper Test Server Error:", d.detail);
            }
        })
        .catch((e) => console.error("Content Wrapper Test Error:", e));
})();

// --- TEST: 2-Minuten Simulation (zu kurz) ---
// Ergebnis: ❌ Validation Error - Minimum 30 Minuten erforderlich
(function () {
    const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        .split("=")[1];

    console.log(
        "🚀 Ultra-Short Test (2min) - Token:",
        token.substring(0, 20) + "..."
    );

    /**
   *
   */
    function pollJobStatus (jobId, interval = 2000, maxPolls = 180) {
        let pollCount = 0;
        const checkStatus = () => {
            pollCount++;
            if (pollCount > maxPolls) {
                console.error(
                    "⏱️ Polling timeout after",
                    (maxPolls * interval) / 1000,
                    "seconds"
                );
                return;
            }

            fetch(
                `https://ump-lgv.germanywestcentral.cloudapp.azure.com/api/jobs/${jobId}`,
                {
                    headers: {Authorization: `Bearer ${token}`}
                }
            )
                .then((r) => r.json())
                .then((d) => {
                    const elapsed = Math.floor((pollCount * interval) / 1000);

                    console.log(
                        `[${elapsed}s] Ultra-Short Test: ${d.status} | ${d.updated}`
                    );

                    if (d.status === "successful") {
                        console.log("✅✅✅ SUCCESS! Ultra-Short Test Job completed!");
                        console.log("Results link:", d.links[0].href);

                        fetch(d.links[0].href, {
                            headers: {Authorization: `Bearer ${token}`}
                        })
                            .then((r) => r.json())
                            .then((results) => {
                                console.log("📊 Ultra-Short Test Results:", results);
                                console.log(
                                    "🎉 This proves the API works for short simulations!"
                                );
                            });
                    }
                    else if (d.status === "failed") {
                        console.error("❌ Ultra-Short Test Job failed:", d.message);
                        console.error("Full details:", d);
                    }
                    else if (d.status === "running") {
                        console.log(`⏳ Still running (${elapsed}s)...`);
                        setTimeout(checkStatus, interval);
                    }
                })
                .catch((err) => {
                    console.error("Error fetching status:", err);
                    console.log("Retrying in", interval / 1000, "seconds...");
                    setTimeout(checkStatus, interval);
                });
        };

        checkStatus();
    }

    // Ultra-short CSV: only 2 minutes, 1 agent
    const csvData =
    "startTime,endTime,spawningIntervalInMinutes,spawningAmount,gender,mass,perceptionInMeter,hasOwnBikeProbability,source,destination\n" +
    "07:00,07:02,1,1,male,75,1.0,0.5,\"POINT(9.9870202 53.4563832)\",\"POINT(9.9906536 53.4522651)\"";

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
                    startPoint: "2025-12-05T07:00:00",
                    endPoint: "2025-12-05T07:02:00",
                    steps: 120, // 2 minutes = 120 seconds
                    cycleTravelerLayer: csvData,
                    rentalStations: {
                        type: "FeatureCollection",
                        features: [
                            {
                                type: "Feature",
                                geometry: {
                                    type: "Point",
                                    coordinates: [9.9871455, 53.4554433]
                                },
                                properties: {
                                    amount_bicycles: 10
                                }
                            }
                        ]
                    },
                    roadNetwork: {
                        type: "FeatureCollection",
                        features: [
                            {
                                type: "Feature",
                                geometry: {
                                    type: "LineString",
                                    coordinates: [
                                        [9.9870202, 53.4563832],
                                        [9.9871455, 53.4554433],
                                        [9.9906536, 53.4522651]
                                    ]
                                },
                                properties: {
                                    lanes: 2
                                }
                            }
                        ]
                    },
                    rentalBicycle: {
                        type: "standard",
                        maxSpeed: 25,
                        maxAcceleration: 2.0,
                        maxDeceleration: 3.0,
                        length: 1.8,
                        width: 0.6,
                        height: 1.1
                    },
                    config: {}
                },
                outputs: {
                    agents: {}
                },
                jobIdentifier: "ultraShortTest_" + Date.now()
            })
        }
    )
        .then((r) => r.json())
        .then((d) => {
            console.log("Ultra-Short Test Response:", d);
            if (d.jobID) {
                console.log("🚀 Ultra-Short Test Job started! ID:", d.jobID);
                console.log("Status:", d.status);
                pollJobStatus(d.jobID);
            }
            else if (d.status === 500) {
                console.error("Ultra-Short Test Server Error:", d.detail);
            }
        })
        .catch((e) => console.error("Ultra-Short Test Error:", e));
})();

// --- TEST: 2 Minuten mit vielen Steps ---
// Ergebnis: ❌ Validation Error - Duration < 30min nicht erlaubt
(function () {
    const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        .split("=")[1];

    console.log(
        "🧪 2min High-Steps Test - Token:",
        token.substring(0, 20) + "..."
    );

    // 2 minutes but with same step density as 30min test: 1800 steps / 30 min = 60 steps/min
    // So 2 min = 120 steps
    const csvData =
    "startTime,endTime,spawningIntervalInMinutes,spawningAmount,gender,mass,perceptionInMeter,hasOwnBikeProbability,source,destination\n" +
    "07:00,07:02,1,1,male,75,1.0,0.5,\"POINT(9.9870202 53.4563832)\",\"POINT(9.9906536 53.4522651)\"";

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
                    startPoint: "2025-12-05T07:00:00",
                    endPoint: "2025-12-05T07:02:00",
                    steps: 1800, // MANY steps for short duration - testing minimum
                    cycleTravelerLayer: csvData,
                    rentalStations: {
                        type: "FeatureCollection",
                        features: [
                            {
                                type: "Feature",
                                geometry: {
                                    type: "Point",
                                    coordinates: [9.9871455, 53.4554433]
                                },
                                properties: {
                                    amount_bicycles: 10
                                }
                            }
                        ]
                    },
                    roadNetwork: {
                        type: "FeatureCollection",
                        features: [
                            {
                                type: "Feature",
                                geometry: {
                                    type: "LineString",
                                    coordinates: [
                                        [9.9870202, 53.4563832],
                                        [9.9871455, 53.4554433],
                                        [9.9906536, 53.4522651]
                                    ]
                                },
                                properties: {
                                    lanes: 2
                                }
                            }
                        ]
                    },
                    rentalBicycle: {
                        type: "standard",
                        maxSpeed: 25,
                        maxAcceleration: 2.0,
                        maxDeceleration: 3.0,
                        length: 1.8,
                        width: 0.6,
                        height: 1.1
                    },
                    config: {}
                },
                outputs: {
                    agents: {}
                },
                jobIdentifier: "highSteps2min_" + Date.now()
            })
        }
    )
        .then((r) => r.json())
        .then((d) => {
            console.log("🧪 High-Steps Test Response:", d);
            if (d.jobID) {
                console.log("✅ High-Steps Test Job started! ID:", d.jobID);
            }
            else {
                console.error("❌ High-Steps Test failed:", d.detail);
            }
        });
})();

// --- TEST: rentalBicycle = null ---
// Ergebnis: ❌ Required parameter missing
(function () {
    const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        .split("=")[1];

    console.log(
        "🔧 RentalBicycle NULL Test - Token:",
        token.substring(0, 20) + "..."
    );

    const csvData =
    "startTime,endTime,spawningIntervalInMinutes,spawningAmount,gender,mass,perceptionInMeter,hasOwnBikeProbability,source,destination\n" +
    "07:00,07:30,10,1,male,75,1.0,0.5,\"POINT(9.9870202 53.4563832)\",\"POINT(9.9906536 53.4522651)\"";

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
                    startPoint: "2025-12-05T07:00:00",
                    endPoint: "2025-12-05T07:30:00",
                    steps: 1800,
                    cycleTravelerLayer: csvData,
                    rentalStations: {
                        type: "FeatureCollection",
                        features: [
                            {
                                type: "Feature",
                                geometry: {
                                    type: "Point",
                                    coordinates: [9.9871455, 53.4554433]
                                },
                                properties: {
                                    amount_bicycles: 10
                                }
                            }
                        ]
                    },
                    roadNetwork: {
                        type: "FeatureCollection",
                        features: [
                            {
                                type: "Feature",
                                geometry: {
                                    type: "LineString",
                                    coordinates: [
                                        [9.9870202, 53.4563832],
                                        [9.9871455, 53.4554433],
                                        [9.9906536, 53.4522651]
                                    ]
                                },
                                properties: {
                                    lanes: 2
                                }
                            }
                        ]
                    },
                    rentalBicycle: null, // TEST: Try with null
                    config: {}
                },
                outputs: {
                    agents: {}
                },
                jobIdentifier: "rentalBikeNull_" + Date.now()
            })
        }
    )
        .then((r) => r.json())
        .then((d) => {
            console.log("🔧 RentalBicycle NULL Test Response:", d);
            if (d.jobID) {
                console.log("✅ Job started with rentalBicycle=null! ID:", d.jobID);
            }
            else {
            }
        });
})();

// --- TEST: Alle Inputs als JSON-Strings ---
// Ergebnis: ❌ API-Middleware deserialisiert JSON-Strings zurück zu Objekten
(function () {
    const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        .split("=")[1];

    console.log(
        "📁 File Reference Test - Token:",
        token.substring(0, 20) + "..."
    );

    // Try CSV data as inline content
    const csvData =
      "startTime,endTime,spawningIntervalInMinutes,spawningAmount,gender,mass,perceptionInMeter,hasOwnBikeProbability,source,destination\n" +
      "07:00,07:30,10,1,male,75,1.0,0.5,\"POINT(9.9870202 53.4563832)\",\"POINT(9.9906536 53.4522651)\"",
        // Rental stations as GeoJSON string
        rentalStationsGeoJSON = JSON.stringify({
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [9.9871455, 53.4554433]
                    },
                    properties: {
                        amount_bicycles: 10
                    }
                }
            ]
        }),
        // Road network as GeoJSON string
        roadNetworkGeoJSON = JSON.stringify({
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: [
                            [9.9870202, 53.4563832],
                            [9.9871455, 53.4554433],
                            [9.9906536, 53.4522651]
                        ]
                    },
                    properties: {
                        lanes: 2
                    }
                }
            ]
        }),
        // Rental bicycle config as JSON string
        rentalBicycleJSON = JSON.stringify({
            type: "standard",
            maxSpeed: 25,
            maxAcceleration: 2.0,
            maxDeceleration: 3.0,
            length: 1.8,
            width: 0.6,
            height: 1.1
        });

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
                    startPoint: "2025-12-05T07:00:00",
                    endPoint: "2025-12-05T07:30:00",
                    steps: 1800,
                    cycleTravelerLayer: csvData, // Plain CSV string (works)
                    rentalStations: rentalStationsGeoJSON, // GeoJSON as string
                    roadNetwork: roadNetworkGeoJSON, // GeoJSON as string
                    rentalBicycle: rentalBicycleJSON, // JSON as string
                    config: {}
                },
                outputs: {
                    agents: {}
                },
                jobIdentifier: "allStrings_" + Date.now()
            })
        }
    )
        .then((r) => r.json())
        .then((d) => {
            console.log("📁 File Reference Test Response:", d);
            if (d.jobID) {
                console.log("✅ Job started with string formats! ID:", d.jobID);
                console.log("Status:", d.status);
            }
            else {
                console.error("❌ Failed:", d.detail);
            }
        });
})();

// --- TEST: Nested Config für rentalBicycle ---
// Ergebnis: ❌ DomainDataImporter-Fehler bei Dictionary ohne Content
(function () {
    const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        .split("=")[1];

    console.log("🔬 Mixed Format Test - Token:", token.substring(0, 20) + "...");

    const csvData =
    "startTime,endTime,spawningIntervalInMinutes,spawningAmount,gender,mass,perceptionInMeter,hasOwnBikeProbability,source,destination\n" +
    "07:00,07:30,10,1,male,75,1.0,0.5,\"POINT(9.9870202 53.4563832)\",\"POINT(9.9906536 53.4522651)\"";

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
                    startPoint: "2025-12-05T07:00:00",
                    endPoint: "2025-12-05T07:30:00",
                    steps: 1800,
                    cycleTravelerLayer: csvData, // CSV string (known to work)
                    rentalStations: {
                        // Keep as GeoJSON object
                        type: "FeatureCollection",
                        features: [
                            {
                                type: "Feature",
                                geometry: {
                                    type: "Point",
                                    coordinates: [9.9871455, 53.4554433]
                                },
                                properties: {
                                    amount_bicycles: 10
                                }
                            }
                        ]
                    },
                    roadNetwork: {
                        // Keep as GeoJSON object
                        type: "FeatureCollection",
                        features: [
                            {
                                type: "Feature",
                                geometry: {
                                    type: "LineString",
                                    coordinates: [
                                        [9.9870202, 53.4563832],
                                        [9.9871455, 53.4554433],
                                        [9.9906536, 53.4522651]
                                    ]
                                },
                                properties: {
                                    lanes: 2
                                }
                            }
                        ]
                    },
                    rentalBicycle: {
                        // Try nested config structure
                        config: {
                            type: "standard",
                            maxSpeed: 25,
                            maxAcceleration: 2.0,
                            maxDeceleration: 3.0,
                            length: 1.8,
                            width: 0.6,
                            height: 1.1
                        }
                    },
                    config: {}
                },
                outputs: {
                    agents: {}
                },
                jobIdentifier: "mixedNested_" + Date.now()
            })
        }
    )
        .then((r) => r.json())
        .then((d) => {
            console.log("🔬 Mixed Nested Response:", d);
            if (d.jobID) {
                console.log("✅ Job started! ID:", d.jobID);
            }
            else {
                console.error("❌ Failed:", d.detail);
            }
        });
})();

// --- TEST: rentalBicycle mit Content-Wrapper ---
// Ergebnis: ❌ HTTP 500 - Falsches Format
(function () {
    const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        .split("=")[1];

    console.log(
        "📦 Content Wrapper Test - Token:",
        token.substring(0, 20) + "..."
    );

    const csvData =
    "startTime,endTime,spawningIntervalInMinutes,spawningAmount,gender,mass,perceptionInMeter,hasOwnBikeProbability,source,destination\n" +
    "07:00,07:30,10,1,male,75,1.0,0.5,\"POINT(9.9870202 53.4563832)\",\"POINT(9.9906536 53.4522651)\"";

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
                    startPoint: "2025-12-05T07:00:00",
                    endPoint: "2025-12-05T07:30:00",
                    steps: 1800,
                    cycleTravelerLayer: csvData,
                    rentalStations: {
                        type: "FeatureCollection",
                        features: [
                            {
                                type: "Feature",
                                geometry: {
                                    type: "Point",
                                    coordinates: [9.9871455, 53.4554433]
                                },
                                properties: {
                                    amount_bicycles: 10
                                }
                            }
                        ]
                    },
                    roadNetwork: {
                        type: "FeatureCollection",
                        features: [
                            {
                                type: "Feature",
                                geometry: {
                                    type: "LineString",
                                    coordinates: [
                                        [9.9870202, 53.4563832],
                                        [9.9871455, 53.4554433],
                                        [9.9906536, 53.4522651]
                                    ]
                                },
                                properties: {
                                    lanes: 2
                                }
                            }
                        ]
                    },
                    rentalBicycle: {
                        content: JSON.stringify({
                            type: "standard",
                            maxSpeed: 25,
                            maxAcceleration: 2.0,
                            maxDeceleration: 3.0,
                            length: 1.8,
                            width: 0.6,
                            height: 1.1
                        })
                    },
                    config: {}
                },
                outputs: {
                    agents: {}
                },
                jobIdentifier: "contentWrapper_" + Date.now()
            })
        }
    )
        .then((r) => r.json())
        .then((d) => {
            console.log("📦 Content Wrapper Response:", d);
            if (d.jobID) {
                console.log("✅ Job started! ID:", d.jobID);
            }
            else {
                console.error("❌ Failed:", d.detail);
            }
        });
})();

// --- TEST: rentalBicycle als JSON-String ---
// Ergebnis: ❌ HTTP 500 - API deserialisiert String zu Dictionary, dann DomainDataImporter-Fehler
(function () {
    const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        .split("=")[1];

    console.log(
        "🚲 RentalBicycle JSON String Test - Token:",
        token.substring(0, 20) + "..."
    );

    /**
   *
   */
    function pollJobStatus (jobId, interval = 2000, maxPolls = 180) {
        let pollCount = 0;
        const checkStatus = () => {
            pollCount++;
            if (pollCount > maxPolls) {
                console.error(
                    "⏱️ Polling timeout after",
                    (maxPolls * interval) / 1000,
                    "seconds"
                );
                return;
            }

            fetch(
                `https://ump-lgv.germanywestcentral.cloudapp.azure.com/api/jobs/${jobId}`,
                {
                    headers: {Authorization: `Bearer ${token}`}
                }
            )
                .then((r) => r.json())
                .then((d) => {
                    const elapsed = Math.floor((pollCount * interval) / 1000);

                    console.log(
                        `[${elapsed}s] JSON String Test: ${d.status} | ${
                            d.updated || "no update"
                        }`
                    );

                    if (d.status === "successful") {
                        console.log("✅✅✅ SUCCESS! RentalBicycle JSON String works!");
                        console.log("Results link:", d.links[0].href);
                    }
                    else if (d.status === "failed") {
                        console.error("❌ JSON String Test Job failed:", d.message);
                        console.error("Full details:", d);
                    }
                    else if (d.status === "running") {
                        console.log(`⏳ Still running (${elapsed}s)...`);
                        setTimeout(checkStatus, interval);
                    }
                })
                .catch((err) => {
                    console.error("Error fetching status:", err);
                    setTimeout(checkStatus, interval);
                });
        };

        checkStatus();
    }

    const csvData =
      "startTime,endTime,spawningIntervalInMinutes,spawningAmount,gender,mass,perceptionInMeter,hasOwnBikeProbability,source,destination\n" +
      "07:00,07:30,10,1,male,75,1.0,0.5,\"POINT(9.9870202 53.4563832)\",\"POINT(9.9906536 53.4522651)\"",
        // Try rentalBicycle as a JSON string (matching the CSV pattern)
        rentalBicycleJSON = JSON.stringify({
            type: "standard",
            maxSpeed: 25,
            maxAcceleration: 2.0,
            maxDeceleration: 3.0,
            length: 1.8,
            width: 0.6,
            height: 1.1
        });

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
                    startPoint: "2025-12-05T07:00:00",
                    endPoint: "2025-12-05T07:30:00",
                    steps: 1800,
                    cycleTravelerLayer: csvData, // CSV string (works)
                    rentalStations: {
                        // GeoJSON object (works)
                        type: "FeatureCollection",
                        features: [
                            {
                                type: "Feature",
                                geometry: {
                                    type: "Point",
                                    coordinates: [9.9871455, 53.4554433]
                                },
                                properties: {
                                    amount_bicycles: 10
                                }
                            }
                        ]
                    },
                    roadNetwork: {
                        // GeoJSON object (works)
                        type: "FeatureCollection",
                        features: [
                            {
                                type: "Feature",
                                geometry: {
                                    type: "LineString",
                                    coordinates: [
                                        [9.9870202, 53.4563832],
                                        [9.9871455, 53.4554433],
                                        [9.9906536, 53.4522651]
                                    ]
                                },
                                properties: {
                                    lanes: 2
                                }
                            }
                        ]
                    },
                    rentalBicycle: rentalBicycleJSON, // TEST: JSON string instead of object
                    config: {}
                },
                outputs: {
                    agents: {}
                },
                jobIdentifier: "bikeJsonString_" + Date.now()
            })
        }
    )
        .then((r) => r.json())
        .then((d) => {
            console.log("🚲 RentalBicycle JSON String Response:", d);
            if (d.jobID) {
                console.log("✅ Job started! ID:", d.jobID);
                console.log("Status:", d.status);
                pollJobStatus(d.jobID);
            }
            else {
                console.error("❌ Failed:", d.detail);
            }
        })
        .catch((e) => console.error("JSON String Test Error:", e));

    // ============================================================================
    // HINWEIS: Alle Tests ab hier verwenden veraltetes CSV-Format
    // ============================================================================
    // Die meisten Tests in dieser Datei verwenden das alte CSV-Format für
    // cycleTravelerLayer. Diese sind nur zur historischen Dokumentation erhalten.
    //
    // Für aktuelle Tests siehe Abschnitt 3: "FUNKTIONIERENDE REQUEST - GeoJSON FeatureCollection"
    //
    // Aktuelles Format (Stand Dezember 2025):
    // - cycleTravelerLayer: GeoJSON FeatureCollection mit LineString-Geometrie
    // - Properties: spawningAmount, spawningIntervalInMinutes, startTime, endTime,
    //               gender, mass, hasOwnBikeProbability, gradient
    // ============================================================================

})();
