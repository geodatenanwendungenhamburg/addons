import calculateRestrictedArea from "../../../js/calculateRestrictedArea";
import {expect} from "chai";

describe("addons/pvObligation/js/calculateRestrictedArea.js", () => {
    it("returns 0 for empty list", () => {
        expect(calculateRestrictedArea([])).to.equal(0);
    });

    it("calculates area3D sum for multiple items with multiple features", () => {
        const items = [
            {
                features: [
                    {values_: {area3D: 10.6}},
                    {values_: {area3D: 5.5}}
                ]
            },
            {
                features: [
                    {values_: {area3D: 10.5}},
                    {values_: {area3D: 5.5}}
                ]
            }
        ];

        expect(calculateRestrictedArea(items)).to.equal(32.1);
    });
});
