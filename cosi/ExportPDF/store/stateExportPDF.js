import rawJson from "../assets/beispiel_report_template.json";

export default {
    active: false,
    id: "ExportPDF",
    name: "Export PDF",
    icon: "bi-printer",

    isVisibleInMenu: true, // optional
    renderToWindow: true,
    resizableWindow: false,
    deactivateGFI: true,
    jsonData: rawJson

};
