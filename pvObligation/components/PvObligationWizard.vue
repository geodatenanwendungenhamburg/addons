<script>
import {markRaw} from "vue";
import {mapGetters} from "vuex";
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import PvObligationWizardStepGrossArea from "./PvObligationWizardStepGrossArea.vue";
import PvObligationWizardStepNetArea from "./PvObligationWizardStepNetArea.vue";
import PvObligationWizardStepNetRestrictedAreas from "./PvObligationWizardStepNetRestrictedAreas.vue";
import PvObligationWizardStepBuildingDetails from "./PvObligationWizardStepBuildingDetails.vue";
import PvObligationWizardStepPersonalNotes from "./PvObligationWizardStepPersonalNotes.vue";
import PvObligationWizardStepGenerateReport from "./PvObligationWizardStepGenerateReport.vue";

export default {
    name: "PvObligationWizard",
    components: {
        AccordionItem,
        FlatButton,
        PvObligationWizardStepGrossArea,
        PvObligationWizardStepNetArea,
        PvObligationWizardStepNetRestrictedAreas,
        PvObligationWizardStepBuildingDetails,
        PvObligationWizardStepPersonalNotes,
        PvObligationWizardStepGenerateReport

    },
    data () {
        return {
            wizardSteps: [
                {
                    title: "grossArea",
                    isOpen: true,
                    component: markRaw(PvObligationWizardStepGrossArea),
                    componentFormData: null,
                    componentFormDataIsValid: null,
                    componentFormDataIsDirty: null
                },
                {
                    title: "netArea",
                    isOpen: false,
                    component: markRaw(PvObligationWizardStepNetArea),
                    componentFormData: null,
                    componentFormDataIsValid: null,
                    componentFormDataIsDirty: null
                },
                {
                    title: "netRestrictedAreas",
                    isOpen: false,
                    component: markRaw(PvObligationWizardStepNetRestrictedAreas),
                    componentFormData: null,
                    componentFormDataIsValid: null,
                    componentFormDataIsDirty: null
                },
                {
                    title: "personalNotes",
                    isOpen: false,
                    component: markRaw(PvObligationWizardStepPersonalNotes),
                    componentFormData: null,
                    componentFormDataIsValid: null,
                    componentFormDataIsDirty: null
                },
                {
                    title: "buildingDetails",
                    isOpen: false,
                    component: markRaw(PvObligationWizardStepBuildingDetails),
                    componentFormData: null,
                    componentFormDataIsValid: null,
                    componentFormDataIsDirty: null
                },
                {
                    title: "generateReport",
                    isOpen: false,
                    component: markRaw(PvObligationWizardStepGenerateReport),
                    componentFormData: null,
                    componentFormDataIsValid: null,
                    componentFormDataIsDirty: null
                }
            ],
            showNextWizardStepButton: true,
            showPreviousWizardStepButton: false
        };
    },
    computed: {
        ...mapGetters("Modules/PvObligation", [
            "isDrawing"
        ]),
        wizardStepTitles () {
            return {
                grossArea: this.$t("additional:modules.pvObligation.wizard.step.grossArea.wizardTitle"),
                netArea: this.$t("additional:modules.pvObligation.wizard.step.netArea.wizardTitle"),
                netRestrictedAreas: this.$t("additional:modules.pvObligation.wizard.step.netRestrictedAreas.wizardTitle"),
                personalNotes: this.$t("additional:modules.pvObligation.wizard.step.personalNotes.wizardTitle"),
                buildingDetails: this.$t("additional:modules.pvObligation.wizard.step.buildingDetails.wizardTitle"),
                generateReport: this.$t("additional:modules.pvObligation.wizard.step.generateReport.wizardTitle")
            };
        },
        wizardStepsFormData () {
            const wizardStepsFormData = {};

            this.wizardSteps.forEach((step) => {
                wizardStepsFormData[step.component.name] = {
                    isValid: step.componentFormDataIsValid,
                    isDirty: step.componentFormDataIsDirty,
                    formData: step.componentFormData
                };
            });

            return wizardStepsFormData;
        }
    },
    watch: {
        wizardStepsFormData: {
            handler (newValue) {
                if (newValue) {
                    this.wizardStepIsDirty();
                }
            },
            deep: true
        }
    },
    mounted () {
        this.collectFormDataFromWizardSteps();
        this.blockAccordionItemsByDraw();
    },
    methods: {
        wizardStepIsActive (componentName) {
            return this.wizardSteps.find((step) => step.isOpen)?.component?.name === componentName;
        },
        openWizardStep (event, index) {
            if (event.target.classList.contains("accordion-button") && !event.target.classList.contains("collapsed")) {
                this.wizardStepIsValid(
                    this.wizardSteps.find(item => item.isOpen)
                );

                this.wizardSteps.forEach((item) => {
                    item.isOpen = false;
                });

                this.wizardSteps[index].isOpen = true;

                this.updateWizardStepNavigationButtons();
                this.collectFormDataFromWizardSteps();

                if (this.wizardSteps.length === index + 1) {
                    this.validateAllStepsOnFinalStep();
                }
            }
        },
        nextWizardStep () {
            if (this.wizardStepIsValid() && !this.isDrawing) {
                for (let i = 0; i < this.wizardSteps.length; i++) {
                    if (this.wizardSteps[i].isOpen === true) {
                        this.wizardSteps[i].isOpen = false;
                        this.wizardSteps[i + 1].isOpen = true;
                        this.updateWizardStepNavigationButtons();
                        this.collectFormDataFromWizardSteps();

                        if (this.wizardSteps.length === i + 2) {
                            this.validateAllStepsOnFinalStep();
                        }

                        break;
                    }
                }
            }
        },
        previousWizardStep () {
            if (this.wizardStepIsValid() && !this.isDrawing) {
                for (let i = 0; i < this.wizardSteps.length; i++) {
                    if (this.wizardSteps[i].isOpen === true) {
                        this.wizardSteps[i].isOpen = false;
                        this.wizardSteps[i - 1].isOpen = true;

                        this.updateWizardStepNavigationButtons();
                        this.collectFormDataFromWizardSteps();

                        break;
                    }
                }
            }
        },
        updateWizardStepNavigationButtons () {
            for (let i = 0; i < this.wizardSteps.length; i++) {
                if (this.wizardSteps[i].isOpen === true) {
                    this.showNextWizardStepButton = i + 1 < this.wizardSteps.length;
                    this.showPreviousWizardStepButton = i > 0;
                    break;
                }
            }
        },
        collectFormDataFromWizardSteps () {
            this.wizardSteps.forEach(step => {
                const refArr = this.$refs[`ref${step.component.name}`],
                    instance = Array.isArray(refArr) ? refArr[0] : refArr;

                step.componentFormData = instance?.componentFormData;
            });
        },
        wizardStepIsValid (selectedStep = null) {
            const currentStep = selectedStep ?? this.wizardSteps.find(step => step.isOpen),
                refArr = this.$refs[`ref${currentStep.component.name}`],
                instance = Array.isArray(refArr) ? refArr[0] : refArr,
                stepIsValid = typeof instance?.componentFormDataValidate === "function"
                    ? instance.componentFormDataValidate()
                    : true;

            currentStep.componentFormDataIsValid = stepIsValid;

            return stepIsValid;
        },
        wizardStepIsDirty () {
            this.wizardSteps.forEach(step => {
                const refArr = this.$refs[`ref${step.component.name}`],
                    instance = Array.isArray(refArr) ? refArr[0] : refArr,
                    stepIsDirty = typeof instance?.checkComponentFormDataIsDirty === "function"
                        ? instance.checkComponentFormDataIsDirty()
                        : false;

                step.componentFormDataIsDirty = stepIsDirty;
            });
        },
        handleWizardStepError (data) {
            const index = this.wizardSteps.findIndex(step => step.component.name === data.componentName);

            this.wizardSteps[index].componentFormDataIsValid = data.isValid;
        },
        validateAllStepsOnFinalStep () {
            this.wizardSteps.forEach(step => this.wizardStepIsValid(step));
        },
        onResetWizardData () {
            this.wizardSteps.forEach(step => {
                const refArr = this.$refs[`ref${step.component.name}`],
                    instance = Array.isArray(refArr) ? refArr[0] : refArr;

                if (typeof instance?.resetWizardStepData === "function") {
                    instance.resetWizardStepData();
                }
            });
        },
        /**
         * Blocks accordion items by draw.
         */
        async blockAccordionItemsByDraw () {
            const accordionItems = await document.getElementsByClassName("step");

            accordionItems.forEach(accordionItem => {
                accordionItem.addEventListener("show.bs.collapse", event => {
                    if (this.isDrawing) {
                        event.preventDefault();
                    }
                });
                accordionItem.addEventListener("hide.bs.collapse", event => {
                    if (this.isDrawing) {
                        event.preventDefault();
                    }
                });
            });
        }
    }
};
</script>

<template lang="html">
    <div id="pvObligationWizard">
        <div class="wizard">
            <div class="wizardContent">
                <div class="intro">
                    <p>
                        {{ $t("additional:modules.pvObligation.wizard.introduction") }}
                    </p>

                    <p>
                        {{ $t("additional:modules.pvObligation.wizard.introductionInfoPvApp") }}

                        <a
                            href="https://www.hamburg.de/politik-und-verwaltung/behoerden/bukea/themen/energie/erneuerbare-energien/photovoltaik/pv-pflicht-in-hamburg"
                            target="_blank"
                        >
                            {{ $t("additional:modules.pvObligation.wizard.introductionInfoPvAppLink") }}
                        </a>
                    </p>

                    <p>
                        {{ $t("additional:modules.pvObligation.wizard.introductionInfoPvObligation") }}

                        <a
                            href="https://www.hamburg.de/politik-und-verwaltung/behoerden/bukea/themen/energie/erneuerbare-energien/photovoltaik/pv-pflicht-in-hamburg"
                            target="_blank"
                        >
                            {{ $t("additional:modules.pvObligation.wizard.introductionInfoPvObligationLink") }}
                        </a>
                    </p>
                </div>

                <div class="steps">
                    <AccordionItem
                        v-for="(step, index) in wizardSteps"
                        :id="`wizard-item-${index}`"
                        :key="index"
                        class="step"
                        :title="wizardStepTitles[step.title]"
                        :is-open="step.isOpen"
                        :icon="step.componentFormDataIsValid === false ? 'bi-exclamation-triangle-fill' : ''"
                        :coloured-header="true"
                        :class="[
                            step.componentFormDataIsValid === false ? 'error' : '',
                            isDrawing && !step.isOpen ? 'disabledAccordionItem' : ''
                        ]"
                        @click="openWizardStep($event, index)"
                    >
                        <component
                            :is="step.component"
                            v-if="step.component"
                            :ref="`ref${step.component.name}`"
                            :wizard-steps-form-data="wizardStepsFormData"
                            :wizard-step-is-active="wizardStepIsActive(step.component.name)"
                            @stepError="handleWizardStepError"
                            @resetWizardData="onResetWizardData"
                        />
                    </AccordionItem>
                </div>
            </div>

            <div class="navigation">
                <FlatButton
                    v-if="showPreviousWizardStepButton"
                    class="backButton"
                    :aria-label="$t('additional:modules.pvObligation.wizard.buttons.back')"
                    :text="$t('additional:modules.pvObligation.wizard.buttons.back')"
                    icon="bi-backspace"
                    :secondary="true"
                    :disabled="isDrawing"
                    @click="previousWizardStep()"
                />

                <FlatButton
                    v-if="showNextWizardStepButton"
                    class="nextButton"
                    :aria-label="$t('additional:modules.pvObligation.wizard.buttons.next')"
                    :text="$t('additional:modules.pvObligation.wizard.buttons.next')"
                    icon="bi-backspace-reverse"
                    :secondary="true"
                    :disabled="isDrawing"
                    @click="nextWizardStep()"
                />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    :deep(.invalid-feedback) {
        display: block;
    }

    #pvObligationWizard {
        height: 100%;

        div.wizard {
            height: 100%;
            overflow: hidden;
            display: flex;
            flex-direction: column;

            div.wizardContent {
                display: flex;
                flex-direction: column;
                flex: 1;
                overflow: auto;
                height: 100%;

                :deep(.error button.accordion-button) {
                    color: $light_red;
                }

                :deep(.disabledAccordionItem) {
                    .accordion-button {
                        background-color: $light_grey_inactive;
                        pointer-events: none;
                        opacity: 0.65;
                    }
                }
            }

            div.navigation {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                width: 100%;
                padding-top: 1rem;
                position: sticky;
                bottom: 0;
                background: $white;
                z-index: 10;
                box-shadow: 0 -0.125rem 0.5rem rgba(0,0,0,0.04);

                button.nextButton:only-child {
                    margin-left: auto;
                }

                button.backButton:only-child {
                    margin-right: auto;
                }

                button.flat-button{
                    // !important is required because the shared FlatButton component uses .mb-3 with !important
                    margin-bottom: 0 !important;

                    &:hover {
                        background-color: $light_grey;
                    }
                }
            }
        }
    }
</style>
