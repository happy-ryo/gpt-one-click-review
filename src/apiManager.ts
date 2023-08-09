import * as vscode from 'vscode';
import OpenAI from 'openai';
import { getWebViewPanel } from './webViewManager';

export async function getReview(selectedText: string, fileExtension: string, model: string, context: vscode.ExtensionContext) {
    const prompt = `
    Please review the code written in ${fileExtension} as a professional and return the results as an HTML file following the format below.
    Insert line breaks as appropriate for each item and separate paragraphs using <p> tags.
    Make titles and item numbers bold and underline them for clarity.
    Ensure that every sentence ends with a <br>.
    For programming code, ensure each line ends with a <br>.
    When suggesting modifications to the source code, ensure they match the format of the code being reviewed.
    Rate each point of feedback on a scale from 1 to 10. A score of 1 indicates that no change is necessary, but caution is advised. A score of 5 suggests that modifications would be beneficial, and a score of 10 emphasizes the need for corrections. Please include this score alongside each point of feedback.
    The review should be conducted in Japanese.
    
    Title: <h2>Title</h2>
    Item: <b>Bold</b><br>
    Line break: </br>
    Programming code: <code style="background-color:white;color:black;"><pre style="background-color:white;color:black;">Code</pre></code><br>
    `;

    const openai = new OpenAI({ apiKey: getOpenAiApiKey() });

    const stream = await openai.chat.completions.create({
        model: model,
        messages: [
            { "role": "system", "content": prompt },
            { "role": "user", "content": selectedText }
        ],
        max_tokens: 5000,
        stream: true,
    });

    let webViewPanel = getWebViewPanel(context);

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

        console.log(text);
    }

    if (buffer.length > 0) {
        const combinedContent = buffer.join('');
        const currentContent = webViewPanel.webview.html;
        const newContent = currentContent.replace('</body>', `${combinedContent}</body>`);
        webViewPanel.webview.html = newContent;
    }
}

const getOpenAiApiKey = (): string => {
    const config = vscode.workspace.getConfiguration('gpt-one-click-review');
    const key = config.get('openaiApiKey');
    if (key === undefined || key === '') {
        vscode.window.showErrorMessage('Please set your OpenAI API key in the settings');
        throw new Error('OpenAI API key not set');
    } else {
        if (typeof key !== 'string') {
            vscode.window.showErrorMessage('OpenAI API key is not a string');
            throw new Error('OpenAI API key is not a string');
        }
        return key;
    }
}
