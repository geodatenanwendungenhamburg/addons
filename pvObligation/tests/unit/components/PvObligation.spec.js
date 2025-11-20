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
                    PvObligation: {
                        namespaced: true,
                        getters: {
                            isCreatingReport () {
                                return false;
                            },
                            relevantLayerIds () {
                                return [];
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

    it("loading spinner is shown at beginning", async () => {
        const wrapper = shallowMount(Component, {global: {plugins: [store]}});

        wrapper.vm.allRoofsLoaded = true;
        await wrapper.vm.$nextTick();

        expect(wrapper.find("div.waitingSpinner").exists()).to.be.false;

        wrapper.vm.allRoofsLoaded = false;
        await wrapper.vm.$nextTick();

        expect(wrapper.find("div.waitingSpinner").exists()).to.be.true;
        expect(wrapper.vm.spinnerInfoText).to.equal("additional:modules.pvObligation.roofsAreLoadingSpinner");
    });
});
