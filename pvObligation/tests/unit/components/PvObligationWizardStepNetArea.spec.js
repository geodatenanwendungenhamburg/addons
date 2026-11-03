import {mount} from "@vue/test-utils";
import {expect} from "chai";
import Component from "../../../components/PvObligationWizardStepNetArea.vue";
import sinon from "sinon";
import {createStore} from "vuex";

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
                        removeInteraction: sinon.stub()
                    }
                },
                Modules: {
                    namespaced: true,
                    modules: {
                        PvObligation: {
                            namespaced: true,
                            state: {
                                selectedRoofId: 1,
                                isDrawing: false,
                                pvAreaLayerId: "123"
                            },
                            getters: {
                                selectedRoofId: (state) => state.selectedRoofId,
                                isDrawing: (state) => state.isDrawing,
                                pvAreaLayerId: (state) => state.pvAreaLayerId
                            },
                            actions: {
                                dissolveRoofFeaturesAndCalculateArea: sinon.stub().resolves(100),
                                calculateNetAreaAndRestrictedAreas: sinon.stub(),
                                zoomToExtendOfSelectedRoof: sinon.stub()
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

        wrapper = mount(Component, {
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
        await wrapper.setProps({
            wizardStepsFormData: {PvObligationWizardStepGrossArea: {isValid: true}},
            wizardStepIsActive: true
        });

        const vm = wrapper.vm;

        vm.componentFormData.netRoofArea = 100;
        vm.obligatedArea = 30;
        vm.displayNetRoofArea = "100";

        await vm.$nextTick();

        const tables = wrapper.findAll("table#PvObligationSimpleTable");

        expect(tables.length).to.equal(2);
        expect(tables[0].find("td.cellValue").text() === "100 m²").to.be.true;
        expect(tables[1].find("td.cellValue").text() === "30 m²").to.be.true;
    });

    it("renders correct obligatedArea rounding", async () => {
        await wrapper.setProps({
            wizardStepsFormData: {PvObligationWizardStepGrossArea: {isValid: true}},
            wizardStepIsActive: true
        });

        const vm = wrapper.vm;

        vm.componentFormData.netRoofArea = 123.456;
        vm.obligatedArea = Math.round(vm.componentFormData.netRoofArea * 0.3 * 10) / 10;
        vm.displayNetRoofArea = "123.456";

        await vm.$nextTick();

        const tables = wrapper.findAll("table#PvObligationSimpleTable");

        expect(tables.length).to.equal(2);
        expect(tables[0].find("td.cellValue").text() === "123,5 m²").to.be.true;
        expect(tables[1].find("td.cellValue").text() === "37 m²").to.be.true;
    });
});
