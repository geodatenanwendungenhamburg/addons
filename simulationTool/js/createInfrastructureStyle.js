import Style from "ol/style/Style";
import Circle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Icon from "ol/style/Icon";

/**
 * Creates a style function for infrastructure layer features.
 * Only Point geometries get a custom style, other geometries use the default OpenLayers style.
 * @param {ol/Feature} feature - The feature to style.
 * @param {Object} [config] - Optional configuration object for the style.
 * @param {String} [config.type="circle"] - Type of style: "circle" or "icon".
 * @param {Object} [config.circle] - Circle style configuration.
 * @param {Number} [config.circle.radius=6] - Radius of the circle.
 * @param {Array<Number>} [config.circle.fillColor=[255, 140, 0, 0.8]] - Fill color as RGBA array.
 * @param {Array<Number>} [config.circle.strokeColor=[255, 140, 0, 1]] - Stroke color as RGBA array.
 * @param {Number} [config.circle.strokeWidth=2] - Stroke width.
 * @param {Object} [config.icon] - Icon style configuration.
 * @param {String} [config.icon.src] - URL or data URI of the icon image.
 * @param {Number} [config.icon.scale=1] - Scale of the icon.
 * @param {Array<Number>} [config.icon.anchor=[0.5, 0.5]] - Anchor point of the icon.
 * @param {String} [config.icon.anchorXUnits="fraction"] - Units for anchor X coordinate.
 * @param {String} [config.icon.anchorYUnits="fraction"] - Units for anchor Y coordinate.
 * @returns {ol/style/Style|null} The style for the feature or null for default style.
 */
export default function createInfrastructureStyle (feature, config = {}) {
    const geometryType = feature.getGeometry()?.getType();

    if (geometryType === "Point") {
        const {
            type = "circle",
            circle = {
                radius: 6,
                fillColor: [255, 140, 0, 0.8],
                strokeColor: [255, 140, 0, 1],
                strokeWidth: 2
            },
            icon = {
                src: null,
                scale: 1,
                anchor: [0.5, 0.5],
                anchorXUnits: "fraction",
                anchorYUnits: "fraction"
            }
        } = config;

        if (type === "icon" && icon.src) {
            return new Style({
                image: new Icon({
                    src: icon.src,
                    scale: icon.scale,
                    anchor: icon.anchor,
                    anchorXUnits: icon.anchorXUnits,
                    anchorYUnits: icon.anchorYUnits
                })
            });
        }

        // Default to circle style
        return new Style({
            image: new Circle({
                radius: circle.radius,
                fill: new Fill({
                    color: circle.fillColor
                }),
                stroke: new Stroke({
                    color: circle.strokeColor,
                    width: circle.strokeWidth
                })
            })
        });
    }

    // Return null for LineString and Polygon to use default OpenLayers style
    return null;
}
