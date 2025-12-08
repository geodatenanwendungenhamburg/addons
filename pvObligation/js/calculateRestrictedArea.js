/**
 * Calculates the sum of area3D of all features in restrictedAreaItems
 *
 * @param {Array} restrictedAreaItems List of restricted area openlayers features
 * @returns {number} sum of area3D of all features in restrictedAreaItems
 */
export default function calculateRestrictedArea (restrictedAreaItems = []) {
    const restrictedAreaSum = restrictedAreaItems?.reduce((total, item) => {
        return total + item.features.reduce((sum, feature) => {
            return sum + feature.values_.area3D;
        }, 0);
    }, 0);

    return Math.round(restrictedAreaSum * 10) / 10;
}
