/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import OpenAI from 'openai';
import { getWebViewPanel } from './webViewManager';
import { GptModel, calculateTokenRemainde, getOpenAiApiKey, getTempreture } from './openaiHelper';
const DEFAULT_LANGUAGE = 'English';
const DEFAULT_INTERVAL = 50;

export async function getGpt3Review(selectedText: string, fileExtension: string, context: vscode.ExtensionContext) {
    getGpt4Review(selectedText, fileExtension, context);

    // const prompt = ``;
    // const userContent = `Analyze the given ${fileExtension} code for code smells and suggest improvements: ${selectedText}.`;
    // const openai = new OpenAI({ apiKey: getOpenAiApiKey() }); 
    // const tokens = calculateTokenRemainde(userContent.concat(prompt), GptModel.gpt3);
    // await openai.chat.completions.create({
    //     model: GptModel.gpt3,
    //     messages: [
    //         { "role": "system", "content": prompt },
    //         { "role": "user", "content": userContent }
    //     ],
    //     max_tokens: tokens,
    //     temperature: getTempreture(),
    // });
}

export async function getGpt4Review(selectedText: string, fileExtension: string, context: vscode.ExtensionContext) {
    const prompt = `
    Rigorously review the code written in ${fileExtension} as an expert and return the results in an HTML format adhering to the format below:

    [HTML Code Limitations]
    1. Insert line breaks appropriately for each item and divide paragraphs using <p> tags. Finish every item with a </br> without exception.
    2. Bold and underline titles and item numbers for clear distinction.
    3. Ensure every sentence concludes with a </br>.
    4. When proposing modifications to the source code, they must match the format of the code under review.
    5. Rate each feedback point on a scale from 1 to 10. A score of 1 signifies no change is required but be cautious. A score of 5 implies modifications are recommended, and a score of 10 underscores the urgency for corrections.If the evaluation score is 1, 2, 3, or 4, please do not display the review.
    6. It is imperative to conduct the review in ${getLanguageSetting()}.
    7. In the case of PHP, Please also check for compliance with PSR-12.

    Review Title: <h2>{title}</h2></br>
    Review Item: <b>{item}</b></br>
    Programming code: <pre font-size: 140% style="background-color:white;color:black;">{code}</pre></br>

    Write sample code for all improvements without fail.
    `;

    const userContent = `Analyze the given ${fileExtension} code for code smells and suggest improvements: ${selectedText}.`;

    const openai = new OpenAI({ apiKey: getOpenAiApiKey() }); 
    // const tokens = calculateTokenRemainde(userContent.concat(prompt), GptModel.gpt4);

    try {
        const stream = await openai.chat.completions.create({
            model: GptModel.gpt4,
            messages: [
                { "role": "system", "content": prompt },
                { "role": "user", "content": userContent }
            ],
            // max_tokens: tokens,
            stream: true,
            temperature: getTempreture(),
        });

        let webViewPanel = getWebViewPanel(context);
        webViewPanel.reveal();

        let buffer: string[] = [];
        const interval = getReviewUpdateBufferInterval();

        for await (const message of stream) {
            let text = message.choices[0].delta;
            if (text === undefined || text === null || text.content === undefined || text.content === null) {
                continue;
            }

            buffer.push(text.content);

            if (buffer.length === interval) {
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
        console.error('Error while calling OpenAI API: ', error);
        vscode.window.showErrorMessage('An error occurred while calling the OpenAI API');
    }
}


const getLanguageSetting = (): string => {
    try {
        const configuration = vscode.workspace.getConfiguration('gpt-one-click-review');
        const language = configuration.get<string>('responseLanguage') || DEFAULT_LANGUAGE;
        if (language === 'Other') {
            return configuration.get<string>('responseLanguageOther') || DEFAULT_LANGUAGE;
        }
        return language;
    } catch (error) {
        console.error('Error while getting language setting: ', error);
        return DEFAULT_LANGUAGE;
    }
};

const getReviewUpdateBufferInterval = (): number => {
    const configuration = vscode.workspace.getConfiguration('gpt-one-click-review');
    const interval = configuration.get<number>('reviewUpdateBufferInterval');
    if (typeof interval !== 'number' || interval < 1) {
        return DEFAULT_INTERVAL;
    }

    return interval;
};