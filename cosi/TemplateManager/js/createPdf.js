import pdfMake from "pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

const docDefinition = {
        content: [],
        pageSize: "A4",
        pageMargins: [40, 60, 40, 60]
    },
    borderColor = ["#cdcdcd", "#cdcdcd", "#cdcdcd", "#cdcdcd"];

/**
 * Adds a chapter to the report.
 * @param {String} text - The name of the report.
 * @returns {void}
 */
function addChapter (text) {
    docDefinition.content.push({text, decoration: "underline", fontSize: 14, bold: true, pageBreak: "before"});
    docDefinition.content.push("\n");
}

/**
 * Adds a headline to the report.
 * @param {String} text - The name of the headline.
 * @returns {void}
 */
function addHeadline (text) {
    docDefinition.content.push({text, fontSize: 11, bold: true, margin: [0, 2]});
}

/**
 * Adds a table to the report.
 * @param {Array[]} body - The content of a table.
 * @param {Number} width - The width of the first column.
 */
function addTable (body, width) {
    const widths = [];

    body[0].forEach((columns, index) => {
        if (index === 0) {
            widths.push(width);
        }
        else {
            widths.push("*");
        }
    });
    docDefinition.content.push({
        table: {
            headerRows: 1,
            widths,
            body
        }
    });
    docDefinition.content.push("\n\n");
}

/**
 * Gets the columns by the passed names.
 * @param {String[]} columnNames - The names of the columns.
 * @returns {Object[]} The columns
 */
function getColumns (columnNames) {
    const columns = [];

    columnNames.forEach(name => {
        columns.push({text: name, alignment: "center", fontSize: 11, bold: true, borderColor});
    });
    return columns;
}

/**
 * Adds a cell to the given row.
 * @param {String} text - The value of the cell.
 * @param {Object[]} row - The given row.
 * @returns {void}
 */
function addCell (text, row) {
    row.push({text, alignment: "right", fontSize: 11, borderColor});
}

/**
 * Downloads the report as pdf.
 * @param {String} fileName - The name of the report file.
 * @returns {void}
 */
function download (fileName) {
    pdfMake.createPdf(docDefinition, "", "", pdfFonts.pdfMake.vfs).download(fileName);
}

/**
 * Resets the report content.
 * @returns {void}
 */
function resetDocContent () {
    docDefinition.content = [];
}

export {
    addChapter,
    addHeadline,
    addTable,
    getColumns,
    addCell,
    download,
    resetDocContent
};
