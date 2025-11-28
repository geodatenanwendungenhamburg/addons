import {mount} from "@vue/test-utils";
import {expect} from "chai";
import Component from "../../../components/PvObligationRestrictionListForm.vue";
import {nextTick} from "vue";
import sinon from "sinon";
import {createStore} from "vuex";

describe("PvObligationRestrictionListForm.vue", () => {
    let wrapper,
        store;

    beforeEach(async () => {
        store = createStore({
            modules: {
                Maps: {
                    namespaced: true,
                    actions: {
                        addNewLayerIfNotExists: sinon.stub(),
                        addInteraction: sinon.stub(),
                        removeInteraction: sinon.stub()
                    }
                }
            }
        });

        wrapper = mount(Component, {
            props: {
                formMode: "edit",
                formDataItem: {
                    id: "X1",
                    description: "Text for x1",
                    features: ["test"]
                }
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
        expect(wrapper.attributes().id).equals("pvObligationRestrictionListForm");
    });

    it("fires interaction event, if all fields are valid", async () => {
        expect(wrapper.find("div.number").text()).equals("X1");
        expect(wrapper.find("textarea#list_item_X1").exists()).to.be.true;

        expect(wrapper.vm.formDataItem.id === "X1").to.be.true;
        expect(wrapper.vm.formDataItem.description === "Text for x1").to.be.true;

        const buttonSaveElement = wrapper.find("button[aria-label='additional:modules.pvObligation.components.restrictionList.buttonSave']");

        buttonSaveElement.trigger("click");

        await nextTick();

        expect(wrapper.emitted()).to.haveOwnProperty("interaction");

        expect(wrapper.emitted().interaction[0][0]).to.deep.equal({
            action: "save",
            mode: "edit",
            data: {
                id: "X1",
                description: "Text for x1",
                features: ["test"]
            }
        });

        expect(!Object.values(wrapper.vm.formErrors).some(Boolean)).to.be.true;
    });

    it("shows an error and does not fire the interaction event, if the form data is invalid", async () => {
        wrapper = mount(Component, {
            props: {
                action: "save",
                formMode: "edit",
                formDataItem: {
                    id: "X1",
                    description: "",
                    features: []
                }
            },
            global: {
                mocks: {
                    $t: key => key
                }
            }
        });

        expect(wrapper.find("div.number").text()).equals("X1");
        expect(wrapper.find("textarea#list_item_X1").exists()).to.be.true;

        expect(wrapper.vm.formDataItem.id === "X1").to.be.true;
        expect(wrapper.vm.formDataItem.description === "").to.be.true;

        const buttonSaveElement = wrapper.find("button[aria-label='additional:modules.pvObligation.components.restrictionList.buttonSave']");

        buttonSaveElement.trigger("click");

        await nextTick();

        expect(wrapper.find("span.invalid-feedback").exists()).to.be.true;

        expect(wrapper.emitted().interaction).to.be.undefined;

        expect(!Object.values(wrapper.vm.formErrors).some(Boolean)).to.be.false;
    });
});
