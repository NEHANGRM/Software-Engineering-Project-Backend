require('dotenv').config();
const fs = require('fs');

async function listModels() {
    try {
        const key = process.env.GEMINI_API_KEY;
        if (!key) {
            fs.writeFileSync('available_models.txt', "❌ No GEMINI_API_KEY found in .env");
            return;
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();

        if (data.error) {
            fs.writeFileSync('available_models.txt', `❌ API Error: ${JSON.stringify(data.error)}`);
            return;
        }

        let output = "✅ Available Models:\n";
        if (data.models) {
            const models = data.models
                .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
                .map(m => m.name.replace('models/', ''));

            output += models.join('\n');
        } else {
            output += "No models found.\nFull response: " + JSON.stringify(data);
        }

        fs.writeFileSync('available_models.txt', output);
        console.log("Written to available_models.txt");

    } catch (error) {
        fs.writeFileSync('available_models.txt', `Script Error: ${error}`);
    }
}

listModels();
