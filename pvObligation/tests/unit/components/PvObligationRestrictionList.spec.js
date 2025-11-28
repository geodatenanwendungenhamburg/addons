import {mount} from "@vue/test-utils";
import {expect} from "chai";
import Component from "../../../components/PvObligationRestrictionList.vue";
import {nextTick} from "vue";
import sinon from "sinon";
import {createStore} from "vuex";

describe("PvObligationRestrictionList.vue", () => {
    let wrapper,
        store;

    beforeEach(() => {
        store = createStore({
            modules: {
                namespaced: true,
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
                                stepNetAreaIsDrawing: false,
                                stepNetRestrictedAreasIsDrawing: false
                            },
                            mutations: {
                                setStepNetRestrictedAreasIsDrawing (state, payload) {
                                    state.stepNetRestrictedAreasIsDrawing = payload;
                                },
                                setStepNetAreaIsDrawing (state, payload) {
                                    state.stepNetAreaIsDrawing = payload;
                                }
                            }
                        }
                    }
                }
            }
        });
        wrapper = mount(Component, {
            props: {
                indexPrefix: "X",
                isDisabled: false,
                disabledMessage: "test"
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

    it("could load the component and root HTML element contains correct ID", () => {
        expect(wrapper.exists()).to.be.true;
        expect(wrapper.attributes().id).equals("pvObligationRestrictionList");
    });

    it("shows form after click on add button", async () => {
        const buttonElement = wrapper.find("button.buttonAdd");

        expect(buttonElement.exists()).to.be.true;

        buttonElement.trigger("click");

        await nextTick();

        expect(wrapper.find("textarea#list_item_X1").exists()).to.be.true;
    });

    it("renders list items", async () => {
        wrapper.setData({
            listItems: [
                {
                    id: "X1",
                    description: "Text for x1",
                    features: []
                },
                {
                    id: "X2",
                    description: "Text for x2",
                    features: []
                },
                {
                    id: "X3",
                    description: "Text for x3",
                    features: []
                }
            ]
        });

        await nextTick();

        const listItems = wrapper.findAll("div.listItem");

        expect(listItems[0].find("div.number").text()).equals("X1");
        expect(listItems[1].find("div.number").text()).equals("X2");
        expect(listItems[2].find("div.number").text()).equals("X3");
    });

    it("sets stepNetAreaIsDrawing via watcher when indexPrefix start with N", async () => {
        await wrapper.setProps({
            indexPrefix: "N"
        });

        expect(store.state.Modules.PvObligation.stepNetAreaIsDrawing).to.be.false;
        expect(store.state.Modules.PvObligation.stepNetRestrictedAreasIsDrawing).to.be.false;

        await wrapper.vm.onButtonAdd();
        await nextTick();

        expect(store.state.Modules.PvObligation.stepNetAreaIsDrawing).to.be.true;
        expect(store.state.Modules.PvObligation.stepNetRestrictedAreasIsDrawing).to.be.false;

        await wrapper.setData({
            itemSelectedCreate: null
        });
        await nextTick();

        expect(store.state.Modules.PvObligation.stepNetAreaIsDrawing).to.be.false;
        expect(store.state.Modules.PvObligation.stepNetRestrictedAreasIsDrawing).to.be.false;
    });

    it("sets stepNetRestrictedAreasIsDrawing via watcher when indexPrefix starts with S", async () => {
        await wrapper.setProps({
            indexPrefix: "S"
        });

        expect(store.state.Modules.PvObligation.stepNetAreaIsDrawing).to.be.false;
        expect(store.state.Modules.PvObligation.stepNetRestrictedAreasIsDrawing).to.be.false;

        await wrapper.vm.onButtonAdd();
        await nextTick();

        expect(store.state.Modules.PvObligation.stepNetRestrictedAreasIsDrawing).to.be.true;
        expect(store.state.Modules.PvObligation.stepNetAreaIsDrawing).to.be.false;

        await wrapper.setData({
            itemSelectedCreate: null
        });
        await nextTick();

        expect(store.state.Modules.PvObligation.stepNetRestrictedAreasIsDrawing).to.be.false;
        expect(store.state.Modules.PvObligation.stepNetAreaIsDrawing).to.be.false;
    });
});
