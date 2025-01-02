import {config, createLocalVue, shallowMount} from "@vue/test-utils";
import DistrictFinderFilterImport from "../../../components/DistrictFinderFilterImport.vue";
import {expect} from "chai";
import sinon from "sinon";
import Vuex from "vuex";

config.mocks.$t = key => key;

const localVue = createLocalVue();

localVue.use(Vuex);

describe("addons/cosi/DistrictFinder/components/DistrictFinderFilterImport.vue", () => {
    let stubAddSingleAlert = sinon.stub();

    const store = new Vuex.Store({
            namespaced: true,
            modules: {
                Alerting: {
                    namespaced: true,
                    actions: {
                        addSingleAlert: stubAddSingleAlert
                    }
                }
            }
        }),
        factory = {
                getShallowMount: (values = {}) => {
                    return shallowMount(DistrictFinderFilterImport, {
                        data () {
                            return {
                                ...values
                            };
                        },
                        localVue,
                        store
                    });
                }
            };

    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.exists()).to.be.true;
        });

        it("should find a button", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.find("button").exists()).to.be.true;
        });

        it("should find a hidden input of type 'file'", () => {
            const wrapper = factory.getShallowMount(),
                inputWrapper = wrapper.find("input");

            expect(inputWrapper.exists()).to.be.true;
            expect(inputWrapper.classes("d-none")).to.be.true;
            expect(inputWrapper.attributes("type")).to.be.equal("file");
        });
    });

    describe("Methdos", () => {
        describe("triggerFileInput", () => {
            it("should call the 'click' method of the input if this function is called", () => {
                const wrapper = factory.getShallowMount(),
                    spyInputClick = sinon.spy(wrapper.vm.$el.querySelector("#file-input"), "click");

                wrapper.vm.triggerFileInput();
                expect(spyInputClick.calledOnce).to.be.true;
            });
        });

        describe("loadFiles", () => {
            it("should call 'addSingleAlert' if type(MIME) is not 'application/json'", () => {
                const obj = {
                        target: {
                            files: [{
                                type: "kein json",
                                name: "file one"
                            }]
                        }
                    },
                    wrapper = factory.getShallowMount();

                wrapper.vm.loadFiles(obj);

                expect(stubAddSingleAlert.calledOnce).to.be.true;
            });
        });

        describe("parseFileContent", () => {
            it("should call the 'addSingleAlert' if file content is not correct.", () => {
                const obj = {
                        target: {
                            result: undefined
                        }
                    },
                    wrapper = factory.getShallowMount();

                wrapper.vm.parseFileContent(obj);

                expect(stubAddSingleAlert.getCall(-1).args[1].content).to.be.equal("additional:modules.tools.cosi.districtFinder.errors.invalid");
            });

            it("should call the 'addSingleAlert' if file content has not the meta property.", () => {
                const obj = {
                        target: {
                            result: JSON.stringify({test: ""})
                        }
                    },
                    wrapper = factory.getShallowMount();

                    wrapper.vm.parseFileContent(obj);
                    expect(stubAddSingleAlert.getCall(-1).args[1].content).to.be.equal("additional:modules.tools.cosi.districtFinder.errors.invalid additional:modules.tools.cosi.districtFinder.errors.attErr");
            });

            it("should call the 'addSingleAlert' if file content has no name in the meta property.", () => {
                const obj = {
                        target: {
                            result: JSON.stringify({meta: {test: "title"}})
                        }
                    },
                    wrapper = factory.getShallowMount();

                    wrapper.vm.parseFileContent(obj);
                    expect(stubAddSingleAlert.getCall(-1).args[1].content).to.be.equal("additional:modules.tools.cosi.districtFinder.errors.invalid additional:modules.tools.cosi.districtFinder.errors.attErr");
            });

            it("should call the 'addSingleAlert' if file content has no date in the the meta property.", () => {
                const obj = {
                        target: {
                            result: JSON.stringify({meta: {date: "heute", test: "title"}})
                        }
                    },
                    wrapper = factory.getShallowMount();

                    wrapper.vm.parseFileContent(obj);
                    expect(stubAddSingleAlert.getCall(-1).args[1].content).to.be.equal("additional:modules.tools.cosi.districtFinder.errors.invalid additional:modules.tools.cosi.districtFinder.errors.attErr");
            });

            it("should call the 'addSingleAlert' if file content has not the data property.", () => {
                const obj = {
                        target: {
                            result: JSON.stringify({meta: {name: "title", date: "heute"}})
                        }
                    },
                    wrapper = factory.getShallowMount();

                    wrapper.vm.parseFileContent(obj);
                    expect(stubAddSingleAlert.getCall(-1).args[1].content).to.be.equal("additional:modules.tools.cosi.districtFinder.errors.invalid additional:modules.tools.cosi.districtFinder.errors.attErr");
            });

            it("should emit the right events with the right data", () => {
                const obj = {
                        target: {
                            result: JSON.stringify({meta: {name: "title", date: "heute"}, data: "Meine Daten"})
                        }
                    },
                    wrapper = factory.getShallowMount();

                wrapper.vm.parseFileContent(obj);
                expect(wrapper.emitted()).to.have.property("setConditionDate");
                expect(wrapper.emitted()).to.have.property("setConditionTitle");
                expect(wrapper.emitted()).to.have.property("setCardList");
                expect(wrapper.emitted().setConditionDate[0]).to.deep.equal(["heute"]);
                expect(wrapper.emitted().setConditionTitle[0]).to.deep.equal(["title"]);
                expect(wrapper.emitted().setCardList[0]).to.deep.equal(["Meine Daten"]);
            });
        });
    });
});
