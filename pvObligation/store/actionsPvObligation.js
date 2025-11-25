
import GeoJSON from "ol/format/GeoJSON";
import dissolve from "@turf/dissolve";
import {featureCollection} from "@turf/helpers";
import {transform} from "ol/proj";

/* eslint-disable one-var */
import pdfMake from "pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import {getFooterSvg} from "../js/getSvg";
import dayjs from "dayjs";
import thousandsSeparator from "@shared/js/utils/thousandsSeparator";

export default {
    /**
     *
     *  This function converts data from reportTemplates to pdf
     * @param {Object} _ vuex context
     * @param {Object} formData data from the pv obligation analysis that shall be added to the pdf export
     * @param {String} formData.author - Name of the report creator, e.g. "Christa Becker".
     * @param {Number} formData.brutto - Gross roof area in m².
     * @param {Number} formData.netto - Net roof area in m².
     * @param {Number} formData.pvObligation - Mandatory PV area in m².
     * @param {Number} formData.restrictedAreaSum - Sum of restricted areas in m².
     * @param {Number} formData.finalPVArea - Final area to be used with PV in m².
     * @param {Array<Object>} formData.nettoReduceAreas - Areas subtracted from the net roof area.
     * @param {Number} formData.nettoReduceAreas[].id - ID of the reduced area.
     * @param {String} formData.nettoReduceAreas[].description - Description of the reduced area.
     * @param {Array<Object>} formData.restrictedAreas - Areas with restrictions.
     * @param {Number} formData.restrictedAreas[].id - ID of the restricted area.
     * @param {String} formData.restrictedAreas[].description - Description of the restriction.
     * @param {Object} formData.personalData - Personal data of the owner.
     * @param {String} formData.personalData.propertyOwnerFullName - Name of the owner.
     * @param {String} formData.personalData.street - street of the building.
     * @param {String} formData.personalData.houseNumber - house number of the building.
     * @param {String} formData.personalData.postalCode - postalcode of the building.
     * @param {String} formData.personalData.city - city of the building.
     * @param {String} formData.additionalInformation - Additional optional information.
     * @returns {void}
     *
     */
    async exportPDF ({dispatch, commit}, formData) {
        commit("setIsCreatingReport", true);

        const docDefinition = {
                content: [],
                pageOrientation: "portrait",
                pageSize: "A4",
                pageMargins: [40, 60, 40, 60],
                borderColor: ["#cdcdcd", "#cdcdcd", "#cdcdcd", "#cdcdcd"]
            },
            mapContent = await dispatch("addMap"),
            idealMapWidthInPDF = mapContent.width > mapContent.height ? 450 : 300,
            exportDate = dayjs(new Date()).format("DD-MM-YYYY");

        // Header
        // /////////////////////
        docDefinition.header = {
            text: i18next.t("additional:modules.pvObligation.report.headerText"),
            alignment: "right",
            fontSize: 11,
            margin: [0, 20, 40, 40],
            color: "#646464"
        };

        // Titel
        // /////////////////////
        docDefinition.content.push({
            text: i18next.t("additional:modules.pvObligation.report.title"),
            style: "header",
            bold: true,
            fontSize: 14,
            margin: [0, 14]
        });

        // data for the building
        // /////////////////////
        docDefinition.content.push({
            text: i18next.t("additional:modules.pvObligation.report.buildingData.title"),
            bold: true,
            fontSize: 12,
            margin: [0, 20, 0, 10]
        });

        const personalData = [];

        personalData.push([i18next.t("additional:modules.pvObligation.report.buildingData.owner"), formData.personalData.propertyOwnerFullName]);
        personalData.push([i18next.t("additional:modules.pvObligation.report.buildingData.address"), formData.personalData.street + " " + formData.personalData.houseNumber]);
        personalData.push(["", formData.personalData.postalCode + " " + formData.personalData.city]);

        docDefinition.content.push({
            layout: "noBorders",
            table: {
                body: personalData
            }
        });

        // Areas (brutto, netto, obligation)
        // /////////////////////
        docDefinition.content.push(
            {
                layout: "lightHorizontalLines",
                table: {
                    widths: ["*", "auto"],
                    body: [
                        ["", ""],
                        [
                            i18next.t("additional:modules.pvObligation.report.areas.gros"),
                            {
                                text: thousandsSeparator(parseFloat(formData.brutto, 10).toFixed(1)) + " m²",
                                alignment: "right",
                                noWrap: true
                            }
                        ],
                        [
                            i18next.t("additional:modules.pvObligation.report.areas.net"),
                            {
                                text: thousandsSeparator(parseFloat(formData.netto, 10).toFixed(1)) + " m²",
                                alignment: "right",
                                noWrap: true
                            }
                        ],
                        [
                            i18next.t("additional:modules.pvObligation.report.areas.pvObligation"),
                            {
                                text: thousandsSeparator(parseFloat(formData.pvObligation, 10).toFixed(1)) + " m²",
                                alignment: "right",
                                noWrap: true
                            }
                        ]
                    ]
                },
                margin: [0, 20, 0, 10]
            }
        );

        // netto reducing areas
        // /////////////////////
        const netReduceAreasData = await dispatch("addDrawnAreaTable", {
            drawnAreaData: formData.nettoReduceAreas,
            title: i18next.t("additional:modules.pvObligation.report.areas.netReduce"),
            noAreasTitle: i18next.t("additional:modules.pvObligation.report.areas.noNetReduce")
        });

        docDefinition.content.push(netReduceAreasData);

        // restricted areas
        // /////////////////////
        const restrictedAreasData = await dispatch("addDrawnAreaTable", {
            drawnAreaData: formData.restrictedAreas,
            title: i18next.t("additional:modules.pvObligation.report.areas.restrictedAreas"),
            noAreasTitle: i18next.t("additional:modules.pvObligation.report.areas.noRestrictedAreas")
        });

        docDefinition.content.push(restrictedAreasData);

        // Additional information
        // /////////////////////
        docDefinition.content.push({
            text: i18next.t("additional:modules.pvObligation.report.furtherInformation"),
            bold: true,
            fontSize: 12,
            margin: [0, 20, 0, 10]
        });

        if (formData.additionalInformation.length > 0) {
            docDefinition.content.push({
                text: formData.additionalInformation,
                margin: [0, 0, 0, 10]
            });
        }
        else {
            docDefinition.content.push({
                text: i18next.t("additional:modules.pvObligation.report.noFurtherInformation"),
                italics: true,
                margin: [0, 0, 0, 10]
            });
        }

        // Map
        // /////////////////////
        docDefinition.content.push({
            image: mapContent.base64Image,
            width: idealMapWidthInPDF,
            alignment: "center",
            pageBreak: "before"
        });

        /* currently the map is not in scale, therefore comment this out, as long as it is fixed
        docDefinition.content.push({
            text: i18next.t("additional:modules.pvObligation.report.scale") + " 1:" + thousandsSeparator(mapContent.scale),
            fontSize: 8,
            alignment: "center",
            margin: [0, 5]
        });*/

        // Footer
        // /////////////////////
        docDefinition.footer = (currentPage, pageCount) => {
            return getFooterSvg(currentPage, pageCount, formData.author, i18next.t("additional:modules.pvObligation.report.createdWith"));
        };

        // Here we call the pdfMake function to render pdf from the docDefinition
        try {
            const fileName = `${i18next.t("additional:modules.pvObligation.report.fileNamePrefix")}${exportDate}.pdf`;

            await new Promise((resolve, reject) => {
                try {
                    pdfMake.createPdf(docDefinition, "", "", pdfFonts).download(fileName, () => {
                        setTimeout(() => {
                            resolve();
                        }, 2000);
                    });
                }
                catch (error) {
                    reject(error);
                }
            });
        }
        catch (error) {
            console.error("PDF Erstellung fehlgeschlagen:", error);
        }
        finally {
            commit("setIsCreatingReport", false);
        }
    },
    /**
     * Crops the main map canvas by removing the left and right menu widths,
     * draws a 2px black border around the cropped area, and returns the result as a base64 image.
     *
     * @returns {Object} An object containing:
     *   {string} base64Image - The base64-encoded PNG image of the cropped map.
     *   {number} width - The width of the cropped image in pixels.
     *   {number} height - The height of the cropped image in pixels.
     */
    addMap ({rootGetters}) {
        const map = mapCollection.getMap("2D"),
            canvas = map.getViewport().querySelector("canvas"),
            rigthMenuWidth = document.getElementById("mp-menu-secondaryMenu").offsetWidth,
            leftMenuWidth = document.getElementById("mp-menu-mainMenu").offsetWidth,
            cropWidth = canvas.width - leftMenuWidth - rigthMenuWidth,
            cropHeight = canvas.height,
            offscreenCanvas = document.createElement("canvas");

        offscreenCanvas.width = cropWidth;
        offscreenCanvas.height = cropHeight;

        const ctx = offscreenCanvas.getContext("2d");

        // Copy the visible canvas part
        ctx.drawImage(
            canvas,
            leftMenuWidth, 0, // startpoint of the origiinal map canvas
            cropWidth, cropHeight, // size of the visible part of the map
            0, 0, // startpoint of the new (cropped) canvas
            cropWidth, cropHeight // size of the new (cropped) canvas
        );

        // 2px black border around the canvas
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, cropWidth - 2, cropHeight - 2);

        return {
            base64Image: offscreenCanvas.toDataURL("image/png"),
            width: cropWidth,
            height: cropHeight,
            scale: rootGetters["Maps/scale"]
        };
    },
    // eslint-disable-next-line no-unused-vars
    async addDrawnAreaTable ({_}, payload) {
        const content = [];

        if (payload.drawnAreaData.length > 0) {
            content.push({
                text: payload.title,
                bold: true,
                fontSize: 12,
                margin: [0, 20, 0, 10]
            });

            const restrictedAreas = [
                [
                    i18next.t("additional:modules.pvObligation.report.areas.areaListNr"),
                    i18next.t("additional:modules.pvObligation.report.areas.areaListDescr")
                ]
            ];

            payload.drawnAreaData.forEach((area) => {
                restrictedAreas.push([area.id, area.description]);
            });

            content.push({
                layout: "lightHorizontalLines",
                table: {
                    // headers are automatically repeated if the table spans over multiple pages
                    // you can declare how many rows should be treated as headers
                    headerRows: 1,
                    widths: [100, "auto"],
                    body: restrictedAreas
                }
            });
        }
        else {
            content.push({
                text: payload.noAreasTitle,
                italics: true,
                margin: [0, 0, 0, 10]
            });
        }

        return content;
    },
    /**
     * Dissolves roof features with the same roofId from a given layer, calculates the total roof area,
     * and adds the dissolved feature(s) to the outlineLayer.
     *
     * - Finds all features in the source layer with the specified roofId.
     * - Calculates the sum of the "dachfl_3d" property for these features.
     * - Dissolves overlapping polygons using Turf.js.
     * - Adds the dissolved feature(s) to the outlineLayer's source.
     *
     * @param {Object} _ - Vuex context (unused).
     * @param {Object} payload - The payload containing required parameters.
     * @param {string|number} payload.roofId - The ID of the roof to dissolve features for.
     * @param {ol.layer.Vector} payload.outlineLayer - The OpenLayers vector layer to add dissolved features to.
     * @param {string} payload.layerName - The name of the source layer containing roof features.
     * @returns {number} The total calculated roof area (sum of "dachfl_3d" property).
     */
    dissolveRoofFeaturesAndCalculateArea (_, payload) {
        const {roofId, outlineLayer, layerName} = payload,
            geojsonFeatures = [], // turf requires array of geojson features
            sourceLayer = mapCollection.getMap("2D") ? mapCollection.getMap("2D").getLayers().getArray().find(layer => layer.get("name") === layerName) : undefined,
            source = sourceLayer ? sourceLayer.getSource() : null,
            allFeatures = source ? source.getFeatures() : [],
            sameRoofFeatures = allFeatures.filter(feature => roofId && feature.get("gebaeude_id") === roofId),
            format = new GeoJSON(),
            olSource = outlineLayer.getSource();

        let roofArea = 0;

        sameRoofFeatures.forEach(feature => {
            const geometry = feature.getGeometry();

            roofArea += parseFloat(feature.get("dachfl_3d")) || 0;

            if (geometry.getType() === "MultiPolygon") {
                // Split MultiPolygon into Polygons as this is required by turf.dissolve
                geometry.getPolygons().forEach(polygon => {
                    const polyFeature = feature.clone();

                    polyFeature.setGeometry(polygon.clone());
                    geojsonFeatures.push(format.writeFeatureObject(polyFeature));
                });
            }
            else if (geometry.getType() === "Polygon") {
                const polyFeature = feature.clone();

                polyFeature.setGeometry(feature.getGeometry().clone());
                geojsonFeatures.push(format.writeFeatureObject(polyFeature));
            }
        });

        olSource.clear();

        if (geojsonFeatures.length > 0) {
            const features = featureCollection(geojsonFeatures),
                dissolvedFeatureGeoJson = dissolve(features);

            dissolvedFeatureGeoJson.features.forEach(feature => {
                const dissolvedFeature = format.readFeature(feature);

                olSource.addFeature(dissolvedFeature);
            });
        }

        return roofArea;
    },
    /**
     * Reverse geocodes the last map click coordinate and returns address components.
     *
     * Uses the configured reverse geocoding service (state.geosearchReverseServiceId) and the
     * Maps/clickCoordinate and Maps/projection root getters to build the request.
     *
     * @async
     * @param {Object} Object Vuex context
     * @returns {Promise<Object>} Resolves with an address object containing:
     *  {string|null} street
     *  {string|null} city
     *  {string|null} postalCode
     *  {string|null} houseNumber
     */
    async getAddress ({state, rootGetters}) {
        const address = {
                street: null,
                city: null,
                postalCode: null,
                houseNumber: null
            },
            clickCoordinate = rootGetters["Maps/clickCoordinate"],
            projectionCode = rootGetters["Maps/projectionCode"],
            coordinates = transform(
                [clickCoordinate[0], clickCoordinate[1]],
                projectionCode,
                "EPSG:4326"
            ),
            serviceUrl = rootGetters.restServiceById(state.geosearchReverseServiceId).url,
            requestUrl = new URL(serviceUrl, state.baseUrl);

        requestUrl.searchParams.set("lon", String(coordinates[0]));
        requestUrl.searchParams.set("lat", String(coordinates[1]));
        requestUrl.searchParams.set("count", "1");
        requestUrl.searchParams.set("properties", ["haus", "ort", "plz", "strasse"]);

        try {
            const response = await fetch(requestUrl),
                data = await response.json();

            if (data) {
                const properties = data.features[0].properties;

                address.city = properties.ort;
                address.postalCode = properties.plz;
                address.street = properties.strasse;
                address.houseNumber = properties.haus;
            }
        }
        catch (error) {
            console.error("Reverse geocoding error:", error);
        }

        return address;
    }
};
