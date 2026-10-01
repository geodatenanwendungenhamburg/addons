import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import sinon from "sinon";

import Component from "../../../components/LandRegistryFile.vue";

describe("addons/landRegistryFile/tests/unit/components/LandRegistryFile.spec.js", () => {
    let wrapper,
        store;
    const landRegistryFileFeatures = [
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
        ],
        tabContainerRef = {
            $refs: {
                tabResults: [{scrollToSelectedDetail: sinon.stub()}]
            }
        };

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
                                showLoadingSpinner: false,
                                landRegistryFileFeatures: landRegistryFileFeatures,
                                selectedDetailFeatureId: null
                            }),
                            actions: {
                                queryOafSchema: () => Promise.resolve()
                            },
                            getters: {
                                showLoadingSpinner: state => state.showLoadingSpinner,
                                getSortedFeatures: state => state.landRegistryFileFeatures,
                                selectedDetailFeatureId: state => state.selectedDetailFeatureId
                            },
                            mutations: {
                                setShowLoadingSpinner (state, payload) {
                                    state.showLoadingSpinner = payload;
                                },
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

    it("should have showLoadingSpinner state set to false", () => {
        expect(store.state.Modules.LandRegistryFile.showLoadingSpinner).to.equal(false);
    });

    it("selects the first feature when the details tab opens with no selection", () => {
        wrapper.vm.handleTabChange(tabContainerRef, "tabDetails", "tabResults");

        expect(store.state.Modules.LandRegistryFile.selectedDetailFeatureId).to.equal("1");
    });

    it("preserves the existing selection when the details tab opens", () => {
        store.state.Modules.LandRegistryFile.selectedDetailFeatureId = "2";

        wrapper.vm.handleTabChange(tabContainerRef, "tabDetails", "tabResults");

        expect(store.state.Modules.LandRegistryFile.selectedDetailFeatureId).to.equal("2");
    });
});
