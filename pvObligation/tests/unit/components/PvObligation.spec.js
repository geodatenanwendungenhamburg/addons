import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import Component from "../../../components/PvObligation.vue";

config.global.mocks.$t = key => key;

describe("addons/pvObligation/components/PvObligation.vue", () => {
    const store = createStore({
        actions: {
            replaceByIdInLayerConfig: sinon.stub()
        },
        modules: {
            namespaced: true,
            Maps: {
                namespaced: true,
                getters: {
                    mode () {
                        return "2D";
                    }
                }
            },
            Modules: {
                namespaced: true,
                modules: {
                    PvObligation: {
                        namespaced: true,
                        state: () => ({
                            isDrawing: false
                        }),
                        getters: {
                            isCreatingReport () {
                                return false;
                            },
                            roofLayerId () {
                                return "34755";
                            },
                            pvAreaLayerId () {
                                return "34753";
                            },
                            isDrawing: state => state.isDrawing
                        },
                        mutations: {
                            setIsCreatingReport () {
                                return false;
                            }
                        },
                        actions: {
                            zoomToExtendOfSelectedRoof: sinon.stub()
                        }
                    }
                }
            }
        },
        getters: {
            isMobile () {
                return false;
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

    it("overlay for 'not working in 3D' is shown", async () => {
        const wrapper = shallowMount(Component, {global: {plugins: [store]}});

        wrapper.vm.is3D = true;
        await wrapper.vm.$nextTick();

        expect(wrapper.find("div.waitingSpinner").exists()).to.be.true;
        expect(wrapper.vm.spinnerInfoText).to.equal("additional:modules.pvObligation.notIn3DMode.infoText");
    });
});
