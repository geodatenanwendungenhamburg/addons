import Style from "ol/style/Style";
import Circle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";

/**
 * Creates a style function for infrastructure layer features.
 * Only Point geometries get a custom style, other geometries use the default OpenLayers style.
 * @param {ol/Feature} feature - The feature to style.
 * @returns {ol/style/Style|null} The style for the feature or null for default style.
 */
export default function createInfrastructureStyle (feature) {
    const geometryType = feature.getGeometry()?.getType();

    if (geometryType === "Point") {
        return new Style({
            image: new Circle({
                radius: 6,
                fill: new Fill({
                    color: "rgba(255, 140, 0, 0.8)"
                }),
                stroke: new Stroke({
                    color: "rgba(255, 140, 0, 1)",
                    width: 2
                })
            })
        });
    }

    // Return null for LineString and Polygon to use default OpenLayers style
    return null;
}
