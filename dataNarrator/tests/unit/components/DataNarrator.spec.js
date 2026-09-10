import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import {initTestPinia} from "@devtools/tests/initTestPinia";
import Component from "../../../components/DataNarrator.vue";


describe("addons/dataNarrator/tests/unit/DataNarrator.spec.js", () => {
    let wrapper,
        store,
        pinia,
        menuStore;

    beforeEach(() => {
        ({pinia, menuStore} = initTestPinia());
        menuStore.secondaryMenu.expanded = true;
        store = createStore({
            modules: {
                namespaced: true,
                Modules: {
                    namespaced: true,
                    modules: {
                        DataNarrator: {
                            namespaced: true,
                            state: () => ({
                                showLoadingSpinner: false,
                                autoplay: true,
                                storyConfJson: "mockConfigJsStoryConf.json",
                                icon: "bi-book"
                            }),
                            getters: {
                                showLoadingSpinner: state => state.showLoadingSpinner,
                                autoplay: state => state.autoplay,
                                storyConfJson: state => state.storyConfJson,
                                icon: state => state.icon
                            },
                            mutations: {
                                setShowLoadingSpinner (state, payload) {
                                    state.showLoadingSpinner = payload;
                                },
                                setMode: (state, payload) => {
                                    state.mode = payload;
                                }
                            }
                        }
                    }
                }
            },
            state: {
                configJs: {
                    storyConf: "mockConfigJsStoryConf.json"
                }
            },
            getters: {
                configJs: state => state.configJs,
                isMobile: () => false
            }
        });

        wrapper = shallowMount(Component, {
            props: {
            },
            global: {
                mocks: {
                    $t: key => key
                },
                plugins: [store, pinia]
            }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("DataNarrator should exist", () => {
        expect(wrapper.exists()).to.be.true;
    });

    it("should replace icon class when secondaryExpanded becomes false and component is active", async () => {
        const btn = document.createElement("button"),
            icon = document.createElement("i");

        btn.id = "secondaryMenu-toggle-button";
        icon.classList.add("bi-tools");
        btn.appendChild(icon);
        document.body.appendChild(btn);

        wrapper.vm.isActive = true;
        await wrapper.vm.$nextTick();

        menuStore.secondaryMenu.expanded = false;
        await wrapper.vm.$nextTick();

        expect(icon.classList.contains("bi-book")).to.be.true;
        expect(icon.classList.contains("bi-tools")).to.be.false;

        // Cleanup DOM
        btn.remove();
    });

    it("should render StoryPlayer component", () => {
        const storyPlayer = wrapper.findComponent({name: "StoryPlayer"});

        expect(storyPlayer.exists()).to.be.true;
    });
});
