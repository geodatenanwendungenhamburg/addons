import {expect} from "chai";
import utils from "../../features/getFeatures";
import sinon from "sinon";
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList";
import wfsRequest from "../../../../../src/api/wfs/getFeature";

describe("utils/features/getFeatures/getAllFeaturesByLayerId", () => {

    beforeEach(function () {
        sinon.spy(console, "error");
    });

    afterEach(function () {
        console.error.restore();
        sinon.restore();
    });

    it("should return an empty array if the given parameter 'layerId' is an object", async () => {
        expect(await utils.getAllFeaturesByLayerId({})).to.be.an("array").and.to.be.empty;
    });

    it("should return an empty array if the given parameter 'layerId' is undefined", async () => {
        expect(await utils.getAllFeaturesByLayerId(undefined)).to.be.an("array").and.to.be.empty;
    });

    it("should return an empty array if the given parameter 'layerId' is a boolean", async () => {
        expect(await utils.getAllFeaturesByLayerId(true)).to.be.an("array").and.to.be.empty;
    });

    it("should return an empty array if the given parameter 'layerId' is an array", async () => {
        expect(await utils.getAllFeaturesByLayerId([])).and.to.be.empty;
    });

    it("should return an empty array if the given parameter 'layerId' is null", async () => {
        expect(await utils.getAllFeaturesByLayerId(null)).to.be.an("array").and.to.be.empty;
    });

    it("should return an empty array if the given parameter 'layerId' is a number", async () => {
        expect(await utils.getAllFeaturesByLayerId(666)).to.be.an("array").and.to.be.empty;
    });

    it("should call an error if the given parameter 'layerId' is not a string", async () => {
        await utils.getAllFeaturesByLayerId(666);
        expect(console.error.calledOnce).to.be.true;
    });

    it("should call an error if the layer with the given id was not found", async () => {
        sinon.stub(rawLayerList, "getLayerWhere").returns(null);
        await utils.getAllFeaturesByLayerId("666");
        expect(console.error.calledOnce).to.be.true;
    });

    it("should return an empty array if no layer with the given id was found", async () => {
        sinon.stub(rawLayerList, "getLayerWhere").returns(null);
        expect(await utils.getAllFeaturesByLayerId("666")).to.be.an("array").and.to.be.empty;
    });

    it("should call getFeatures for layer type to get the features if a layer was found", async () => {
        // Stub the OAF getFeatures function
        sinon.stub(wfsRequest, "getFeatureGET").resolves();
        sinon.stub(rawLayerList, "getLayerWhere").returns({id: "666", typ: "WFS"});

        await utils.getAllFeaturesByLayerId("");
        expect(wfsRequest.getFeatureGET.calledOnce).to.be.true;
    });
});
