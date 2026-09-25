import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";

import Component from "../../../components/LandRegistryFileResults.vue";

describe("addons/landRegistryFile/tests/unit/LandRegistryFileResults.spec.js", () => {
    let wrapper;

    beforeEach(() => {
        wrapper = shallowMount(Component, {
            props: {
            },
            global: {
                mocks: {
                    $t: key => key
                }
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
