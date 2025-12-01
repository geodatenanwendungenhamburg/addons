import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import Component from "../../../components/PvObligationWizardStepGenerateReport.vue";
import {createEmpty as createEmptyExtent} from "ol/extent";

config.global.mocks.$t = key => key;

describe("addons/pvObligation/components/PvObligationWizardStepGenerateReport.vue", () => {
    const store = createStore({
        modules: {
            namespaced: true,
            Maps: {
                namespaced: true,
                actions: {
                    zoomToExtent: sinon.stub()
                }
            },
            Menu: {
                namespaced: true,
                getters: {
                    expanded: () => (side) => {
                        return side === "secondaryMenu";
                    }
                }
            },
            Modules: {
                namespaced: true,
                modules: {
                    PvObligation: {
                        namespaced: true,
                        getters: {
                            isCreatingReport () {
                                return false;
                            },
                            selectedRoofExtent () {
                                return createEmptyExtent();
                            }
                        },
                        mutations: {
                            setIsCreatingReport () {
                                return false;
                            }
                        },
                        actions: {
                            exportPDF: () => sinon.stub()
                        }
                    }
                }
            }
        }
    });

    it("could load the component and root HTML element contains correct ID", async () => {
        const wrapper = shallowMount(Component, {
            propsData: {
                wizardStepsFormData: {},
                wizardStepIsActive: true
            },
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.exists()).to.be.true;
        expect(wrapper.attributes().id).equals("pvObligationWizardStepGenerateReport");
    });

    it("returns false if any wizard step is invalid", async () => {
        const wrapper = shallowMount(Component, {
            propsData: {
                wizardStepsFormData: {
                    "component_1": {
                        isValid: true
                    },
                    "component_2": {
                        isValid: false
                    },
                    "component_3": {
                        isValid: true
                    }
                },
                wizardStepIsActive: true
            },
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.vm.allWizardStepsValid).to.be.false;
    });

    it("returns true if every wizard step is valid", async () => {
        const wrapper = shallowMount(Component, {
            propsData: {
                wizardStepsFormData: {
                    "component_1": {
                        isValid: true
                    },
                    "component_2": {
                        isValid: true
                    },
                    "component_3": {
                        isValid: true
                    }
                },
                wizardStepIsActive: true
            },
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.vm.allWizardStepsValid).to.be.true;
    });

    it("mapZoomToExtentPadding has the correct structure", () => {
        const wrapper = shallowMount(Component, {
            propsData: {
                wizardStepsFormData: {
                    "component_1": {
                        isValid: true
                    },
                    "component_2": {
                        isValid: true
                    },
                    "component_3": {
                        isValid: true
                    }
                },
                wizardStepIsActive: true
            },
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.vm.mapZoomToExtentPadding).to.be.an("array");
        expect(wrapper.vm.mapZoomToExtentPadding.length).to.equal(4);
    });
});
