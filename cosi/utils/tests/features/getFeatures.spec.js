import {expect} from "chai";
import {getFeatures, formatBbox} from "../../features/getFeatures";
import sinon from "sinon";
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList";
import wfsRequest from "../../../../../src/api/wfs/getFeature";
import oafRequest from "../../../../../src/api/oaf/getOAFFeature";

describe("utils/features/getFeatures", () => {

    beforeEach(function () {
        sinon.spy(console, "error");
    });

    afterEach(function () {
        console.error.restore();
        sinon.restore();
    });

    describe("formatBbox", () => {
        it("should return an empty string if the given parameter is an object", () => {
            expect(formatBbox({})).to.be.undefined;
        });

        it("should return an empty string if the first parameter is undefined", () => {
            expect(formatBbox(undefined)).to.be.undefined;
        });

        it("should return an empty string if the first parameter is a boolean", () => {
            expect(formatBbox(true)).to.be.undefined;
        });

        it("should return an empty string if the first parameter is a number", () => {
            expect(formatBbox(666)).to.be.undefined;
        });

        it("should return an empty string if the first parameter is a string", () => {
            expect(formatBbox("string")).to.be.undefined;
        });

        it("should return an empty string if the first parameter is an array with a length of != 4", () => {
            expect(formatBbox([6, 6, 6])).to.be.undefined;
        });

        it("should return an empty string if the first parameter is null", () => {
            expect(formatBbox(null)).to.be.undefined;
        });

        it("should return an empty string if the second parameter is an object", () => {
            expect(formatBbox([1, 2, 3, 4], {})).to.be.undefined;
        });

        it("should return an empty string if the second parameter is null", () => {
            expect(formatBbox([1, 2, 3, 4], null)).to.be.undefined;
        });

        it("should return an empty string if the second parameter is a boolean", () => {
            expect(formatBbox([1, 2, 3, 4], true)).to.be.undefined;
        });

        it("should return an empty string if the second parameter is a number", () => {
            expect(formatBbox([1, 2, 3, 4], 666)).to.be.undefined;
        });

        it("should return an empty string if the second parameter is an array", () => {
            expect(formatBbox([1, 2, 3, 4], [])).to.be.undefined;
        });

        it("should return a string with the default 'EPSG:25832' if the second parameter is undefined", () => {
            expect(formatBbox([1, 2, 3, 4], undefined)).to.be.equal("1,2,3,4,EPSG:25832");
        });

        it("should return a correct converted string", () => {
            expect(formatBbox([1, 2, 3, 4], "string")).to.be.equal("1,2,3,4,string");
        });

    });

    describe("getFeatures", () => {
        it("should return an empty array if the given parameter 'layerId' is an object", async () => {
            expect(await getFeatures({})).to.be.an("array").and.to.be.empty;
        });

        it("should return an empty array if the given parameter 'layerId' is undefined", async () => {
            expect(await getFeatures(undefined)).to.be.an("array").and.to.be.empty;
        });

        it("should return an empty array if the given parameter 'layerId' is a boolean", async () => {
            expect(await getFeatures(true)).to.be.an("array").and.to.be.empty;
        });

        it("should return an empty array if the given parameter 'layerId' is an array", async () => {
            expect(await getFeatures([])).and.to.be.empty;
        });

        it("should return an empty array if the given parameter 'layerId' is null", async () => {
            expect(await getFeatures(null)).to.be.an("array").and.to.be.empty;
        });

        it("should return an empty array if the given parameter 'layerId' is a number", async () => {
            expect(await getFeatures(666)).to.be.an("array").and.to.be.empty;
        });

        it("should call an error if the given parameter 'layerId' is not a string", async () => {
            await getFeatures(666);
            expect(console.error.calledOnce).to.be.true;
        });

        it("should call an error if the layer with the given id was not found", async () => {
            sinon.stub(rawLayerList, "getLayerWhere").returns(null);
            await getFeatures("666");
            expect(console.error.calledOnce).to.be.true;
        });

        it("should return an empty array if no layer with the given id was found", async () => {
            sinon.stub(rawLayerList, "getLayerWhere").returns(null);
            expect(await getFeatures("666")).to.be.an("array").and.to.be.empty;
        });

        it("should call getFeatureGET to get the features if a layer of type 'WFS' was found and method not specified", async () => {
            sinon.stub(wfsRequest, "getFeatureGET").returns();
            sinon.stub(rawLayerList, "getLayerWhere").returns({id: "666", typ: "WFS"});
            await getFeatures("");
            expect(wfsRequest.getFeatureGET.calledOnce).to.be.true;
        });

        it("should call getFeatureGET to get the features if a layer of type 'OAF'", async () => {
            sinon.stub(oafRequest, "getOAFFeatureGet").returns([]);
            sinon.stub(rawLayerList, "getLayerWhere").returns({id: "666", typ: "OAF"});
            await getFeatures("");
            expect(oafRequest.getOAFFeatureGet.calledOnce).to.be.true;
        });
    });
});
