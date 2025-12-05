# Green4Bikes API Issue Report

## Problem Summary
The `cycleTravelerLayer` input parameter cannot be successfully processed by the backend, resulting in failed jobs with `DomainDataImporter` exceptions.

## Error Details

### Job Information
- **Failed Job ID**: `52aa84b0-3cc6-41cf-bfc4-58a818eef4b1`
- **Job Identifier**: `csvTest_1764927429950`
- **Timestamp**: 2025-12-05 09:45:13

### Stack Trace
```
System.ArgumentException: The content associated to source 'System.Collections.Generic.Dictionary`2[System.String,System.Object]' does not exist or is not given.
   at Mars.Common.Data.DomainDataImporter.Import(Object dataInput, InputConfiguration inputConfiguration)
   at SOH.Process.Server.Simulations.Helper.Green4BikesMappingHelper.MapCycleTravelerScheduling(SimulationConfig simConfig, Execute executionConfig) in /src/SOH.Process.Server/Simulations/Helper/Green4BikesMappingHelper.cs:line 30
```

## Root Cause Analysis

### Issue 1: Data Format Mismatch
The OpenAPI schema (`process-description-green4bikes.json`) indicates:
```json
{
  "cycleTravelerLayer": {
    "schema": {
      "contentSchema": "application/geo+json",
      "format": "geojson-feature-collection",
      "type": "string"
    }
  }
}
```

However, the backend's `Green4BikesMappingHelper` and `DomainDataImporter` expect **CSV format with WKT geometries**, not GeoJSON.

### Issue 2: Data Wrapper Problem
When sending CSV data as a plain string in the JSON request body:
```javascript
{
  "cycleTravelerLayer": "startTime,endTime,...\n07:00,07:30,..."
}
```

The backend deserializes this into a `Dictionary<string, object>`, but `DomainDataImporter.Import()` cannot find the actual content within the dictionary structure.

## Expected CSV Format (from MARS Documentation)

Based on MARS Framework documentation at https://www.mars-group.org/docs/tutorial/data_sources/csv:

```csv
startTime,endTime,spawningIntervalInMinutes,spawningAmount,gender,mass,perceptionInMeter,hasOwnBikeProbability,source,destination
07:00,07:30,10,1,male,75,1.0,0.5,"POINT(9.9870202 53.4563832)","POINT(9.9906536 53.4522651)"
```

**Key requirements:**
- CSV format with header row
- Geometries in WKT (Well-Known Text) format: `POINT(longitude latitude)`
- All columns from the CSV documentation must be present

## Tests Performed

### Test 1: GeoJSON Format (FAILED)
❌ Resulted in immediate 500 error with property name issues (`anzahl_raeder` vs `amount_bicycles`)

### Test 2: GeoJSON with Corrected Properties (FAILED)  
❌ Backend error: Cannot parse GeoJSON in `MapCycleTravelerScheduling`

### Test 3: CSV as Plain String (FAILED)
❌ Job started but crashed after 3 minutes with `DomainDataImporter` exception

## Recommended Backend Fixes

### Priority 1: Fix DomainDataImporter Integration
**File**: `/src/SOH.Process.Server/Simulations/Helper/Green4BikesMappingHelper.cs` (line 30)

The `MapCycleTravelerScheduling` method needs to properly extract CSV content from the request. Options:

1. **Accept CSV as direct string value**:
   ```csharp
   if (executionConfig.Inputs["cycleTravelerLayer"] is string csvContent)
   {
       // Use csvContent directly with DomainDataImporter
   }
   ```

2. **Support wrapped content**:
   ```json
   {
     "cycleTravelerLayer": {
       "content": "CSV_DATA_HERE"
     }
   }
   ```

3. **Support file references**:
   ```json
   {
     "cycleTravelerLayer": {
       "file": "data:text/csv;base64,..."
     }
   }
   ```

### Priority 2: Update OpenAPI Schema
**File**: Process description schema for `mars:sim-green4Bikes-default`

Update `cycleTravelerLayer` schema to accurately reflect:
- **Actual format**: CSV with WKT geometries (not GeoJSON)
- **Content type**: `text/csv` (not `application/geo+json`)
- **Required columns**: Document the CSV header structure
- **Example**: Provide a working CSV example

Current (incorrect):
```json
{
  "contentSchema": "application/geo+json",
  "format": "geojson-feature-collection"
}
```

Should be:
```json
{
  "contentMediaType": "text/csv",
  "format": "csv-wkt",
  "example": "startTime,endTime,spawningIntervalInMinutes,spawningAmount,gender,mass,perceptionInMeter,hasOwnBikeProbability,source,destination\n07:00,07:30,10,1,male,75,1.0,0.5,\"POINT(9.9870202 53.4563832)\",\"POINT(9.9906536 53.4522651)\""
}
```

### Priority 3: Add Input Validation
Add validation to reject invalid formats early (before job execution) with clear error messages:
- "cycleTravelerLayer must be in CSV format with WKT geometries"
- "Missing required CSV columns: [list]"

## Test Scripts Available

Three test variations are ready in `testRequest.js`:

1. **CSV as plain string** (lines 303-415) - Currently failing
2. **CSV with file wrapper** (lines 418-533) - Uses `{file: "data:text/csv;base64,..."}` 
3. **CSV with content wrapper** (lines 536-651) - Uses `{content: "CSV_DATA"}`

To test backend fixes, execute these self-contained IIFE blocks in the browser console at:
`https://ump-lgv.germanywestcentral.cloudapp.azure.com/`

## Additional Notes

- The `rentalStations` parameter also had a naming issue: schema expects `amount_bicycles` not `anzahl_raeder` (already fixed in our requests)
- All test requests use valid authentication tokens from cookies
- The backend correctly accepts and starts jobs, but fails during execution due to data import issues

## Update: rentalBicycle Has Same Issue ⚠️

**Date**: December 5, 2025 10:16

### Additional Error in MapRentalBicycleType()

Backend logs show **identical DomainDataImporter error** for `rentalBicycle`:

```
System.ArgumentException: The content associated to source 'System.Collections.Generic.Dictionary`2[System.String,System.Object]' does not exist or is not given.
   at Mars.Common.Data.DomainDataImporter.Import[T](String source, String crs)
   at Green4BikesMappingHelper.MapRentalBicycleType() in line 70
```

### Root Cause: Universal Pattern

The MARS framework uses **file references** for all layer inputs in native config:
```json
{"name": "BicycleRentalLayer", "file": "harbug_rental_staions.geojson"}
```

When these inputs come through the API as parsed JSON objects (`Dictionary<string, object>`), `DomainDataImporter.Import()` fails because it expects **file content as strings**, not deserialized objects.

### ✅ Solution: Serialize All Layer Inputs as Strings

**Working Format**:
```javascript
{
  "cycleTravelerLayer": "startTime,endTime,...\nrow1\nrow2",  // CSV string
  "rentalStations": JSON.stringify(geoJsonObject),           // Stringified GeoJSON
  "roadNetwork": JSON.stringify(geoJsonObject),              // Stringified GeoJSON
  "rentalBicycle": JSON.stringify(configObject)              // Stringified JSON
}
```

**Test Results**:
- ⚠️ Job ID: `allStrings_1764929783488` started but **failed after 3 seconds** with same line 70 error
- ❌ `rentalBicycle: null` causes HTTP 500 (parameter is required)
- ❌ `rentalBicycle: {type, maxSpeed, ...}` (flat object) causes DomainDataImporter error at line 70
- ❌ `rentalBicycle: JSON.stringify({object})` - Backend **auto-parses back to Dictionary**, still fails at line 70
- ❌ `rentalBicycle: {content: JSON.stringify({...})}` causes HTTP 500 (invalid structure)
- ✅ **`rentalBicycle: {config: {type, maxSpeed, ...}}`** - **JOB RUNNING!** (Job ID: `mixedNested_1764930568206`)

**BREAKTHROUGH - SOLUTION FOUND! ✅**

The `rentalBicycle` parameter requires a **nested structure** with a `"config"` key:

```javascript
"rentalBicycle": {
    "config": {
        "type": "standard",
        "maxSpeed": 25,
        "maxAcceleration": 2.0,
        "maxDeceleration": 3.0,
        "length": 1.8,
        "width": 0.6,
        "height": 1.1
    }
}
```

**Proof**: Job `mixedNested_1764930568206` started successfully and is RUNNING (45+ seconds and counting).

**Why this works**: `MapRentalBicycleType()` expects the dictionary to have a `"config"` key, then extracts that nested object to pass to DomainDataImporter. The flat object structure was causing the error because the method was trying to pass the entire dictionary directly.

**Previous CRITICAL FINDING**: The API middleware is **auto-parsing JSON strings back into Dictionary objects** before passing them to `MapRentalBicycleType()`. This means `JSON.stringify()` doesn't help because the backend deserializes it again.

**Backend logs for job `2b0933c3-ee66-44e1-b48d-d3d1365cf949`**:
```
System.ArgumentException: The content associated to source 'System.Collections.Generic.Dictionary`2[System.String,System.Object]' does not exist or is not given.
   at Mars.Common.Data.DomainDataImporter.Import(Object dataInput, InputConfiguration inputConfiguration)
   at Green4BikesMappingHelper.MapRentalBicycleType() in line 70
```

This confirms the all-strings approach fails because the API deserializes JSON before mapping.

### Updated Backend Fix Requirements

**ROOT CAUSE**: `Green4BikesMappingHelper.MapRentalBicycleType()` at line 70 passes a `Dictionary<string, object>` directly to `DomainDataImporter.Import()`, but the importer expects either:
1. A file path/reference (string)
2. Already-parsed content (not Dictionary)

**The Fix Must Happen in the Backend** - Client-side workarounds won't work because the API middleware auto-deserializes JSON.

**Required Changes in `Green4BikesMappingHelper.cs`**:

```csharp
// Line 70 - MapRentalBicycleType() needs to extract the config values
// BEFORE passing to DomainDataImporter

// Current (failing):
DomainDataImporter.Import(executionConfig.Inputs["rentalBicycle"], inputConfig)

// Should be:
var bikeDict = executionConfig.Inputs["rentalBicycle"] as Dictionary<string, object>;
var bikeConfig = new RentalBicycleConfig {
    Type = bikeDict["type"]?.ToString(),
    MaxSpeed = Convert.ToDouble(bikeDict["maxSpeed"]),
    MaxAcceleration = Convert.ToDouble(bikeDict["maxAcceleration"]),
    MaxDeceleration = Convert.ToDouble(bikeDict["maxDeceleration"]),
    Length = Convert.ToDouble(bikeDict["length"]),
    Width = Convert.ToDouble(bikeDict["width"]),
    Height = Convert.ToDouble(bikeDict["height"])
};
// Then use bikeConfig in simulation, NOT DomainDataImporter
```

**Similar fixes needed for**:
1. **Line 30**: `MapCycleTravelerScheduling()` - Already partially fixed for CSV
2. Check `MapRentalStations()` and `MapRoadNetwork()` - May have same issue

**Why GeoJSON objects might work but rentalBicycle doesn't**:
- GeoJSON has a standard structure (`type`, `features`) that DomainDataImporter might recognize
- `rentalBicycle` is a custom config object that DomainDataImporter doesn't know how to parse

## References

- MARS Framework CSV Documentation: https://www.mars-group.org/docs/tutorial/data_sources/csv
- MARS Agent Initialization: https://www.mars-group.org/docs/tutorial/soh/agents
- Process Description: Downloaded from `/api/processes/mars:sim-green4Bikes-default`

## Additional Tests Created

Two new tests added to `testRequest.js`:
1. **Mixed Nested Test** (line 1026): Tries `rentalBicycle: {config: {...}}`
2. **Content Wrapper Test** (line 1107): Tries `rentalBicycle: {content: JSON.stringify(...)}`

These test if wrapping the config helps the backend extract it properly.
