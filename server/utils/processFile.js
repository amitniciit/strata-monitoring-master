const fs = require('fs/promises');
const path = require('path');
async function processAFile(filePath) {
    try {
        console.log("initiating processAfile")
        const fullPath = path.resolve(filePath);
        const fileContent = await fs.readFile(fullPath, 'utf-8');
        const panelData = JSON.parse(fileContent);
        console.log(panelData)
        await fs.unlink(fullPath);
        return panelData;
    } catch (err) {
        throw new Error(`Error processing file: ${err.message}`);
    }
}
module.exports = { processAFile }