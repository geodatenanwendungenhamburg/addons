
import GeoJSON from "ol/format/GeoJSON";
import dissolve from "@turf/dissolve";
import {featureCollection} from "@turf/helpers";

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
     * @param {Array<Object>} formData.netto_reduce_areas - Areas subtracted from the net roof area.
     * @param {Number} formData.netto_reduce_areas[].id - ID of the reduced area.
     * @param {String} formData.netto_reduce_areas[].description - Description of the reduced area.
     * @param {Array<Object>} formData.restricted_areas - Areas with restrictions.
     * @param {Number} formData.restricted_areas[].id - ID of the restricted area.
     * @param {String} formData.restricted_areas[].description - Description of the restriction.
     * @param {Object} formData.personalData - Personal data of the owner.
     * @param {String} formData.personalData.owner - Name of the owner.
     * @param {String} formData.personalData.address - Address of the owner.
     * @param {String} formData.personalData.mail - Email address of the owner.
     * @param {String} formData.personalData.phone - Phone number of the owner.
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
        docDefinition.header = {text: "PV-Pflicht-Report", alignment: "right", fontSize: 11, margin: [0, 20, 40, 40], color: "#646464"};

        // Titel
        docDefinition.content.push(
            {text: "PV-Pflicht-Report", style: "header", bold: true, fontSize: 14, margin: [0, 14]}
        );

        // Map
        docDefinition.content.push({
            image: mapContent.base64Image,
            width: idealMapWidthInPDF,
            alignment: "center"
        });

        docDefinition.content.push({
            text: "Maßstab 1:" + thousandsSeparator(mapContent.scale),
            fontSize: 8,
            alignment: "center",
            margin: [0, 5],
            pageBreak: "after"
        });

        // Areas (brutto, netto, obligation)
        docDefinition.content.push(
            {text: "Ihre ermittelten Flächen", bold: true, fontSize: 12, margin: [0, 10]}
        );
        docDefinition.content.push(
            {
                layout: "lightHorizontalLines", // optional
                table: {
                    // headers are automatically repeated if the table spans over multiple pages
                    // you can declare how many rows should be treated as headers
                    headerRows: 1,
                    widths: ["*", 100, "auto"],
                    body: [
                        ["", "Fläche in m²", "Erläuterung"],
                        ["Bruttodachfläche", thousandsSeparator(parseFloat(formData.brutto, 10).toFixed(1)), "Die gesamte Fläche des Daches"],
                        ["Nettodachfläche", thousandsSeparator(parseFloat(formData.netto, 10).toFixed(1)), "Die ermittelte Nettofläche des Daches"],
                        ["PV-Pflicht-Fläche", thousandsSeparator(parseFloat(formData.pvObligation, 10).toFixed(1)), "30% der Nettodachfläche. Diese Fläche muss mit PV belegt werden."],
                        ["Sperrflächen", thousandsSeparator(parseFloat(formData.restrictedAreaSum, 10).toFixed(1)), "Summe der Sperrflächen"],
                        ["Mit PV zu belegende Fläche", thousandsSeparator(parseFloat(formData.finalPVArea, 10).toFixed(1)), "Final mit PV zu belegende Fläche"]
                    ]
                }}
        );

        // netto reducing areas
        docDefinition.content.push(
            {text: "Diese Flächen reduzieren die Nettodachfläche", bold: true, fontSize: 12, margin: [0, 20, 0, 10]}
        );

        const nettoReducingAreas = [
            ["Flächennr.", "Erläuterung"]
        ];

        formData.netto_reduce_areas.forEach((area) => {
            nettoReducingAreas.push([area.id, area.description]);
        });

        docDefinition.content.push({
            layout: "lightHorizontalLines", // optional
            table: {
                // headers are automatically repeated if the table spans over multiple pages
                // you can declare how many rows should be treated as headers
                headerRows: 1,
                widths: [100, "auto"],
                body: nettoReducingAreas
            }
        });

        // restricted areas
        docDefinition.content.push(
            {text: "Diese Flächen werden als Sperrflächen ausgewiesen", bold: true, fontSize: 12, margin: [0, 20, 0, 10]}
        );

        const restrictedAreas = [
            ["Flächennr.", "Erläuterung"]
        ];

        formData.restricted_areas.forEach((area) => {
            restrictedAreas.push([area.id, area.description]);
        });

        docDefinition.content.push({
            layout: "lightHorizontalLines", // optional
            table: {
                // headers are automatically repeated if the table spans over multiple pages
                // you can declare how many rows should be treated as headers
                headerRows: 1,
                widths: [100, "auto"],
                body: restrictedAreas
            }
        });

        // personal data
        docDefinition.content.push(
            {text: "Diese persönlichen Daten haben Sie eingegeben", bold: true, fontSize: 12, margin: [0, 20, 0, 10]}
        );

        const personalData = [
            ["", ""]
        ];

        personalData.push(["Eigentümer", formData.personalData.owner]);
        personalData.push(["Adresse", formData.personalData.address]);
        personalData.push(["e-Mail", formData.personalData.mail]);
        personalData.push(["Telefon", formData.personalData.phone]);

        docDefinition.content.push({
            layout: "lightHorizontalLines", // optional
            table: {
                // headers are automatically repeated if the table spans over multiple pages
                // you can declare how many rows should be treated as headers
                headerRows: 1,
                widths: ["auto", "auto"],
                body: personalData
            }
        });

        // Additional information
        docDefinition.content.push(
            {text: "Weitere Informationen", bold: true, fontSize: 12, margin: [0, 20, 0, 10]}
        );

        docDefinition.content.push(
            {text: formData.additionalInformation, margin: [0, 0, 0, 10]}
        );

        // Footer
        docDefinition.footer = (currentPage, pageCount) => {
            return getFooterSvg(currentPage, pageCount, formData.author, "Erstellt mit dem PV-Pflicht-Tool der BUKEA Hamburg");
        };

        // Here we call the pdfMake function to render pdf from the docDefinition
        pdfMake.createPdf(docDefinition, "", "", pdfFonts).download(`PV-Pflicht-Report-${exportDate}.pdf`, () => {
            setTimeout(() => {
                commit("setIsCreatingReport", false);
            }, 2000);
        });
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
    }

};
