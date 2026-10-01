import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";

import Component from "../../../components/LandRegistryFileDetails.vue";

describe("addons/landRegistryFile/tests/unit/LandRegistryFileDetails.spec.js", () => {
    let wrapper,
        store;
    const mockFeatures = [
        {
            id: "1",
            properties: {
                name: "Feature 1"
            }
        },
        {
            id: "2",
            properties: {
                name: "Feature 2"
            }
        },
        {
            id: "3",
            properties: {
                name: "Feature 3"
            }
        }
    ];

    beforeEach(() => {
        store = createStore({
            modules: {
                namespaced: true,
                Modules: {
                    namespaced: true,
                    modules: {
                        LandRegistryFile: {
                            namespaced: true,
                            state: () => ({
                                landRegistryFileFeatures: mockFeatures,
                                selectedDetailFeatureId: null,
                                detailsFields: ["name"]
                            }),
                            getters: {
                                getSortedFeatures: state => state.landRegistryFileFeatures,
                                selectedDetailFeatureId: state => state.selectedDetailFeatureId,
                                oafSchema: () => null,
                                detailsFields: state => state.detailsFields
                            },
                            mutations: {
                                setSelectedDetailFeatureId (state, featureId) {
                                    state.selectedDetailFeatureId = featureId;
                                }
                            }
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(Component, {
            props: {
            },
            global: {
                mocks: {
                    $t: key => key
                },
                plugins: [store]
            }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("should exist", () => {
        expect(wrapper.exists()).to.be.true;
    });

    it("when the middle feature is selected, both previous and next buttons should be displayed", async () => {
        store.commit("Modules/LandRegistryFile/setSelectedDetailFeatureId", "2");
        await wrapper.vm.$nextTick();

        expect(wrapper.find("#previous-feature").exists()).to.be.true;
        expect(wrapper.find("#next-feature").exists()).to.be.true;
    });

    it("when the first feature is selected, the previous button shoudn't be displayed", async () => {
        store.commit("Modules/LandRegistryFile/setSelectedDetailFeatureId", "1");
        await wrapper.vm.$nextTick();

        expect(wrapper.find("#previous-feature").exists()).to.be.false;
    });

    it("when the last feature is selected, the next button shoudn't be displayed", async () => {
        store.commit("Modules/LandRegistryFile/setSelectedDetailFeatureId", "3");
        await wrapper.vm.$nextTick();

        expect(wrapper.find("#next-feature").exists()).to.be.false;
    });

    it("navigating to the previous feature should set the selected feature id to the previous feature", async () => {
        store.commit("Modules/LandRegistryFile/setSelectedDetailFeatureId", "2");

        wrapper.vm.setPreviousFeature();
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.selectedDetailFeatureId).to.equal("1");
    });

    it("navigating to the next feature should set the selected feature id to the next feature", async () => {
        store.commit("Modules/LandRegistryFile/setSelectedDetailFeatureId", "2");

        wrapper.vm.setNextFeature();
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.selectedDetailFeatureId).to.equal("3");
    });

    it("navigating to the previous feature when the first feature is selected should do nothing", async () => {
        store.commit("Modules/LandRegistryFile/setSelectedDetailFeatureId", "1");

        wrapper.vm.setPreviousFeature();
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.selectedDetailFeatureId).to.equal("1");
    });

    it("navigating to the next feature when the last feature is selected should do nothing", async () => {
        store.commit("Modules/LandRegistryFile/setSelectedDetailFeatureId", "3");

        wrapper.vm.setNextFeature();
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.selectedDetailFeatureId).to.equal("3");
    });
});
