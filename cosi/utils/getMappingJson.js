import axios from "axios";

/**
 * Returns the mapping array.
 * @returns {Promise<object[]>} Context object
 */
export default async function getMappingJson () {
    const response = await axios.get("assets/mapping.json", {
        headers: {
            "Content-Type": "application/json"
        }
    })
        .then(res => res.data)
        .catch(error => {
            console.error(error);
        });

    return Array.isArray(response) ? response : [];
}
