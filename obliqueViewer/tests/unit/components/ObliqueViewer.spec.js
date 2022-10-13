import Vuex from "vuex";
import {expect} from "chai";
import sinon from "sinon";
import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import ObliqueViewerComponent from "../../../components/ObliqueViewer.vue";
import ObliqueViewer from "../../../store/indexObliqueViewer";

const localVue = createLocalVue();

localVue.use(Vuex);
config.mocks.$t = key => key;

describe("ADDONS: addons/obliqueViewer/components/ObliqueViewer.vue", () => {
    const mockConfigJson = {
            Portalconfig: {
                menu: {
                    tools: {
                        children: {
                            obliqueViewer: {
                                "name": "translate#additional:modules.tools.obliqueViewer.title",
                                "icon": "bi-image",
                                "styleId": "obliqueViewer",
                                "isVisibleInMenu": false
                            }
                        }
                    }
                }
            }
        },
        mockMapMarkerActions = {
            removePointMarker: sinon.stub()
        };
    let store, wrapper, setObliqueViewOrig, initObliqueViewOrig, setRenderToWindowOrig, initResetObliqueViewer, setObliqueViewerURLOrig;

    beforeEach(() => {
        global.MutationObserver = {
            constructor: () => sinon.stub(),
            disconnect: () => sinon.stub(),
            observe: () => sinon.stub()
        };

        setObliqueViewOrig = ObliqueViewer.actions.setObliqueView;
        ObliqueViewer.actions.setObliqueView = sinon.stub();
        initObliqueViewOrig = ObliqueViewer.actions.initObliqueView;
        ObliqueViewer.actions.initObliqueView = sinon.stub();
        initResetObliqueViewer = ObliqueViewer.actions.resetObliqueViewer;
        ObliqueViewer.actions.resetObliqueViewer = sinon.stub();
        setObliqueViewerURLOrig = ObliqueViewer.actions.setObliqueViewerURL;
        ObliqueViewer.actions.setObliqueViewerURL = sinon.stub();
        setRenderToWindowOrig = ObliqueViewer.mutations.setRenderToWindow;
        ObliqueViewer.mutations.setRenderToWindow = sinon.stub();

        store = new Vuex.Store({
            namespaces: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules: {
                        ObliqueViewer
                    }
                },
                Maps: {
                    namespaced: true,
                    getters: {
                        clickCoordinate: () => [100, 200],
                        initialCenter: () => [565874, 5934140]
                    },
                    actions: {
                        registerListener: sinon.stub(),
                        unregisterListener: sinon.stub()
                    }
                },
                MapMarker: {
                    namespaced: true,
                    actions: mockMapMarkerActions,
                    mutations: {
                        setPointStyleId: () => sinon.stub()
                    }
                }
            },
            state: {
                configJson: mockConfigJson
            },
            getters: {
                mobile: () => false
            }
        });

        store.commit("Tools/ObliqueViewer/setActive", true);
        wrapper = shallowMount(ObliqueViewerComponent, {store, localVue});
    });
    afterEach(function () {
        sinon.restore();
        ObliqueViewer.actions.setObliqueView = setObliqueViewOrig;
        ObliqueViewer.actions.initObliqueView = initObliqueViewOrig;
        ObliqueViewer.actions.resetObliqueViewer = initResetObliqueViewer;
        ObliqueViewer.actions.setObliqueViewerURL = setObliqueViewerURLOrig;
        ObliqueViewer.mutations.setRenderToWindow = setRenderToWindowOrig;
        if (wrapper) {
            wrapper.destroy();
        }
    });
    describe("ObliqueViewer.vue watcher", () => {
        it("test watch on clickCoordinate should call action setObliqueView", async () => {
            expect(wrapper.find("#obliqueIframe").exists()).to.be.true;
            wrapper.vm.$options.watch.clickCoordinate.call(wrapper.vm, [10, 20]);
            expect(ObliqueViewer.actions.setObliqueView.calledOnce).to.be.true;
        });
        it("test watch on active should call action setObliqueView", async () => {
            expect(wrapper.find("#obliqueIframe").exists()).to.be.true;
            await wrapper.vm.$options.watch.active.call(wrapper.vm, true);
            expect(ObliqueViewer.actions.initObliqueView.calledOnce).to.be.true;
            expect(ObliqueViewer.actions.resetObliqueViewer.calledOnce).to.be.false;
        });
        it("test watch on active = false should call action setObliqueView", async () => {
            expect(wrapper.find("#obliqueIframe").exists()).to.be.true;
            wrapper.vm.$options.watch.active.call(wrapper.vm, false);
            expect(ObliqueViewer.actions.resetObliqueViewer.calledOnce).to.be.true;
        });
        it("test watch on isMobile should call mutation setRenderToWindow if isMobile is false", async () => {
            expect(wrapper.find("#obliqueIframe").exists()).to.be.true;
            wrapper.vm.$options.watch.isMobile.call(wrapper.vm, false);
            expect(ObliqueViewer.mutations.setRenderToWindow.calledOnce).to.be.true;
            expect(ObliqueViewer.mutations.setRenderToWindow.args[0][1]).to.be.false;
        });
        it("test watch on isMobile should call mutation setRenderToWindow if isMoblie is true", async () => {
            expect(wrapper.find("#obliqueIframe").exists()).to.be.true;
            wrapper.vm.$options.watch.isMobile.call(wrapper.vm, true);
            expect(ObliqueViewer.mutations.setRenderToWindow.calledOnce).to.be.true;
            expect(ObliqueViewer.mutations.setRenderToWindow.args[0][1]).to.be.true;
        });
    });
    describe("ObliqueViewer.vue methods", () => {
        it("close sets active to false", async () => {
            expect(store.state.Tools.ObliqueViewer.active).to.be.true;
            wrapper.vm.close();
            await wrapper.vm.$nextTick();

            expect(store.state.Tools.ObliqueViewer.active).to.be.false;
            expect(wrapper.find("#obliqueIframe").exists()).to.be.false;
        });
        it("renders the ObliqueViewer", () => {
            expect(wrapper.find("#obliqueIframe").exists()).to.be.true;
        });
    });
});
