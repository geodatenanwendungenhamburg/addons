import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Component from "../../../components/PvObligation.vue";

config.global.mocks.$t = key => key;

describe("addons/pvObligation/components/PvObligation.vue", () => {
    const store = createStore({
        modules: {
            namespaced: true,
            Modules: {
                namespaced: true,
                modules: {
                    PVObligation: {
                        namespaced: true,
                        getters: {
                            isCreatingReport () {
                                return false;
                            }
                        },
                        mutations: {
                            setIsCreatingReport () {
                                return false;
                            }
                        }
                    }
                }
            }
        }
    });

    it("could load the component and root HTML element contains correct ID", async () => {
        const wrapper = shallowMount(Component, {global: {plugins: [store]}});

        expect(wrapper.exists()).to.be.true;
        expect(wrapper.attributes().id).equals("pvObligation");
    });
});
