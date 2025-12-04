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
            console.log("Use: pollJobStatus('" + d.jobID + "')");
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


// Hol die Processes:
// Gibt es einen Test-Prozess?
fetch("https://ump-lgv.germanywestcentral.cloudapp.azure.com/api/processes", {
    headers: {"Authorization": `Bearer ${token}`}
}).then(r => r.json()).then(d => console.log(d));

// Holt den aktuellen Token aus dem Cookie
const token = document.cookie.split("; ").find(row => row.startsWith("token=")).split("=")[1];

console.log("Current token:", token);

// Polling-Funktion für Job-Status
/**
 *
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
                }
                else if (d.status === "running") {
                    console.log("⏳ Still running...");
                    setTimeout(checkStatus, interval);
                }
            });
    };

    checkStatus();
}
