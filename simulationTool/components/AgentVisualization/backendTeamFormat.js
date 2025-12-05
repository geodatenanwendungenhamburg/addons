// BACKEND TEAM FORMAT - Exact format they say should work
(function() {
    const token = document.cookie.split("; ").find(row => row.startsWith("token=")).split("=")[1];
    
    console.log("🏢 Backend Team Format Test - Token:", token.substring(0, 20) + "...");
    
    function pollJobStatus (jobId, interval = 3000) {
        const checkStatus = () => {
            fetch(`https://ump-lgv.germanywestcentral.cloudapp.azure.com/api/jobs/${jobId}`, {
                headers: {"Authorization": `Bearer ${token}`}
            })
                .then(r => r.json())
                .then(d => {
                    console.log(`Backend Team Test Status: ${d.status} | Updated: ${d.updated}`);

                    if (d.status === "successful") {
                        console.log("✅✅✅ Backend Team Format SUCCESS!");
                        console.log("Full response:", d);
                        if (d.links && d.links[0]) {
                            console.log("Results link:", d.links[0].href);
                            fetch(d.links[0].href, {
                                headers: {"Authorization": `Bearer ${token}`}
                            })
                                .then(r => r.json())
                                .then(results => console.log("Results:", results));
                        }
                    }
                    else if (d.status === "failed") {
                        console.error("❌ Backend Team Format Job failed:", d.message);
                        console.error("Full details:", d);
                    }
                    else if (d.status === "running") {
                        console.log("⏳ Still running...");
                        setTimeout(checkStatus, interval);
                    }
                })
                .catch(err => {
                    console.error("Error fetching status:", err);
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
                "startPoint": "2024-12-01T06:45:00",
                "endPoint": "2024-12-01T07:15:00",
                "cycleTravelerSource": {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [9.9870202019994, 53.45638324750834]
                    },
                    "properties": {
                        "spawningAmount": "10"
                    }
                },
                "cycleTravelerTarget": {
                    "type": "Point",
                    "coordinates": [9.990653573687837, 53.45226506110822]
                },
                "rentalStations": {
                    "type": "FeatureCollection",
                    "features": [{
                        "type": "Feature",
                        "geometry": {
                            "type": "Point",
                            "coordinates": [9.9871454906785, 53.455443261874166]
                        },
                        "properties": {
                            "anzahl_raeder": 10
                        }
                    }]
                }
            },
            "outputs": {
                "agents": {}
            },
            "jobIdentifier": "backendTeamFormat_" + Date.now()
        })
    })
        .then(r => r.json())
        .then(d => {
            console.log("🏢 Backend Team Format Response:", d);
            if (d.jobID) {
                console.log("✅ Job started! ID:", d.jobID);
                console.log("Status:", d.status);
                pollJobStatus(d.jobID);
            } else {
                console.error("❌ Failed:", d);
            }
        })
        .catch(e => console.error("Error:", e));
})();
