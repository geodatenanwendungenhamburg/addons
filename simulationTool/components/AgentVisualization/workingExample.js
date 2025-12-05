// ✅ WORKING EXAMPLE - Green4Bikes Simulation API
// All layer inputs must be serialized as strings for DomainDataImporter

(function() {
    const token = document.cookie.split("; ").find(row => row.startsWith("token=")).split("=")[1];
    
    if (!token) {
        console.error("❌ No authentication token found in cookies");
        return;
    }
    
    console.log("🚴 Green4Bikes Working Example");
    console.log("Token:", token.substring(0, 20) + "...");
    
    // 1. cycleTravelerLayer: CSV string with WKT geometries
    const csvData = "startTime,endTime,spawningIntervalInMinutes,spawningAmount,gender,mass,perceptionInMeter,hasOwnBikeProbability,source,destination\n" +
                    "07:00,07:30,10,1,male,75,1.0,0.5,\"POINT(9.9870202 53.4563832)\",\"POINT(9.9906536 53.4522651)\"";
    
    // 2. rentalStations: GeoJSON as stringified JSON
    const rentalStationsGeoJSON = JSON.stringify({
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [9.9871455, 53.4554433]
            },
            "properties": {
                "amount_bicycles": 10  // Note: property name is amount_bicycles, not anzahl_raeder
            }
        }]
    });
    
    // 3. roadNetwork: GeoJSON as stringified JSON
    const roadNetworkGeoJSON = JSON.stringify({
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
    });
    
    // 4. rentalBicycle: Configuration with nested 'config' object (CRITICAL!)
    const rentalBicycleConfig = {
        "config": {
            "type": "standard",
            "maxSpeed": 25,
            "maxAcceleration": 2.0,
            "maxDeceleration": 3.0,
            "length": 1.8,
            "width": 0.6,
            "height": 1.1
        }
    };
    
    // Polling function to monitor job progress
    function pollJobStatus(jobId, interval = 5000) {
        let pollCount = 0;
        const checkStatus = () => {
            pollCount++;
            fetch(`https://ump-lgv.germanywestcentral.cloudapp.azure.com/api/jobs/${jobId}`, {
                headers: {"Authorization": `Bearer ${token}`}
            })
                .then(r => r.json())
                .then(d => {
                    const elapsed = Math.floor(pollCount * interval / 1000);
                    console.log(`[${elapsed}s] Status: ${d.status} | Updated: ${d.updated}`);
                    
                    if (d.status === "successful") {
                        console.log("✅ SUCCESS! Job completed!");
                        console.log("Full response:", d);
                        if (d.links && d.links.length > 0) {
                            console.log("Results link:", d.links[0].href);
                        }
                    } else if (d.status === "failed") {
                        console.error("❌ Job FAILED!");
                        console.error("Message:", d.message);
                        console.error("Full details:", d);
                        console.error("\n🔍 Request backend logs for job:", jobId);
                    } else if (d.status === "running") {
                        console.log(`⏳ Still running (${elapsed}s)...`);
                        setTimeout(checkStatus, interval);
                    }
                })
                .catch(err => {
                    console.error("Error fetching status:", err);
                    setTimeout(checkStatus, interval);
                });
        };
        checkStatus();
    }
    
    // Submit the job
    fetch("https://ump-lgv.germanywestcentral.cloudapp.azure.com/api/processes/mars:sim-green4Bikes-default/execution", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            "inputs": {
                "startPoint": "2025-12-05T07:00:00",
                "endPoint": "2025-12-05T07:30:00",  // Minimum 30 minutes duration required
                "steps": 1800,  // Can be any value >= 60
                "cycleTravelerLayer": csvData,              // CSV string - NOT JSON object
                "rentalStations": rentalStationsGeoJSON,    // Stringified GeoJSON - NOT JSON object
                "roadNetwork": roadNetworkGeoJSON,          // Stringified GeoJSON - NOT JSON object
                "rentalBicycle": rentalBicycleConfig,       // MUST be nested in 'config' object!
                "config": {}
            },
            "outputs": {
                "agents": {}
            },
            "jobIdentifier": "workingExample_" + Date.now()
        })
    })
        .then(r => r.json())
        .then(d => {
            console.log("Response:", d);
            if (d.jobID) {
                console.log("✅ Job started successfully!");
                console.log("Job ID:", d.jobID);
                console.log("Status:", d.status);
                console.log("\n🔄 Starting automatic polling...");
                pollJobStatus(d.jobID);
            } else {
                console.error("❌ Job submission failed:", d.detail);
            }
        })
        .catch(e => console.error("❌ Error:", e));
})();

// IMPORTANT NOTES:
// 
// 1. Format requirements for each input:
//    - cycleTravelerLayer: CSV string with WKT geometries
//    - rentalStations: JSON.stringify(geoJsonObject)
//    - roadNetwork: JSON.stringify(geoJsonObject)
//    - rentalBicycle: MUST be {config: {properties...}} - nested structure!
//
// 2. Duration requirements:
//    - Minimum: 30 minutes (endPoint - startPoint >= 30min)
//    - Steps parameter can be any value >= 60
//
// 3. CSV format for cycleTravelerLayer:
//    - Required columns: startTime, endTime, spawningIntervalInMinutes, spawningAmount, 
//                       gender, mass, perceptionInMeter, hasOwnBikeProbability, source, destination
//    - Geometries in WKT format: "POINT(longitude latitude)"
//    - Example: "POINT(9.9870202 53.4563832)"
//
// 4. Property names:
//    - Rental stations use: amount_bicycles (NOT anzahl_raeder)
//
// 5. Run this in browser console at: https://ump-lgv.germanywestcentral.cloudapp.azure.com/
