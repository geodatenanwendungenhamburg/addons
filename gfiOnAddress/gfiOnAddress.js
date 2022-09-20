import store from "../../src/app-store";
import {createGfiFeature} from "../../src/api/gfi/getWmsFeaturesByMimeType";

Backbone.Events.listenTo(Radio.channel("Searchbar"), {
    "hit": startGfi
});

/**
 * Starts the gfi with hit type properties.
 * Note: only for hits with type === "Adresse" (Gazetteer).
 * @param {Object} hit The clicked search hit.
 * @returns {void}
 */
function startGfi (hit) {
    if (hit?.type === "Adresse") {
        const gfiOnClickConfig = store.getters?.portalConfig?.searchBar?.gazetteer?.gfiOnClick,
            feature = createFeature(hit, gfiOnClickConfig);

        store.commit("Maps/setClickCoordinate", [hit.coordinate[0], hit.coordinate[1]]);
        store.commit("Tools/Gfi/setGfiFeatures", [feature]);
    }
}

/**
 * Create feature to use it for the gfi.
 * @param {Object} hit The clicked search hit.
 * @param {Object} gfiOnClickConfig The config of gazetter gfiOnClick.
 * @returns {Object} The feature.
 */
function createFeature (hit, gfiOnClickConfig) {
    const feature = createGfiFeature(
        createLayer(hit, gfiOnClickConfig),
        null, // for url
        {
            getProperties: () => prepareProperties(hit.properties)
        }
    );

    return feature;
}

/**
 * Creates an layer object to use it for the gfi.
 * @param {Object} hit The clicked search hit.
 * @param {Object} gfiOnClickConfig The config of gazetter gfiOnClick.
 * @returns {Object} The layer.
 */
function createLayer (hit, gfiOnClickConfig) {
    const layer = {
        get: (key) => {
            if (key === "name") {
                return i18next.t("additional:modules.gfiOnAddress.title", {hitName: hit.name});
            }
            else if (key === "gfiTheme") {
                return gfiOnClickConfig.gfiTheme;
            }
            else if (key === "gfiAttributes") {
                return gfiOnClickConfig.gfiAttributes;
            }
            return null;
        }
    };

    return layer;
}

/**
 * Prepare properties object values to strings.
 * @param {Object} properties The gfi properties
 * @returns {Object} prepared properties
 */
function prepareProperties (properties) {
    const preparedProperties = {};

    Object.keys(properties).forEach(key => {
        let value = properties[key];

        if (typeof value === "object") {
            value = value._;
        }

        preparedProperties[key] = value;
    });

    return preparedProperties;
}
