import axios from "axios";
import {buildEndpointUrl} from "../utils/buildEndpointUrl";

// will be imported later..
const Token = "";

export default {
    async fetchDataClassList ({state, commit}) {
        const params = {
                Token: Token
            },
            url = buildEndpointUrl(`${state.apiBasePath}/rest/dataclass/list`, params),
            response = await axios.get(url, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }),
            archiveList = [];

        response.data.forEach(archive => {
            archiveList.push({id: archive.id, name: archive.name});
        });

        commit("setArchiveList", archiveList);
        commit("setDataClassList", response.data);
    },
    async searchByAttribute ({state, commit}, payload) {
        const params = {
                Token: Token,
                f: "json",
                preventCache: Date.now()
            },
            url = buildEndpointUrl(`${state.apiBasePath}/rest/dataclassinstance/search`, params),
            response = await axios.post(url, payload),
            searchAttributeResponse = [];

        response.data.forEach(element => {
            searchAttributeResponse.push({
                archiveId: element.dataclassId,
                attributes: element.dataclassinstanceAttributeArr
            });
        });

        commit("setSearchAttributeResponse", searchAttributeResponse);
    },
    async fetchPlaceholders ({state, commit}) {
        const timestamp = Date.now(),
            response = await axios.get(state.placeholderJsonPath + "?t=" + timestamp);

        commit("setPlaceholderDataClassList", response.data);
    },
    async fetchYears ({state, commit}, archiveIds) {
        const params = {
                Token: Token,
                f: "json",
                preventCache: Date.now()
            },
            url = buildEndpointUrl(`${state.apiBasePath}/rest/geodatamanagement/dataclass/computeyears`, params),
            response = await axios.post(url, archiveIds);

        commit("setYearsList", response.data);

    }
};
