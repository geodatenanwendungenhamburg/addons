import {config, mount} from "@vue/test-utils";
import {expect} from "chai";
import Component from "../../../components/PvObligationRestrictionList.vue";
import {nextTick} from "vue";

config.global.mocks.$t = key => key;

describe("PvObligationRestrictionList.vue", () => {
    let wrapper;

    beforeEach(() => {
        wrapper = mount(Component, {
            props: {
                indexPrefix: "X",
                isDisabled: false
            },
            global: {
                mocks: {
                    $t: key => key
                }
            }
        });
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
                    geometries: []
                },
                {
                    id: "X2",
                    description: "Text for x2",
                    geometries: []
                },
                {
                    id: "X3",
                    description: "Text for x3",
                    geometries: []
                }
            ]
        });

        await nextTick();

        const listItems = wrapper.findAll("div.listItem");

        expect(listItems[0].find("div.number").text()).equals("X1");
        expect(listItems[1].find("div.number").text()).equals("X2");
        expect(listItems[2].find("div.number").text()).equals("X3");
    });
});
