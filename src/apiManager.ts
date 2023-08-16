import * as vscode from 'vscode';
import OpenAI from 'openai';
import { getWebViewPanel } from './webViewManager';
import { calculateTokenRemainde } from './openaiHelper';
const DEFAULT_LANGUAGE = 'English';

export async function getReview(selectedText: string, fileExtension: string, model: string, context: vscode.ExtensionContext) {
    const prompt = `
    Please thoroughly review the code written in ${fileExtension} as a professional and return the results as an HTML file following the format below:</br></br>
    Please limit your praise of the good parts to five items.</br></br>
    Be sure to write sample code for the improvements.</br></br>

    [limitation of the HTML code]
    1. Insert line breaks as appropriate for each item and separate paragraphs using <p> tags. Ensure every item ends with a </br>.
    2. Make titles and item numbers bold and underline them for clarity.
    3. Ensure that every sentence ends with a </br>.
    4. For programming code, ensure each line ends with a </br>.
    5. When suggesting modifications to the source code, ensure they match the format of the code being reviewed.
    6. Rate each point of feedback on a scale from 1 to 10. A score of 1 indicates that no change is necessary, but caution is advised. A score of 5 suggests that modifications would be beneficial, and a score of 10 emphasizes the need for corrections. Please include this score alongside each point of feedback.No score is required for positive feedback.
    7. The review should be conducted in ${getLanguageSetting()}.

    Title: <h2>Title</h2></br>
    Item: <b>Bold</b></br>
    Line break: </br></br>
    Programming code: <code style="background-color:white;color:black;"><pre style="background-color:white;color:black;">Code</pre></code></br>
    `;

    const openai = new OpenAI({ apiKey: getOpenAiApiKey() });

    try {
        const stream = await openai.chat.completions.create({
            model: model,
            messages: [
                { "role": "system", "content": prompt },
                { "role": "user", "content": selectedText }
            ],
            max_tokens: calculateTokenRemainde(selectedText.concat(prompt), model),
            stream: true,
            temperature: 0.7,
        });

        let webViewPanel = getWebViewPanel(context);
        webViewPanel.reveal();

        let buffer: string[] = [];

        for await (const message of stream) {
            let text = message.choices[0].delta;
            if (text === undefined || text === null || text.content === undefined || text.content === null) {
                continue;
            }

            buffer.push(text.content);

            if (buffer.length === 50) {
                const combinedContent = buffer.join('');
                const currentContent = webViewPanel.webview.html;
                const newContent = currentContent.replace('</body>', `${combinedContent}</body>`);
                webViewPanel.webview.html = newContent;

                buffer = [];
            }
        }

        if (buffer.length > 0) {
            const combinedContent = buffer.join('');
            const currentContent = webViewPanel.webview.html;
            const newContent = currentContent.replace('</body>', `${combinedContent}</body>`);
            webViewPanel.webview.html = newContent;
        }
    } catch (error) {
        vscode.window.showErrorMessage('An error occurred while calling the OpenAI API');
    }
}

const getOpenAiApiKey = (): string => {
    const configuration = vscode.workspace.getConfiguration('gpt-one-click-review');
    const key = configuration.get('openaiApiKey');
    if (!key || typeof key !== 'string') {
        vscode.window.showErrorMessage('Please set your OpenAI API key in the settings');
        throw new Error('OpenAI API key not set');
    }

    return key;
};

const getLanguageSetting = (): string => {
    try {
        const configuration = vscode.workspace.getConfiguration('gpt-one-click-review');
        return configuration.get('responseLanguage') || DEFAULT_LANGUAGE;
    } catch (error) {
        console.error('Error while getting language setting: ', error);
        return DEFAULT_LANGUAGE;
    }
}