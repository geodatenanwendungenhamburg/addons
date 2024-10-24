const baseProportionTemplate = {
        baseLayer: {
            map: {
                type: "mapProportion",
                proportion: 0.6,
                style: {
                    borderSize: 2,
                    color: [
                        228,
                        26,
                        28,
                        1
                    ]
                },
                layerIds: [
                    "717",
                    "718",
                    "719",
                    "720",
                    "13712",
                    "13709",
                    "13714",
                    "13716"
                ]
            }
        }
    },
    baseFixedTemplateForHamburg = {
        uebersichtskarte: {
            map: {
                type: "mapFixed",
                bbox: [545114.80, 5914269.80, 591483.01, 5957132.28],
                layerIds: [
                    "717",
                    "718",
                    "719",
                    "720",
                    "13712",
                    "13709",
                    "13714",
                    "13716"
                ]
            }
        }
    },
    mapfishServerConfig = {
        template: "cosiImage",
        name: "mapfish_qs"
    };

export {
    baseProportionTemplate,
    baseFixedTemplateForHamburg,
    mapfishServerConfig
};
