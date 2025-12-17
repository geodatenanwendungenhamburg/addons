/* eslint-disable one-var */
import {GeoJSON} from "ol/format.js";
import isObject from "../../../src/shared/js/utils/isObject";
import {extractEventCoordinates} from "../../../src/shared/js/utils/extractEventCoordinates";
import layerCollection from "../../../src/core/layers/js/layerCollection";
import ConvertStyle from "../js/convertStyle";
import layerFactory from "../../../src/core/layers/js/layerFactory";
import {infrastructureLayerId} from "../layerIds.js";
import createInfrastructureStyle from "../js/createInfrastructureStyle";
import mapCollection from "../../../src/core/maps/js/mapCollection";

export default {
    /**
     * Add files and parse them into planning scenarios.
     * @param {Object} param.dispatch the dispatch
     * @param {Object[]} files the imported files.
     * @returns {void}
     */
    addFile ({dispatch}, files) {
        Array.from(files).forEach(file => {
            const reader = new FileReader();

            reader.readAsText(file);
            reader.onload = async f => {
                dispatch("parseScenarioFromImport", f?.target?.result);
            };
        });
    },
    // async fetchProviders ({commit}) {
    //     commit("setProvidersLoading", true);
    //     console.log(Config.simulationApiUrl);
    //     try {
    //         const response = await fetch(`${Config.simulationApiUrl}/processes/providers`, {
    //             headers: {
    //                 "content-type": "application/json"
    //             }
    //         }).then((res) => res.json());

    //         commit("setProviders", response);
    //     }
    //     catch (error) {
    //         console.error(error);
    //     }
    //     finally {
    //         commit("setProvidersLoading", false);
    //     }
    // },

    async fetchProcesses ({commit, getters, rootGetters}) {
        let additionalHeaders = {};

        if (rootGetters["Modules/Login/loggedIn"]) {
            additionalHeaders = {
                Authorization: `Bearer ${rootGetters["Modules/Login/accessToken"]}`
            };
        }

        commit("setProcessesLoading", true);

        try {
            const response = await fetch(`${getters.simulationApiUrl}/processes/`, {
                headers: {
                    "content-type": "application/json",
                    ...additionalHeaders
                }
            }).then((res) => res.json());

            commit("setProcesses", response.processes);
        }
        catch (error) {
            console.error(error);
        }
        finally {
            commit("setProcessesLoading", false);
        }

    },

    async fetchJobs ({commit, getters, rootGetters}) {
        let additionalHeaders = {};

        if (rootGetters["Modules/Login/loggedIn"]) {
            additionalHeaders = {
                Authorization: `Bearer ${rootGetters["Modules/Login/accessToken"]}`
            };
        }

        commit("setJobsLoading", true);

        try {
            const response = await fetch(
                `${getters.simulationApiUrl}/jobs/?include_ensembles`,
                {
                    headers: {
                        "content-type": "application/json",
                        ...additionalHeaders
                    }
                }).then((res) => res.json());

            commit("setJobs", response.jobs);
        }
        catch (error) {
            console.error(error);
        }
        finally {
            commit("setJobsLoading", false);
        }

    },

    /**
     * Checks if the content is in valid format.
     * @param {Object} param.dispatch the dispatch
     * @param {Object} val single scenario content.
     * @returns {Boolean} true if the content is in right format.
     */
    isFormatValid ({dispatch}, val) {
        if (!isObject(val)) {
            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: i18next.t("additional:modules.tools.simulationTool.planningScenarioWrongFormat")
            }, {root: true});
            return false;
        }
        else if (typeof val.id === "undefined") {
            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: i18next.t("additional:modules.tools.simulationTool.planningScenarioWrongFormat") + "<br>" + i18next.t("additional:modules.tools.simulationTool.planningScenarioMissedKey", {key: "id"})
            }, {root: true});
            return false;
        }
        else if (typeof val.name === "undefined") {
            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: i18next.t("additional:modules.tools.simulationTool.planningScenarioWrongFormat") + "<br>" + i18next.t("additional:modules.tools.simulationTool.planningScenarioMissedKey", {key: "name"})
            }, {root: true});
            return false;
        }
        else if (typeof val.inputs === "undefined" || Object.keys(val.inputs).length === 0) {
            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: i18next.t("additional:modules.tools.simulationTool.planningScenarioWrongFormat") + "<br>" + i18next.t("additional:modules.tools.simulationTool.planningScenarioMissedKey", {key: "inputs"})
            }, {root: true});
            return false;
        }
        else if (typeof val.scenarioFeature === "undefined" || (typeof val.scenarioFeature.type === "undefined" || typeof val.scenarioFeature.features === "undefined")) {
            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: i18next.t("additional:modules.tools.simulationTool.planningScenarioWrongFormat") + "<br>" + i18next.t("additional:modules.tools.simulationTool.planningScenarioMissedKey", {key: "scenarioFeature"})
            }, {root: true});
            return false;
        }

        return true;
    },

    /**
     * Increments the job status change counter.
     * @param {Object} context.commit the commit
     * @param {Object} context.getters the getters
     * @return {void}
     */
    jobStatusChanged ({commit, getters}) {
        commit("setOnJobStatusChange", getters.onJobStatusChange + 1);
    },

    // async fetchEnsembles ({commit, getters, rootGetters}) {
    //     if (!rootGetters["Modules/Login/loggedIn"]) {
    //         return;
    //     }

    //     commit("setEnsemblesLoading", true);

    //     try {
    //         const response = await fetch(
    //             `${getters.simulationApiUrl}/ensembles/`,
    //             {
    //                 headers: {
    //                     "content-type": "application/json",
    //                     Authorization: `Bearer ${rootGetters["Modules/Login/accessToken"]}`
    //                 }
    //             }).then((res) => res.json());

    //         // TODO: this might changed in the backend
    //         commit("setEnsembles", response);
    //     }
    //     catch (error) {
    //         console.error(error);
    //     }
    //     finally {
    //         commit("setEnsemblesLoading", false);
    //     }

    // }

    // async deleteEnsembleById ({commit, rootGetters}, ensembleId) {
    //     if (!rootGetters["Modules/Login/loggedIn"]) {
    //         return;
    //     }

    //     commit("setEnsemblesLoading", true);

    //     try {
    //         const response = await fetch(`${Config.simulationApiUrl}/ensembles/${ensembleId}`, {
    //             method: "DELETE",
    //             headers: {
    //                 "Content-Type": "application/json",
    //                 Authorization: `Bearer ${rootGetters["Modules/Login/accessToken"]}`
    //             }
    //         });

    //         if (!response.ok) {
    //             throw new Error("Failed to delete ensemble");
    //         }

    //         console.log(`Ensemble ${ensembleId} successfully deleted.`);
    //     }
    //     catch (error) {
    //         console.error(error);
    //     }
    //     finally {
    //         commit("setEnsemblesLoading", false);
    //     }
    // },

    // async fetchUserDetails ({state, commit, rootGetters}, user_id) {
    //     if (!rootGetters["Modules/Login/loggedIn"]) {
    //         return null;
    //     }

    //     if (state.userDetailsCache[user_id]) {
    //         return state.userDetailsCache[user_id];
    //     }

    //     const fetchPromise = (async () => {
    //         const accessToken = rootGetters["Modules/Login/accessToken"],
    //             response = await fetch(`${Config.simulationApiUrl}/users/${user_id}/details`, {
    //                 headers: {
    //                     "Content-Type": "application/json",
    //                     Authorization: `Bearer ${accessToken}`
    //                 }
    //             }),
    //             result = await response.json();

    //         if (!response.ok) {
    //             throw new Error(result);
    //         }

    //         commit("setUserDetailsCache", {
    //             ...state.userDetailsCache,
    //             [user_id]: result
    //         });
    //         return result;
    //     })();

    //     commit("setUserDetailsCache", {
    //         ...state.userDetailsCache,
    //         [user_id]: fetchPromise
    //     });

    //     return fetchPromise;
    // }

    /**
     * Parses the file content into planning scenarios.
     * @param {Object} param.commit the commit
     * @param {Object} param.getters the getters
     * @param {Object} param.dispatch the dispatch
     * @param {String} content the imported file content.
     * @returns {void}
     */
    async parseScenarioFromImport ({commit, getters, dispatch}, content) {
        if (typeof content !== "string") {
            return;
        }

        const parsedContent = JSON.parse(content);

        for (const val of parsedContent) {
            const isValid = await dispatch("isFormatValid", val);

            if (isValid) {
                if (!getters.planningScenarios.some(scenario => scenario.id === val.id)) {
                    commit("setPlanningScenarios", [...getters.planningScenarios, val]);
                    if (getters.currentPlanningScenarioId === val.id) {
                        commit("setCurrentPlanningScenarioId", "");
                    }
                    dispatch("Alerting/addSingleAlert", {
                        category: "info",
                        content: i18next.t("additional:modules.tools.simulationTool.planningScenarioImported", {id: val.id, name: val.name})
                    }, {root: true});
                }
                else {
                    dispatch("Alerting/addSingleAlert", {
                        category: "warning",
                        content: i18next.t("additional:modules.tools.simulationTool.planningScenarioAlreadyExisted", {id: val.id, name: val.name})
                    }, {root: true});
                }
            }
        }
    },

    /**
     * Updates the layer with the scenario features.
     * @param {Object} param.getters the getters.
     * @returns {void}
     */
    updateFeatures ({getters}) {
        const currentPlanningScenario = getters.planningScenarios.find(scenario => scenario.id === getters.currentPlanningScenarioId),
            geoJsonParser = new GeoJSON(),
            styleConfig = getters.infrastructurePointStyle,
            map = mapCollection.getMap("2D");

        // Ensure planning-scenario layer exists
        let planningScenarioLayer = layerCollection.getLayerById("planning-scenario");

        if (!planningScenarioLayer) {
            const layer = layerFactory.createLayer({
                typ: "VECTORBASE",
                id: "planning-scenario",
                name: "planning-scenario",
                alwaysOnTop: true
            });

            // Set Z-Index to ensure proper layering:
            // 9999999: Agent WebGL Layer (highest - animated agents)
            // 9999998: Agent Trail Layer (trails/paths)
            // 9999997: Infrastructure Layer (buildings, roads, stations)
            // 9999996: Planning Scenario Layer (scenario area, start/end points)
            layer.layer.setZIndex(9999996);

            layerCollection.addLayer(layer);
            planningScenarioLayer = layer;
        }
        else {
            // Layer exists, ensure correct Z-Index
            planningScenarioLayer.layer.setZIndex(9999996);
        }

        const layerSource = planningScenarioLayer.getLayerSource();

        // Ensure infrastructure layer exists
        if (!layerCollection.getLayerById(infrastructureLayerId)) {
            const layer = layerFactory.createLayer({
                typ: "VECTORBASE",
                id: infrastructureLayerId,
                name: infrastructureLayerId
            });

            // Set Z-Index to ensure proper layering:
            // 9999999: Agent WebGL Layer (highest - animated agents)
            // 9999998: Agent Trail Layer (trails/paths)
            // 9999997: Infrastructure Layer (buildings, roads, stations)
            // 9999996: Planning Scenario Layer (scenario area, start/end points)
            layer.layer.setZIndex(9999997);

            layerCollection.addLayer(layer);
        }
        const layerSourceForObjects = layerCollection.getLayerById(infrastructureLayerId).getLayerSource(),

            // Only clear if we don't have the correct scenario already loaded
            // Check if features are from the current scenario by comparing feature count and scenario ID
            existingFeatures = layerSource.getFeatures(),
            needsUpdate = existingFeatures.length === 0 ||
                           !existingFeatures.some(f => f.get("scenarioId") === currentPlanningScenario?.id);

        if (needsUpdate) {
            layerSource.clear();
            layerSourceForObjects.clear(true);
        }
        else {
            return; // Features already present for this scenario, no need to reload
        }

        if (!currentPlanningScenario) {
            return;
        }

        // Render scenarioFeature if available
        if (currentPlanningScenario.scenarioFeature && currentPlanningScenario.scenarioFeature.features) {
            currentPlanningScenario.scenarioFeature.features.forEach((feat) => {
                try {
                    // Parse feature with correct coordinate system
                    const olFeature = geoJsonParser.readFeature(feat, {
                        dataProjection: "EPSG:25832",
                        featureProjection: "EPSG:25832"
                    });

                    if (feat.style) {
                        const olStyle = ConvertStyle.geoJsonToOpenlayers(feat.style);

                        olFeature.setStyle(olStyle);
                    }

                    // Mark feature with scenario ID for caching/persistence
                    olFeature.set("scenarioId", currentPlanningScenario.id);

                    layerSource.addFeature(olFeature);
                }
                catch (error) {
                    console.error("Error processing scenarioFeature:", error);
                }
            });
        }

        // Add all input features to the layer
        if (currentPlanningScenario.inputs && isObject(currentPlanningScenario.inputs)) {
            Object.entries(currentPlanningScenario.inputs).forEach(([inputKey, inputValue]) => {
                // Special handling for cycleTravelerLayer - it's a FeatureCollection with features that have nested structures
                if (inputKey === "cycleTravelerLayer" && inputValue?.type === "FeatureCollection" && inputValue?.features) {
                    inputValue.features.forEach((feature) => {
                        try {
                            // cycleTravelerLayer features should have direct geometry (Point/Polygon), not FeatureCollection
                            if (feature.geometry && feature.geometry.type === "FeatureCollection") {
                                // This is a nested structure - extract the actual features
                                if (feature.geometry.features && Array.isArray(feature.geometry.features)) {
                                    feature.geometry.features.forEach((innerFeature) => {
                                        try {
                                            // Parse feature - cycleTravelerLayer uses WGS84 (Lon/Lat)
                                            const olFeature = geoJsonParser.readFeature(innerFeature, {
                                                dataProjection: "EPSG:4326",
                                                featureProjection: "EPSG:25832"
                                            });

                                            if (innerFeature.style) {
                                                olFeature.setStyle(ConvertStyle.geoJsonToOpenlayers(innerFeature.style));
                                            }

                                            if (innerFeature.id) {
                                                olFeature.setId(innerFeature.id);
                                            }

                                            layerSource.addFeature(olFeature);
                                        }
                                        catch (innerError) {
                                            console.error("Error processing nested feature:", innerError);
                                        }
                                    });
                                }
                                return;
                            }

                            // Normal processing for features with direct geometry
                            // Parse feature - cycleTravelerLayer uses WGS84 (Lon/Lat), needs transformation to map projection
                            const olFeature = geoJsonParser.readFeature(feature, {
                                dataProjection: "EPSG:4326",
                                featureProjection: "EPSG:25832"
                            });

                            // Apply style - create OpenLayers style manually for both Polygon and Point
                            if (feature.style) {
                                // Create style manually to handle both polygon and point styles
                                const Fill = require("ol/style/Fill").default,
                                    Stroke = require("ol/style/Stroke").default,
                                    Style = require("ol/style/Style").default,
                                    Circle = require("ol/style/Circle").default;

                                let olStyle;

                                // Check if this is a point style with circle
                                if (feature.style.type === "point" && feature.style.circle) {
                                    olStyle = new Style({
                                        image: new Circle({
                                            radius: feature.style.circle.radius || 8,
                                            fill: feature.style.circle.fill ? new Fill({
                                                color: feature.style.circle.fill.color
                                            }) : null,
                                            stroke: feature.style.circle.stroke ? new Stroke({
                                                color: feature.style.circle.stroke.color,
                                                width: feature.style.circle.stroke.width || 2
                                            }) : null
                                        })
                                    });
                                }
                                else {
                                    // Polygon style
                                    olStyle = new Style({
                                        fill: feature.style.fill ? new Fill({
                                            color: feature.style.fill.color || "rgba(255, 165, 0, 0.3)"
                                        }) : null,
                                        stroke: feature.style.stroke ? new Stroke({
                                            color: feature.style.stroke.color || "rgba(255, 140, 0, 0.8)",
                                            width: feature.style.stroke.width || 2
                                        }) : null
                                    });
                                }

                                olFeature.setStyle(olStyle);
                            }

                            if (feature.id) {
                                olFeature.setId(feature.id);
                            }

                            // Mark feature with scenario ID for caching/persistence
                            olFeature.set("scenarioId", currentPlanningScenario.id);

                            layerSource.addFeature(olFeature);
                        }
                        catch (error) {
                            console.error("Error reading cycleTravelerLayer feature:", error);
                        }
                    });
                    return; // Skip normal processing for cycleTravelerLayer
                }

                if (inputValue?.features && Array.isArray(inputValue.features)) {
                    inputValue.features.forEach((feature) => {
                        try {
                            // Check if geometry is a FeatureCollection (invalid structure)
                            if (feature.geometry && feature.geometry.type === "FeatureCollection") {
                                return;
                            }

                            // Check if feature has valid geometry
                            if (!feature.geometry || !feature.geometry.type) {
                                return;
                            }

                            // Parse feature with correct coordinate system
                            const olFeature = geoJsonParser.readFeature(feature, {
                                    dataProjection: "EPSG:25832",
                                    featureProjection: "EPSG:25832"
                                }),
                                style = createInfrastructureStyle(olFeature, styleConfig);

                            // Apply style if present (especially for cycleTravelerLayer)
                            if (style) {
                                olFeature.setStyle(style);
                            }

                            // Set feature ID for later lookup/duplicate prevention
                            if (feature.id) {
                                olFeature.setId(feature.id);
                            }

                            // Mark feature with scenario ID for caching/persistence
                            olFeature.set("scenarioId", currentPlanningScenario.id);

                            // Add cycleTravelerLayer features to planning-scenario layer (for better visibility)
                            if (inputKey === "cycleTravelerLayer" && layerSource) {
                                layerSource.addFeature(olFeature);
                            }
                            else {
                                layerSourceForObjects.addFeature(olFeature);
                            }
                        }
                        catch (error) {
                            console.error("Error reading feature:", error);
                        }
                    });
                }
                else if (inputKey !== "crs" && inputKey !== "cycleTravelerLayer") {
                    // Don't warn for crs (not a feature collection) or cycleTravelerLayer (might not exist yet)
                    console.warn(`[SimulationTool] No features present for input '${inputKey}' in scenario id=${currentPlanningScenario.id}, dataSourceId=${currentPlanningScenario.dataSourceId}`);
                }
            });
        }

        // Auto-zoom to features after loading
        if (layerSource && layerSource.getFeatures().length > 0) {
            const extent = layerSource.getExtent();

            if (map) {
                map.getView().fit(extent, {
                    padding: [100, 100, 100, 100],
                    duration: 500,
                    maxZoom: 15
                });
            }
        }
    },

    /**
     * Zooms to the features.
     * @param {Object} param.dispatch the dispatch.
     * @param {Object} param.getters the getters.
     * @returns {void}.
     */
    zoomToFeature ({dispatch, getters}) {
        const currentPlanningScenario = getters.planningScenarios.find(scenario => scenario.id === getters.currentPlanningScenarioId),
            olFeatures = currentPlanningScenario ? new GeoJSON().readFeatures(currentPlanningScenario?.scenarioFeature) : [],
            coordinate = olFeatures.length > 0 ? extractEventCoordinates(olFeatures[0].getGeometry().getExtent()) : null;

        if (coordinate) {
            dispatch("Maps/zoomToExtent", {extent: coordinate, options: {maxZoom: 7}}, {root: true});
        }
    }
};
