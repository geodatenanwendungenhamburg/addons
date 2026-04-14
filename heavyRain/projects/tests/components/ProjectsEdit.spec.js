import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import ProjectsEdit from "../../components/ProjectsEdit.vue";

config.global.mocks.$t = key => key;

describe("addons/heavyRain/projects/components/ProjectsEdit.vue", () => {
    let store;

    beforeEach(() => {
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        Projects: {
                            namespaced: true,
                            getters: {
                                currentProject: () => ({
                                    name: "",
                                    geometry: null,
                                    uid: null
                                })
                            }
                        }
                    }
                }
            }
        });
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = shallowMount(ProjectsEdit, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.exists()).to.be.true;
        });
    });
});
