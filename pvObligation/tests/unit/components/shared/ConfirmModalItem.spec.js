import {config, mount} from "@vue/test-utils";
import {expect} from "chai";
import ConfirmModalItem from "../../../../components/shared/ConfirmModalItem.vue";

config.global.mocks.$t = key => key;

describe("addons/pvObligation/components/shared/ConfirmModalItem.vue", () => {
    it("should output the correct labels and header", async () => {
        const wrapper = mount(ConfirmModalItem, {
                props: {
                    showModal: true,
                    modalInnerWrapperStyle: "max-width: 350px",
                    buttonConfirmLabel: "Demo Confirm",
                    buttonCancelLabel: "Demo Cancel"
                },
                slots: {
                    header: "Demo Are you sure?"
                }
            }),
            buttonConfirmElement = wrapper.find("div.confirmActions button[aria-label='Demo Confirm']"),
            buttonCancelElement = wrapper.find("div.confirmActions button[aria-label='Demo Cancel']");

        expect(buttonConfirmElement.text() === "Demo Confirm").to.be.true;
        expect(buttonCancelElement.text() === "Demo Cancel").to.be.true;
        expect(wrapper.find("div.headerConfirm").text() === "Demo Are you sure?").to.be.true;
        expect(wrapper.find("#modal-1-inner-wrapper").attributes().style === "max-width: 350px;").to.be.true;
    });

    it("should toggle visibility using showModal", async () => {
        const wrapper = mount(ConfirmModalItem, {
            props: {
                showModal: false,
                modalInnerWrapperStyle: "max-width: 350px",
                buttonConfirmLabel: "Demo Confirm",
                buttonCancelLabel: "Demo Cancel"
            },
            slots: {
                header: "Demo Are you sure?"
            }
        });

        expect(wrapper.classes().includes("showing")).to.be.false;

        wrapper.setProps({showModal: true});

        await wrapper.vm.$nextTick();

        expect(wrapper.classes().includes("showing")).to.be.true;
    });

    it("uses modalTitle and modalText, or overwritable by slots", async () => {
        let wrapper = mount(ConfirmModalItem, {
            props: {
                showModal: false,
                modalTitle: "Demo Modal Title?",
                modalText: "Demo Modal Text"
            }
        });

        expect(wrapper.find("div.headerConfirm").text() === "Demo Modal Title?").to.be.true;
        expect(wrapper.find("div#modal-1-content-container").text() === "Demo Modal Text").to.be.true;

        wrapper = mount(ConfirmModalItem, {
            props: {
                showModal: false,
                modalTitle: "Demo Modal Title?",
                modalText: "Demo Modal Text"
            },
            slots: {
                header: "Demo modal title overwritten by slot?",
                default: "Demo modal text overwritten by slot"
            }
        });

        expect(wrapper.find("div.headerConfirm").text() === "Demo modal title overwritten by slot?").to.be.true;
        expect(wrapper.find("div#modal-1-content-container").text() === "Demo modal text overwritten by slot").to.be.true;
    });
});
