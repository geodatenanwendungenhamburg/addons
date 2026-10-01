import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";

import Component from "../../../components/LandRegistryFileResults.vue";

describe("addons/landRegistryFile/tests/unit/LandRegistryFileResults.spec.js", () => {
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
                                showLoadingSpinner: false
                            }),
                            getters: {
                                selectedDetailFeatureId: () => null,
                                tableFields: () => [],
                                oafSchema: () => null,
                                sorting: () => ({
                                    columnName: "",
                                    order: "origin"
                                }),
                                getSortedFeatures: state => state.landRegistryFileFeatures,
                                showLoadingSpinner: state => state.showLoadingSpinner
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
});
