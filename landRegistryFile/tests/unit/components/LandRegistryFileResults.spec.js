import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import sinon from "sinon";

import Component from "../../../components/LandRegistryFileResults.vue";

describe("addons/landRegistryFile/tests/unit/components/LandRegistryFileResults.spec.js", () => {
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
                                landRegistryFileFeatures: landRegistryFileFeatures,
                                showLoadingSpinner: false,
                                selectedDetailFeatureId: null,
                                tableFields: [],
                                oafSchema: null,
                                sorting: {
                                    columnName: "",
                                    order: "origin"
                                }
                            }),
                            getters: {
                                getSortedFeatures: state => state.landRegistryFileFeatures,
                                showLoadingSpinner: state => state.showLoadingSpinner,
                                selectedDetailFeatureId: state => state.selectedDetailFeatureId,
                                tableFields: state => state.tableFields,
                                oafSchema: state => state.oafSchema,
                                sorting: state => state.sorting
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

        wrapper.vm.setCurrentTab = () => sinon.stub();
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("should exist", () => {
        expect(wrapper.exists()).to.be.true;
    });

    it("showDetails should set selectedDetailFeatureId in the store", async () => {
        const featureId = wrapper.vm.getSortedFeatures[0].id;

        await wrapper.vm.showDetails({id: featureId});
        expect(wrapper.vm.selectedDetailFeatureId).to.equal(featureId);
    });

    it("showDetails with a different featureId should set selectedDetailFeatureId in the store", async () => {
        const featureId1 = wrapper.vm.getSortedFeatures[0].id;
        const featureId2 = wrapper.vm.getSortedFeatures[1].id;

        await wrapper.vm.showDetails({id: featureId1});
        expect(wrapper.vm.selectedDetailFeatureId).to.equal(featureId1);

        await wrapper.vm.showDetails({id: featureId2});
        expect(wrapper.vm.selectedDetailFeatureId).to.equal(featureId2);
    });

    it("calling showDetails with the same featureId should set selectedDetailFeatureId to null in the store", async () => {
        const featureId = wrapper.vm.getSortedFeatures[0].id;

        await wrapper.vm.showDetails({id: featureId});
        expect(wrapper.vm.selectedDetailFeatureId).to.equal(featureId);

        await wrapper.vm.showDetails({id: featureId});
        expect(wrapper.vm.selectedDetailFeatureId).to.be.null;
    });
});
