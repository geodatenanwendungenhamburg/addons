import axios from "axios";

/**
 * Class representing an OGC API Process.
 * @class OgcApiProcess
*/
export default class OgcApiProcess {

    /**
     * Creates an instance of OgcApiProcess.
     * @constructor
     * @param {string} baseUrl - The base URL of the OGC API. Be sure to include the trailing slash.
     * @param {string} processId - The ID of the process.
    */
    constructor (baseUrl, processId) {
        this.baseUrl = baseUrl;
        this.processId = processId;
    }

    /**
    * Fetches the process description.
    * @param {string} accessToken - The access token for authorization.
    * @throws {Error} If an error occurs while fetching the process description.
    * @returns {Promise<Object|undefined>} The process description or undefined if an error occurs.
    */
    async getDescription (accessToken) {
        try {
            const encodedProcessId = encodeURIComponent(this.processId),
                url = new URL(`processes/${encodedProcessId}`, this.baseUrl),
                response = await axios.get(url, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });

            return response.data;
        }
        catch (error) {
            console.warn("Error fetching process description:", error);
            throw error;
        }
    }

    /**
     * Static method to get the input defaults from the process description.
     * @param {Object} description - The process description.
     * @param {Object} description.inputs - The inputs of the process.
     * @returns {Object} An object containing the default values for the inputs.
    */
    static getInputDefaultsFromDescription (description) {
        const defaultsObject = {};

        if (!description?.inputs) {
            return defaultsObject;
        }

        for (const inputKey in description.inputs) {
            const input = description.inputs[inputKey];

            defaultsObject[inputKey] = OgcApiProcess.getDefaultWithEnum(input);

            if (input.schema?.type === "array") {
                defaultsObject[inputKey] = {
                    items: [],
                    type: input.schema?.items?.type || "string"
                };
            }
            else if (input.schema?.type === "object") {
                if (input.schema.default) {
                    defaultsObject[inputKey] = input.schema.default;
                }
                else {
                    defaultsObject[inputKey] ??= {};
                    for (const propertyKey in input.schema.properties) {
                        const property = input.schema.properties[propertyKey];

                        defaultsObject[inputKey][propertyKey] = OgcApiProcess.getDefaultWithEnum(property);
                    }
                }
            }
        }
        return defaultsObject;
    }
    /**
     * Static method to get the default value from an object with an enum. The enum is necessary to create a dropdown in the UI.
     * @param {Object} obj - The object containing the default value and enum.
     * @returns {Object|undefined} An object containing the default value and the enum array, or undefined if no default is found.
     */
    static getDefaultWithEnum (obj) {
        if (Object.hasOwn(obj, "default")) {
            if (Object.hasOwn(obj, "enum") && Array.isArray(obj.enum)) {
                const enumArr = [...obj.enum],
                    defaultIndex = enumArr.indexOf(obj.default);

                if (defaultIndex !== 0) {
                    if (defaultIndex > -1) {
                        enumArr.splice(defaultIndex, 1);
                    }
                    enumArr.unshift(obj.default);
                }
                return {value: obj.default, enum: enumArr, type: "enum"};
            }
            return obj.default;
        }
        else if (Object.hasOwn(obj, "schema")) {
            if (Object.hasOwn(obj.schema, "enum") && Array.isArray(obj.schema.enum) && obj.schema.enum.length > 0) {
                const defaultValue = obj.schema.default ? obj.schema.default : obj.schema.enum[0];

                return {value: defaultValue, enum: obj.schema.enum, type: "enum"};
            }
            else if (Object.hasOwn(obj.schema, "default")) {
                return obj.schema.default;
            }
        }
        return undefined;
    }


    /**
     * Executes the process with the given request body.
     * @param {Object} requestBody - The request body for the process execution.
     * @returns {Promise<Object>} The response data from the process execution. Normally a job status object with job ID.
     */
    async execute (requestBody, accessToken) {
        const encodedProcessId = encodeURIComponent(this.processId),
            url = new URL(`processes/${encodedProcessId}/execution`, this.baseUrl);

        console.log("=== OGC API Process Execute ===");
        console.log("Process ID:", this.processId);
        console.log("Encoded Process ID:", encodedProcessId);
        console.log("Base URL:", this.baseUrl);
        console.log("Full URL:", url.toString());
        console.log("Request Body:", JSON.stringify(requestBody, null, 2));

        try {
            const response = await axios.post(url, requestBody, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            return response.data;
        }
        catch (error) {
            throw error;
        }
    }

    /**
     * Fetches the status of a job with the given job ID.
     * @param {string} jobID - The ID of the job.
     * @returns {Promise<Object>} The job status object.
     */
    async getJobStatus (jobID, accessToken) {
        const url = new URL(`jobs/${jobID}`, this.baseUrl),
            response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

        return response.data;
    }

    /**
     * Fetches the result of a job with the given job ID.
     * @param {string} jobID - The ID of the job.
     * @param {String} accessToken - The access token for authentication.
     * @param {Function} [onLargeResponse=null] - Optional callback when response > 10MB.
     * @returns {Promise<Object>} The job results object.
     */
    async getJobResults (jobID, accessToken, onLargeResponse = null) {
        const url = new URL(`jobs/${jobID}/results`, this.baseUrl),
            response = await axios.get(url, {headers: {
                Authorization: `Bearer ${accessToken}`
            }});

        // Check response size
        const responseSize = JSON.stringify(response.data).length,
            responseSizeMB = responseSize / (1024 * 1024);

        if (responseSizeMB > 10 && typeof onLargeResponse === "function") {
            onLargeResponse(responseSizeMB);
        }

        return response.data;
    }

    /**
     * Polls the job status and retrieves the results.
     * @param {String} accessToken - The access token for authentication.
     * @param {string} jobID - The ID of the job.
     * @param {number} [pollingInterval=1000] - The interval in milliseconds to poll for job status.
     * @param {function} [onProgressUpdate=null] - Optional callback function to handle progress updates.
     * @param {Function} [onLargeResponse=null] - Optional callback when response > 10MB.
     * @returns {Promise<Object>} The job results object.
     * @throws {Error} If an error occurs during execution or if the job fails.
    */
    async pollJobStatusAndGetResults (accessToken, jobID, pollingInterval = 1000, onProgressUpdate = null, onLargeResponse = null) {
        try {
            let jobStatus = await this.getJobStatus(jobID, accessToken);

            onProgressUpdate?.({...jobStatus});

            while (jobStatus?.status === "running" || jobStatus?.status === "accepted") {
                await new Promise(resolve => setTimeout(resolve, pollingInterval));
                jobStatus = await this.getJobStatus(jobID, accessToken);
                onProgressUpdate?.({...jobStatus});
            }

            if (jobStatus?.status !== "successful") {
                console.warn(`Job failed with status: ${jobStatus?.status}`);
            }

            return await this.getJobResults(jobID, accessToken, onLargeResponse);
        }
        catch (error) {
            console.warn("Error polling job status and getting results:", error);
            throw error;
        }
    }

    /**
     * Executes the process, polls for the job status, and retrieves the results.
     * Encapsulates job ID handling, which can be convenient in simple use cases.
     * In more complex use cases that require dealing with job IDs, the execute and pollJobStatusAndGetResults methods should be used.
     * @param {Object} requestBody - The request body for the process execution.
     * @param {number} [pollingInterval=1000] - The interval in milliseconds to poll for job status.
     * @param {function} [onProgressUpdate=null] - Optional callback function to handle progress updates.
     * @param {Function} [onLargeResponse=null] - Optional callback when response > 10MB.
     * @returns {Promise<Object>} The job results object.
     * @throws {Error} If an error occurs during execution or if the job fails.
     */
    async executeAndGetResults (requestBody, pollingInterval = 1000, onProgressUpdate = null, onLargeResponse = null) {
        try {
            const executeResponse = await this.execute(requestBody),
                jobID = executeResponse?.jobID;

            if (!jobID) {
                console.warn("No job ID returned from the execute request.");
            }

            return await this.pollJobStatusAndGetResults(jobID, pollingInterval, onProgressUpdate, onLargeResponse);
        }
        catch (error) {
            console.warn("Error executing process and getting job result:", error);
            throw error;
        }
    }
}
