import {expect} from "chai";
import sinon from "sinon";
import actions from "../../../store/actionsSupersetDashboard.js";

describe("addons/supersetDashboard/store/actionsSupersetDashboard", () => {
    let originalFetch, store;

    beforeEach(() => {
        originalFetch = globalThis.fetch;
        store = {appBackendDomain: "https://backend.example.org/", dashboardUuid: "a b"};
    });

    afterEach(() => {
        globalThis.fetch = originalFetch;
        sinon.restore();
    });

    /**
     * Calls the action with the test store as `this`.
     * @returns {Promise<String>} the token
     */
    function run () {
        return actions.fetchGuestTokenFromBackend.call(store);
    }

    /**
     * Stubs fetch with a response.
     * @param {Object} response the response mock
     * @returns {sinon.SinonStub} the stub
     */
    function stubFetch (response) {
        globalThis.fetch = sinon.stub().resolves(response);
        return globalThis.fetch;
    }

    it("positive: returns the token and builds a clean url", async () => {
        const fetchStub = stubFetch({ok: true, json: async () => ({token: "abc"})});

        expect(await run()).to.equal("abc");
        expect(fetchStub.firstCall.args[0]).to.equal("https://backend.example.org/api/v1/guesttoken?uuid=a%20b");
    });

    it("negative: throws if the configuration is missing", async () => {
        store.dashboardUuid = "";
        let error = null;

        try {
            await run();
        }
        catch (e) {
            error = e;
        }
        expect(error.message).to.contain("missing");
    });

    it("negative: throws with the status for a non-ok response", async () => {
        stubFetch({ok: false, status: 403});
        let error = null;

        try {
            await run();
        }
        catch (e) {
            error = e;
        }
        expect(error.message).to.contain("403");
    });

    it("negative: includes the message if the response contains no token", async () => {
        stubFetch({ok: true, json: async () => ({message: "wrong parameter"})});
        let error = null;

        try {
            await run();
        }
        catch (e) {
            error = e;
        }
        expect(error.message).to.contain("wrong parameter");
    });
});
