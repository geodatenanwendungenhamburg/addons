import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";

import Component from "../../../components/PvObligation.vue";

describe("addons/pvObligation/components/PvObligation.vue", () => {
    it("should exist", async () => {
        const wrapper = shallowMount(Component);

        expect(wrapper.exists()).to.be.true;
    });
});
