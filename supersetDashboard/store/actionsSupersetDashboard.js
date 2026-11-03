/**
 * The actions for the supersetDashboard.
 * @module addons/supersetDashboard/store/actionsSupersetDashboard
 */
export default {
    /**
     * Requests a guest token for the configured Superset dashboard from the app backend.
     * The token is used by the Superset embedded SDK to authenticate the embedded dashboard.
     * Uses `appBackendDomain` and `dashboardUuid` from the store state.
     *
     * @async
     * @returns {Promise<String>} Resolves with the guest token.
     * @throws {Error} If `appBackendDomain` or `dashboardUuid` is missing, the request fails,
     * the backend responds with a non-OK status, or the response contains no token.
     */
    async fetchGuestTokenFromBackend () {

        if (!this.appBackendDomain || !this.dashboardUuid) {
            throw new Error("supersetDashboard: appBackendDomain or dashboardUuid is missing");
        }

        const url = `${this.appBackendDomain.replace(/\/$/, "")}/api/v1/guesttoken?uuid=${encodeURIComponent(this.dashboardUuid)}`;
        let response = null;

        try {
            response = await fetch(url);
        }
        catch (error) {
            throw new Error(`supersetDashboard: guest token request failed: ${error.message}`);
        }
        if (!response.ok) {
            throw new Error(`supersetDashboard: guest token request returned ${response.status}`);
        }

        const json = await response.json().catch(() => ({}));

        if (typeof json.token !== "string" || !json.token) {
            if (json.message) {
                throw new Error(`supersetDashboard: response contains no token, ${JSON.stringify(json.message)}`);
            }
            else {
                throw new Error("supersetDashboard: response contains no token");
            }
        }
        return json.token;
    }
};
