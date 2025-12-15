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
 * @param {Boolean} [highlighted=false] - Whether the feature is highlighted/selected.
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
 * @param {Object} [config.background] - Background configuration for icons.
 * @param {Boolean} [config.background.enabled=false] - Whether to show background.
 * @param {String} [config.background.shape="circle"] - Shape of background: "circle" or "roundedRect".
 * @param {Array<Number>} [config.background.fillColor=[255, 255, 255, 0.9]] - Background fill color.
 * @param {Array<Number>} [config.background.strokeColor=[0, 0, 0, 1]] - Background stroke color.
 * @param {Number} [config.background.strokeWidth=1] - Background stroke width.
 * @param {Number|Array<Number>} [config.background.padding=12] - Padding around icon.
 * @param {Number} [config.background.radius=8] - Corner radius for roundedRect.
 * @returns {ol/style/Style|Array<ol/style/Style>|null} The style(s) for the feature or null for default style.
 */
export default function createInfrastructureStyle (feature, config = {}, highlighted = false) {
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
                },
                background = {
                    enabled: false,
                    shape: "circle",
                    fillColor: [255, 255, 255, 0.9],
                    strokeColor: [0, 0, 0, 1],
                    strokeWidth: 1,
                    padding: 12,
                    radius: 8
                }
            } = config,
            iconScale = highlighted ? icon.scale * 1.3 : icon.scale,
            circleRadius = highlighted ? circle.radius * 1.5 : circle.radius,
            styles = [];

        if (type === "icon" && icon.src) {
            // Add background if enabled
            if (background.enabled) {
                if (background.shape === "circle") {
                    const padding = Array.isArray(background.padding) ? background.padding[0] : background.padding,
                        bgRadius = highlighted ? padding * 1.3 : padding;

                    styles.push(new Style({
                        image: new Circle({
                            radius: bgRadius,
                            fill: new Fill({
                                color: background.fillColor
                            }),
                            stroke: new Stroke({
                                color: background.strokeColor,
                                width: background.strokeWidth
                            })
                        })
                    }));
                }
                else if (background.shape === "roundedRect") {
                    const width = highlighted ? 40 * 1.3 : 40,
                        height = highlighted ? 40 * 1.3 : 40,
                        canvas = document.createElement("canvas"),
                        ctx = canvas.getContext("2d"),
                        radius = background.radius;

                    canvas.width = width;
                    canvas.height = height;

                    // Draw rounded rectangle
                    ctx.beginPath();
                    ctx.moveTo(radius, 0);
                    ctx.lineTo(width - radius, 0);
                    ctx.quadraticCurveTo(width, 0, width, radius);
                    ctx.lineTo(width, height - radius);
                    ctx.quadraticCurveTo(width, height, width - radius, height);
                    ctx.lineTo(radius, height);
                    ctx.quadraticCurveTo(0, height, 0, height - radius);
                    ctx.lineTo(0, radius);
                    ctx.quadraticCurveTo(0, 0, radius, 0);
                    ctx.closePath();

                    // Fill
                    ctx.fillStyle = `rgba(${background.fillColor[0]}, ${background.fillColor[1]}, ${background.fillColor[2]}, ${background.fillColor[3]})`;
                    ctx.fill();

                    // Stroke
                    // eslint-disable-next-line max-depth
                    if (background.strokeWidth > 0) {
                        ctx.strokeStyle = `rgba(${background.strokeColor[0]}, ${background.strokeColor[1]}, ${background.strokeColor[2]}, ${background.strokeColor[3]})`;
                        ctx.lineWidth = background.strokeWidth;
                        ctx.stroke();
                    }

                    styles.push(new Style({
                        image: new Icon({
                            img: canvas,
                            imgSize: [width, height],
                            anchor: [0.5, 0.5],
                            anchorXUnits: "fraction",
                            anchorYUnits: "fraction"
                        })
                    }));
                }
            }

            // Add main icon on top
            styles.push(new Style({
                image: new Icon({
                    src: icon.src,
                    scale: iconScale,
                    anchor: icon.anchor,
                    anchorXUnits: icon.anchorXUnits,
                    anchorYUnits: icon.anchorYUnits
                })
            }));

            return styles.length === 1 ? styles[0] : styles;
        }

        // Default to circle style

        return new Style({
            image: new Circle({
                radius: circleRadius,
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
