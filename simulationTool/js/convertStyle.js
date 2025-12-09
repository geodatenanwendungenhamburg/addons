import {Circle, Fill, Stroke, Style} from "ol/style.js";
import isObject from "../../../src/shared/js/utils/isObject";

/**
 * Converts GeoJSON style to OpenLayers style.
 * @param {Object} style - The GeoJSON style.
 * @returns {ol/Style} The OpenLayers style.
 */
function geoJsonToOpenlayers (style) {
    if (!isObject(style)) {
        return undefined;
    }

    if (style.fillTransparency) {
        const fillOpacity = 1 - (style.fillTransparency / 100),
            fillColorRgba = [...style.fillColor, fillOpacity];

        style.fillColor = fillColorRgba;
    }

    const styleConfig = {};

    // Add fill if present
    if (style.fillColor) {
        styleConfig.fill = new Fill({
            color: style.fillColor
        });
    }

    // Add stroke if present
    if (style.strokeColor !== undefined) {
        styleConfig.stroke = new Stroke({
            color: style.strokeColor,
            width: style.strokeWidth,
            lineDash: style.strokeLineDash
        });
    }

    // Add point/image style if present
    if (style.pointRadius !== undefined) {
        styleConfig.image = new Circle({
            radius: style.pointRadius,
            fill: new Fill({
                color: style.fillColor
            }),
            stroke: style.strokeColor ? new Stroke({
                color: style.strokeColor,
                width: style.strokeWidth || 1
            }) : undefined
        });
    }

    return new Style(styleConfig);
}

/**
 * Converts OpenLayers style to GeoJSON style.
 * @param {ol/Style} style - The OpenLayers style.
 * @returns {Object} The GeoJSON style.
 */
function openlayersToGeoJson (style) {
    const result = {
        fillColor: style?.getFill()?.getColor()
    };

    // Only add stroke properties if stroke exists (e.g., not for points with only image style)
    if (style.getStroke()) {
        result.strokeColor = style.getStroke().getColor();
        result.strokeLineDash = style.getStroke().getLineDash();
        result.strokeWidth = style.getStroke().getWidth();
    }

    // Add image/point properties if present
    if (style.getImage()) {
        const image = style.getImage();

        if (image.getRadius) {
            result.pointRadius = image.getRadius();
        }
        if (image.getFill) {
            result.fillColor = image.getFill()?.getColor() || result.fillColor;
        }
        if (image.getStroke) {
            const imageStroke = image.getStroke();

            if (imageStroke) {
                result.strokeColor = imageStroke.getColor();
                result.strokeWidth = imageStroke.getWidth();
            }
        }
    }

    return result;
}

export default {
    geoJsonToOpenlayers,
    openlayersToGeoJson
};
