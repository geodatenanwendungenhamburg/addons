import getOAFFeature from "@shared/js/api/oaf/getOAFFeature.js";
import createStyle from "@masterportal/masterportalapi/src/vectorStyle/createStyle.js";
import GeoJSON from "ol/format/GeoJSON.js";
import layerCollection from "@core/layers/js/layerCollection.js";
import layerFactory from "@core/layers/js/layerFactory";

export default {
    /**
         * Queries the OAF feature service with the provided parameters.
         * @param {Object} context - The Vuex context object.
         * @param {Function} context.commit Vuex commit function.
         * @param {Object} context.state Vuex module state.
         * @param {Function} context.dispatch Vuex dispatch function.
         * @param {Object} payload - The payload containing the query parameters.
         * @param {Object} payload.params - The values for filtering the OAF query.
         * @param {string|null} [payload.params.startDate] - The start date for filtering in YYYY-MM-DD format.
         * @param {string|null} [payload.params.endDate] - The end date for filtering in YYYY-MM-DD format.
         * @param {string|null} [payload.params.textValue] - The text value for text search filtering.
         * @param {Array<string>|null} [payload.params.selectedOptions] - The selected options for select filtering.
         * @param {Array} [payload.params.bbox] - The bounding box for spatial filtering.
         * @param {string} [payload.params.crs] - The coordinate reference system.
         * @returns {Promise<boolean>} A promise that resolves to true if the query was successful, or false if an error occurred.
         */
    async queryOaf ({commit, state, dispatch}, {params}) {
        const oafParams = state.oafParams,
            filters = oafParams.filters;
        const filterStrings = [];

        if (params.startDate && params.endDate) {
            const dateField = filters.dateRangeField;

            filterStrings.push(`(${dateField} >= DATE('${params.startDate}') AND ${dateField} <= DATE('${params.endDate}'))`);
        }

        if (params.textValue) {
            const textFilter = filters.textSearchFields
                .map(field => `CASEI(${field}) LIKE CASEI('%${params.textValue}%')`)
                .join(" OR ");

            filterStrings.push(`(${textFilter})`);
        }

        if (params.selectedOptions) {
            const select = filters.select;
            const selectedOptionsStrings = [];

            params.selectedOptions.forEach(selectedOption => {
                if (!select.options.includes(selectedOption)) {
                    return;
                }

                selectedOptionsStrings.push(`${select.field} = '${selectedOption}'`);
            });

            filterStrings.push(`(${selectedOptionsStrings.join(" OR ")})`);
        }

        const completeFilterString = filterStrings.join(" AND ");

        const queryParams = {
            limit: 10000,
            filter: completeFilterString !== "" ? completeFilterString : undefined,
            bbox: params.bbox,
            bboxCrs: params.crs,
            filterCrs: params.crs,
            crs: params.crs
        };

        try {
            const landRegistryFileFeatures = await getOAFFeature.getOAFFeatureGet(
                oafParams.url,
                oafParams.collection,
                queryParams
            );

            commit("setLandRegistryFileFeatures", landRegistryFileFeatures);

            dispatch("addFeaturesToMap", landRegistryFileFeatures);

            return true;
        }
        catch (error) {
            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: "Fehler beim Abrufen der Grundstücksakten. Bitte versuchen Sie es erneut."
            }, {root: true});

            console.error(error);

            return false;
        }
    },
    /**
         * Loads the OAF collection schema and stores it in the module state.
         * @param {Object} context Vuex action context.
         * @param {Function} context.commit Vuex commit function.
         * @param {Object} context.state Vuex module state.
         * @param {Function} context.dispatch Vuex dispatch function.
         * @returns {void}
    */
    queryOafSchema ({commit, state, dispatch}) {
        const oafParams = state.oafParams;

        getOAFFeature.getCollectionSchema(oafParams.url, oafParams.collection)
            .then(schema => {
                commit("setOafSchema", schema);
            })
            .catch(error => {
                console.error(error);
                dispatch("Alerting/addSingleAlert", {
                    category: "error",
                    content: `Fehler beim Abrufen notwendiger Daten für ${oafParams.collection}. Bitte versuchen Sie es erneut.`
                }, {root: true});
            });
    },
    /**
     * Adds the provided GeoJSON features to the map using the configured style.
     * @param {Object} context - The Vuex action context.
     * @param {Object} context.state - Vuex state object.
     * @param {Function} context.commit - Vuex commit function.
     * @param {Array<Object>} features - The GeoJSON features to add to the map.
     * @returns {Promise<void>} A promise that resolves when the features have been added.
     */
    async addFeaturesToMap ({state, commit}, features) {
        let definedStyles = state.styles;

        if (Object.keys(definedStyles).length === 0) {
            const styles = await fetch(state.styleConf)
                .then(response => response.json());

            commit("setStyles", styles);
            definedStyles = styles;
        }

        const layerStyleObject = definedStyles.find(item => item.styleId === "belegenheiten"),
            geoJson = new GeoJSON();

        let featuresToMap = features;

        if (layerStyleObject) {
            const styledFeatures = features.map(feature => {
                const olFeature = geoJson.readFeature(feature),
                    style = createStyle.createStyle(layerStyleObject, olFeature, false, Config.wfsImgPath);

                olFeature.setStyle(style);

                return olFeature;
            });

            featuresToMap = styledFeatures;
        }

        let layer;

        if (typeof layerCollection.getLayerById("Module/landRegistryFile/layer/belegenheiten") !== "undefined") {
            layer = layerCollection.getLayerById("Module/landRegistryFile/layer/belegenheiten");
        }
        else {
            layer = layerFactory.createLayer({
                typ: "VECTORBASE",
                id: "Module/landRegistryFile/layer/belegenheiten",
                name: "Module/landRegistryFile/layer/belegenheiten",
                alwaysOnTop: true,
                renderer: "webgl"
            });

            layerCollection.addLayer(layer);
        }

        layer.layer.getSource().clear();
        layer.layer.getSource().addFeatures(featuresToMap);
    }
};
