import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Component from "../../../components/PvObligationWizardStepNetArea.vue";
import sinon from "sinon";
import {createStore} from "vuex";
import {createEmpty as createEmptyExtent} from "ol/extent";

describe("addons/pvObligation/components/PvObligationWizardStepNetArea.vue", () => {
    let wrapper,
        store;

    beforeEach(() => {
        store = createStore({
            modules: {
                Maps: {
                    namespaced: true,
                    actions: {
                        addNewLayerIfNotExists: sinon.stub(),
                        addInteraction: sinon.stub(),
                        removeInteraction: sinon.stub(),
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
                            state: {
                                selectedRoofId: 1,
                                selectedRoofExtent: createEmptyExtent(),
                                isDrawing: false
                            },
                            getters: {
                                selectedRoofId: (state) => state.selectedRoofId,
                                selectedRoofExtent: (state) => state.selectedRoofExtent,
                                isDrawing: (state) => state.isDrawing
                            },
                            actions: {
                                dissolveRoofFeaturesAndCalculateArea: sinon.stub().resolves(100)
                            },
                            mutations: {
                                setIsDrawing: (state, payload) => {
                                    state.isDrawing = payload;
                                }
                            }
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(Component, {
            propsData: {
                wizardStepsFormData: {
                    PvObligationWizardStepGrossArea: {
                        isValid: true
                    }
                },
                wizardStepIsActive: true
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
        wrapper?.unmount();
    });


    it("could load the component and root HTML element contains correct ID", async () => {
        expect(wrapper.exists()).to.be.true;
        expect(wrapper.attributes().id).equals("pvObligationWizardStepNetArea");
    });

    it("does not render net roof area texts when netRoofArea is null", async () => {
        await wrapper.setProps({
            wizardStepsFormData: {PvObligationWizardStepGrossArea: {isValid: false}},
            wizardStepIsActive: true
        });

        expect(wrapper.findAll("p").length).to.equal(2);

        wrapper.findAll("p").forEach((pTag) => {
            expect(pTag.text()).to.contain("missingStepGrossArea");
        });
    });

    it("renders all net roof area paragraphs when netRoofArea is set", async () => {
        wrapper.vm.$t = (key, addon) => {
            return key + (addon ? Object.values(addon).join(",") : "");
        };

        await wrapper.setProps({
            wizardStepsFormData: {PvObligationWizardStepGrossArea: {isValid: true}},
            wizardStepIsActive: true
        });

        const vm = wrapper.vm;

        vm.componentFormData.netRoofArea = 100;
        vm.obligatedArea = 30;
        vm.displayNetRoofArea = "100";

        await vm.$nextTick();

        expect(wrapper.findAll("strong").length).to.equal(2);
        expect(wrapper.findAll("strong")[0].text()).to.contain("100");
        expect(wrapper.findAll("strong")[1].text()).to.contain("30");
    });

    it("renders correct obligatedArea rounding", async () => {
        wrapper.vm.$t = (key, addon) => {
            return key + (addon ? Object.values(addon).join(",") : "");
        };

        await wrapper.setProps({
            wizardStepsFormData: {PvObligationWizardStepGrossArea: {isValid: true}},
            wizardStepIsActive: true
        });

        const vm = wrapper.vm;

        vm.componentFormData.netRoofArea = 123.456;
        vm.obligatedArea = Math.round(vm.componentFormData.netRoofArea * 0.3 * 10) / 10;
        vm.displayNetRoofArea = "123.456";

        await vm.$nextTick();

        expect(wrapper.findAll("strong").length).to.equal(2);
        expect(wrapper.findAll("strong")[0].text()).to.contain("123.456");
        expect(wrapper.findAll("strong")[1].text()).to.contain(Math.round(wrapper.vm.componentFormData.netRoofArea * 0.3 * 10) / 10);
    });

    it("mapZoomToExtentPadding has the correct structure", () => {
        expect(wrapper.vm.mapZoomToExtentPadding).to.be.an("array");
        expect(wrapper.vm.mapZoomToExtentPadding.length).to.equal(4);
    });
});
