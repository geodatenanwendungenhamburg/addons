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
         * @param {Object|null} [payload.params.selectedFilters] - The selected options for select filtering.
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

        if (params.selectedFilters) {
            const selectedFilters = params.selectedFilters || {};

            filters.select.forEach(select => {
                const selection = selectedFilters[select.field];
                let selectedValues = [];

                if (select.multiple && Array.isArray(selection) && selection.length > 0) {
                    selectedValues = selection;
                }
                else if (!select.multiple && selection !== null && selection !== undefined && selection !== "") {
                    selectedValues = [selection];
                }

                const validValues = selectedValues.filter(value => select.options.some(option => option.value === value));

                if (validValues.length > 0) {
                    const expressions = validValues.map(value => `${select.field} = '${String(value).replaceAll("'", "''")}'`);

                    filterStrings.push(`(${expressions.join(" OR ")})`);
                }
            });
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

        commit("setShowLoadingSpinner", true);

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
            }).finally(() => {
                commit("setShowLoadingSpinner", false);
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
                olFeature.setId(feature.id);
                olFeature.set("featureId", feature.id); // Store as property backup

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
    },
    /**
     * Adds or removes the selected features to/from the given selection layer and creates it if needed.
     * @param {Object} context Vuex action context.
     * @param {Function} context.commit Vuex commit function.
     * @param {Function} context.dispatch Vuex dispatch function.
     * @param {Array} features - The OpenLayers features to display as selection.
     * @param {string} layerName - The name of the selection layer.
     * @returns {Promise<void>} Resolves after the selected features have been added to the layer.
     */
    async updateSelectionLayer ({commit, dispatch}, {features, layerName}) {
        const map = mapCollection.getMap("2D");

        if (!map) {
            return;
        }

        if (!features || features.length === 0) {
            commit("setMapFeaturesSelected", []);
        }
        else {
            commit("setMapFeaturesSelected", features);
        }

        let selectionLayer = map.getLayers().getArray().find(l => l.get("name") === layerName);

        if (!selectionLayer) {
            selectionLayer = await dispatch("Maps/addNewLayerIfNotExists", {layerName: layerName}, {root: true});
        }

        selectionLayer.getSource().clear();
        if (features && features.length > 0) {
            selectionLayer.getSource().addFeatures(features);
        }
    },
    /**
     * Loads the tour steps from the configured URL and starts the Shepherd tour.
     * Button actions in the JSON are resolved to Shepherd methods at runtime.
     * @returns {Promise<void>} Resolves after the tour has been started.
     */
    async startGuidedTour ({state, dispatch}) {
        const stepsUrl = state.landRegistryFileTourUrl,
            ShepherdLibrary = window.Shepherd;

        if (!stepsUrl || !ShepherdLibrary?.Tour) {
            console.warn("The steps-URL or Shepherd are not available.");

            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: "Die Hilfetour ist nicht verfügbar. Bitte nutzen Sie bei Bedarf das Kontaktformular in der linken Seitenspalte.",
                once: true
            }, {root: true});

            return;
        }

        try {
            const response = await fetch(stepsUrl);

            if (!response.ok) {
                throw new Error(`Unable to load tour configuration: ${response.status}`);
            }

            const config = await response.json();

            if (!Array.isArray(config.tourSteps)) {
                throw new Error("Tour configuration must contain a tourSteps array.");
            }

            const tour = new ShepherdLibrary.Tour({
                    useModalOverlay: true,
                    defaultStepOptions: {
                        classes: "landregistry-guided-tour",
                        scrollTo: true
                    }
                }),
                actionHandlers = {
                    complete: () => tour.complete(),
                    next: () => tour.next(),
                    back: () => tour.back(),
                    restart: () => {
                        tour.complete();
                        tour.start();
                    }
                },
                steps = config.tourSteps.map(step => ({
                    ...step,
                    buttons: (step.buttons || []).map(button => {
                        const action = actionHandlers[button.action];

                        if (!action) {
                            throw new Error(`Unsupported tour action: ${button.action}`);
                        }

                        return {...button, action};
                    })
                }));

            tour.addSteps(steps);
            tour.start();
        }
        catch (error) {
            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: "Die Hilfetour ist nicht verfügbar. Bitte nutzen Sie bei Bedarf das Kontaktformular in der linken Seitenspalte.",
                once: true
            }, {root: true});

            console.error(error);
        }
    }
};
