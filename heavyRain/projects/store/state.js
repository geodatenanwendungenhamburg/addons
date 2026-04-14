/**
 * User type definition
 * @typedef {Object} projects
 * @property {String} id - Id of the component.
 * @property {String} type type of the component.
 * @property {String} name - Displayed as title.
 * @property {String} icon - Icon next to title.
 * @property {Array} projectList - List of saved projects.
 * @property {Object} currentProject - Current project.
 */
const state = {
    id: "projects",
    type: "projects",
    name: "additional:modules.projects.title",
    icon: "bi-building",
    projectList: [],
    currentProject: {
        name: "",
        startDate: "",
        endDate: "",
        createdBy: "",
        criteria: "",
        contact: "",
        description: "",
        geometry: null,
        quelle: "",
        contactExt: "",
        infolink: "",
        history: "",
        protectedAreas: ""
    }
};

export default state;
