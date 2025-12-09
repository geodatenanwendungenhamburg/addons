import axios from "axios";

/**
 * Checks if the OAF service supports CQL filtering.
 * @param {String} baseUrl - The base url of the oaf api.
 * @returns {Promise<Object>} Object with {supportsFilter: boolean, filterType: string|null}
 */
async function supportsFiltering (baseUrl) {
    if (typeof baseUrl !== "string") {
        return {supportsFilter: false, filterType: null};
    }

    try {
        const response = await axios.get(`${baseUrl}/conformance`),
            conformsTo = response.data?.conformsTo || [];

        // Check for specific CQL filter support with priority
        // CQL2 is the newer standard
        if (conformsTo.some(uri => uri.includes("cql2-text") || uri.includes("http://www.opengis.net/spec/cql2/1.0"))) {
            return {supportsFilter: true, filterType: "cql2-text"};
        }
        // CQL (older standard)
        if (conformsTo.some(uri => uri.includes("cql-text") || uri.includes("http://www.opengis.net/spec/ogcapi-features-3/1.0/conf/filter"))) {
            return {supportsFilter: true, filterType: "cql-text"};
        }
        // Generic filter support (least specific)
        if (conformsTo.some(uri => uri.includes("filter"))) {
            return {supportsFilter: true, filterType: "filter"};
        }

        return {supportsFilter: false, filterType: null};
    }
    catch (error) {
        console.warn("Could not check OAF conformance:", error);
        return {supportsFilter: false, filterType: null};
    }
}

/**
 * Gets the geometry property name from the collection schema.
 * @param {String} baseUrl - The base url of the oaf api.
 * @param {String} collection - The collection name.
 * @returns {Promise<String>} The name of the geometry property, defaults to "geometry".
 */
async function getGeometryPropertyName (baseUrl, collection) {
    try {
        const response = await axios.get(`${baseUrl}/collections/${collection}`, {
                params: {f: "json"}
            }),
            // Try to get geometry property name from collection metadata
            geometryProperty = response.data?.geometryProperty,
            // Fallback: check schema
            schemaResponse = !geometryProperty ? await axios.get(`${baseUrl}/collections/${collection}/schema`, {
                headers: {accept: "application/schema+json"}
            }) : null,
            properties = schemaResponse?.data?.properties || {};

        // Look for common geometry property names
        for (const [key, value] of Object.entries(properties)) {
            if (value.format === "geometry" || value.type === "geometry" ||
                key === "geometry" || key === "geom" || key === "the_geom") {
                return key;
            }
        }
    }
    catch (error) {
        console.warn("Could not determine geometry property name:", error);
    }

    // Default fallback
    return "geometry";
}

export default {
    supportsFiltering,
    getGeometryPropertyName
};
