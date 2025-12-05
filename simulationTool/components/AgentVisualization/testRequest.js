// Holt den aktuellen Token aus dem Cookie
const token = document.cookie.split("; ").find(row => row.startsWith("token=")).split("=")[1];

console.log("Current token:", token);

// Polling-Funktion für Job-Status
/**
 * Polls the job status until it's completed or failed
 * @param {string} jobId - The job ID to poll
 * @param {number} interval - Polling interval in milliseconds
 */
function pollJobStatus (jobId, interval = 2000) {
    const checkStatus = () => {
        fetch(`https://ump-lgv.germanywestcentral.cloudapp.azure.com/api/jobs/${jobId}`, {
            headers: {"Authorization": `Bearer ${token}`}
        })
            .then(r => r.json())
            .then(d => {
                console.log(`Status: ${d.status} | Updated: ${d.updated}`);

                if (d.status === "successful") {
                    console.log("✅ Job completed successfully!");
                    console.log("Results link:", d.links[0].href);

                    // Ergebnisse abrufen
                    fetch(d.links[0].href, {
                        headers: {"Authorization": `Bearer ${token}`}
                    })
                        .then(r => r.json())
                        .then(results => console.log("Results:", results));

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

// KORREKTER Request mit allen required Parametern
fetch("https://ump-lgv.germanywestcentral.cloudapp.azure.com/api/processes/mars:sim-green4Bikes-default/execution", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
        "inputs": {
            "startPoint": "2024-12-01T07:00:00",
            "endPoint": "2024-12-01T07:05:00",
            "steps": 300,  // 5 Minuten = 300 Sekunden
            "cycleTravelerLayer": {
                "type": "FeatureCollection",
                "features": [{
                    "type": "Feature",
                    "geometry": {
                        "type": "LineString",
                        "coordinates": [
                            [9.9870202, 53.4563832],   // Start
                            [9.9906536, 53.4522651]    // Ziel
                        ]
                    },
                    "properties": {
                        "startTime": "2024-12-01T07:00:00",
                        "endTime": "2024-12-01T07:02:00",
                        "spawningAmount": 2,
                        "spawningIntervalInMinutes": 1,
                        "hasOwnBikeProbability": 50,
                        "gender": "male",
                        "mass": 80
                    }
                }]
            },
            "rentalStations": {
                "type": "FeatureCollection",
                "features": [{
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [9.9871455, 53.4554433]
                    },
                    "properties": {
                        "anzahl_raeder": 10
                    }
                }]
            },
            "roadNetwork": {
                "type": "FeatureCollection",
                "features": [{
                    "type": "Feature",
                    "geometry": {
                        "type": "LineString",
                        "coordinates": [
                            [9.9870202, 53.4563832],
                            [9.9871455, 53.4554433],
                            [9.9906536, 53.4522651]
                        ]
                    },
                    "properties": {
                        "lanes": 2
                    }
                }]
            },
            "rentalBicycle": {
                "type": "standard",
                "maxSpeed": 25,
                "maxAcceleration": 2.0,
                "maxDeceleration": 3.0,
                "length": 1.8,
                "width": 0.6,
                "height": 1.1
            },
            "config": {}
        },
        "outputs": {
            "agents": {}
        },
        "jobIdentifier": "bikesTest"
    })
})
    .then(r => r.json())
    .then(d => {
        console.log("Success:", d);
        if (d.jobID) {
            console.log("Job started! ID:", d.jobID);
            console.log("Status:", d.status);
            
            // Automatisch Polling starten
            if (d.status === "failed") {
                console.error("❌ Job failed immediately! Check the full status for details.");
            }
            pollJobStatus(d.jobID);
        }
    })
    .catch(e => console.error("Error:", e));

// Status abfragen:
// Job Status abfragen
const jobId = "job-job-sim-green4Bikes-default-BidIAMCLPe_7alMVoPlDY-bikesTest"; // JOB ID hier einfügen

fetch(`https://ump-lgv.germanywestcentral.cloudapp.azure.com/api/jobs/${jobId}`, {
    headers: {"Authorization": `Bearer ${token}`}
})
    .then(r => r.json())
    .then(d => console.log("Job Status:", d));

// Hol die Process-Beschreibung mit allen required Parametern
fetch("https://ump-lgv.germanywestcentral.cloudapp.azure.com/api/processes/mars:sim-green4Bikes-default", {
    headers: {"Authorization": `Bearer ${token}`}
})
    .then(r => r.json())
    .then(d => {
        console.log("Process Description:", d);
        console.log("\nInputs:", d.inputs);
        const requiredInputs = Object.entries(d.inputs || {})
            .filter(([, v]) => v.minOccurs === 1)
            .map(([k]) => k);
        console.log("\nRequired inputs:", requiredInputs);
        
        // Download als JSON-Datei
        const blob = new Blob([JSON.stringify(d, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'process-description-green4bikes.json';
        a.click();
        URL.revokeObjectURL(url);
        console.log("✅ Process description downloaded!");
    });

// CORRECTED REQUEST - Mit korrigierten Property-Namen (SELF-CONTAINED)
(function() {
    const token = document.cookie.split("; ").find(row => row.startsWith("token=")).split("=")[1];
    
    console.log("Token:", token.substring(0, 20) + "...");
    
    function pollJobStatus (jobId, interval = 2000) {
        const checkStatus = () => {
            fetch(`https://ump-lgv.germanywestcentral.cloudapp.azure.com/api/jobs/${jobId}`, {
                headers: {"Authorization": `Bearer ${token}`}
            })
                .then(r => r.json())
                .then(d => {
                    console.log(`Status: ${d.status} | Updated: ${d.updated}`);

                    if (d.status === "successful") {
                        console.log("✅ Job completed successfully!");
                        console.log("Results link:", d.links[0].href);

                        fetch(d.links[0].href, {
                            headers: {"Authorization": `Bearer ${token}`}
                        })
                            .then(r => r.json())
                            .then(results => console.log("Results:", results));
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
    
    fetch("https://ump-lgv.germanywestcentral.cloudapp.azure.com/api/processes/mars:sim-green4Bikes-default/execution", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            "inputs": {
                "startPoint": "2025-12-05T09:00:00",
                "endPoint": "2025-12-05T09:01:00",
                "steps": 60,
                "cycleTravelerLayer": {
                    "type": "FeatureCollection",
                    "features": [{
                        "type": "Feature",
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [
                                [9.9870202, 53.4563832],
                                [9.9906536, 53.4522651]
                            ]
                        },
                        "properties": {
                            "startTime": "2025-12-05T09:00:00",
                            "endTime": "2025-12-05T09:00:30",
                            "spawningAmount": 1,
                            "spawningIntervalInMinutes": 1,
                            "hasOwnBikeProbability": 50,
                            "gender": "male",
                            "mass": 75
                        }
                    }]
                },
                "rentalStations": {
                    "type": "FeatureCollection",
                    "features": [{
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [9.9871455, 53.4554433]
                        },
                        "properties": {
                            "amount_bicycles": 10
                        }
                    }]
                },
                "roadNetwork": {
                    "type": "FeatureCollection",
                    "features": [{
                        "type": "Feature",
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [
                                [9.9870202, 53.4563832],
                                [9.9871455, 53.4554433],
                                [9.9906536, 53.4522651]
                            ]
                        },
                        "properties": {
                            "lanes": 2
                        }
                    }]
                },
                "rentalBicycle": {
                    "type": "standard",
                    "maxSpeed": 25,
                    "maxAcceleration": 2.0,
                    "maxDeceleration": 3.0,
                    "length": 1.8,
                    "width": 0.6,
                    "height": 1.1
                },
                "config": {}
            },
            "outputs": {
                "agents": {}
            },
            "jobIdentifier": "correctedTest_" + Date.now()
        })
    })
        .then(r => r.json())
        .then(d => {
            console.log("Corrected Test Response:", d);
            if (d.jobID) {
                console.log("Job started! ID:", d.jobID);
                console.log("Status:", d.status);
                pollJobStatus(d.jobID);
            } else if (d.status === 500) {
                console.error("Server Error:", d.detail);
            }
        })
        .catch(e => console.error("Error:", e));
})();

