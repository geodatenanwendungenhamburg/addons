
import {getFeatureInfos} from "../../../service/getFeatureInfo";
import {expect} from "chai";
import {initializeLayerList} from "../../../../utils/initializeLayerList";
import {registerProjections} from "@masterportal/masterportalapi/src/crs";

describe.skip("getFeatureInfos", () => {
    before(async function () {
        await initializeLayerList();
        registerProjections();
    });

    it.skip("should return one feature info", async () => {
        const featureInfos = await getFeatureInfos("https://geodienste.hamburg.de/HH_WMS_Strassenverkehr",
            "strassenverkehr_tag_abend_nacht_2017",
            [564310.8970702873, 5937870.667724043],
            "EPSG:25832", 26, 1);

        expect(featureInfos).to.have.lengthOf(1);
        expect(featureInfos[0].getProperties().klasse).to.be.equal("> 55 - 60 dB(A)");
    });

    it.skip("should return several feature info", async () => {
        const featureInfos = await getFeatureInfos("https://geodienste.hamburg.de/HH_WMS_Strassenverkehr",
            "strassenverkehr_tag_abend_nacht_2017",
            [564310.8970702873, 5937870.667724043],
            "EPSG:25832", 26, 1000);

        expect(featureInfos).to.have.lengthOf(50);
    });

    it.skip("should return no feature info", async () => {
        const featureInfos = await getFeatureInfos("https://geodienste.hamburg.de/HH_WMS_Strassenverkehr",
            "strassenverkehr_tag_abend_nacht_2017",
            [564310.8970702873 + 10.208, 5937870.667724043],
            "EPSG:25832", 0.00001, 1000);

        expect(featureInfos).to.have.lengthOf(0);
    });
});
