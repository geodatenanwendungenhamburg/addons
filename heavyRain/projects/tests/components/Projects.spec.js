import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import Projects from "../../components/Projects.vue";

config.global.mocks.$t = key => key;

describe("addons/heavyRain/projects/components/Projects.vue", () => {
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
                                projectList: () => [],
                                currentProject: () => ({})
                            },
                            mutations: {
                                setProjectList: () => { /* mock */ },
                                setCurrentProject: () => { /* mock */ }
                            }
                        }
                    }
                },
                Maps: {
                    namespaced: true,
                    actions: {
                        addNewLayerIfNotExists: () => Promise.resolve()
                    }
                }
            }
        });
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = shallowMount(Projects, {
                global: {
                    plugins: [store]
                }
            });

            expect(wrapper.exists()).to.be.true;
        });
    });
});
