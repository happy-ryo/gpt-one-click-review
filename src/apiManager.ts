import * as vscode from 'vscode';
import { Configuration, OpenAIApi } from 'openai';

export async function getReview(selectedText: string, fileExtension: string, model: string): Promise<string> {
    const prompt = `以下の${fileExtension}で書かれたコードをプロフェッショナルとしてレビューしてください、結果はHTMLとして返してください、項目毎に適宜PタグやBRタグ、プログラミングコードの部分はCodeタグで囲んで白背景で黒文字にし適切に整形してください。
    タイトルや項目のナンバーは太文字にして下線を引きわかりやすくしてください。レビューは日本語で行ってください。:\n\n${selectedText}`;

    const configuration = new Configuration({
        apiKey: getOpenAiApiKey(),
    });

    const openai = new OpenAIApi(configuration);

    const chatCompletion = await openai.createChatCompletion({
        model: model,
        messages: [{ role: "user", content: prompt }],
    });

    const review = chatCompletion.data.choices[0].message?.content;

    if (review === undefined) {
        vscode.window.showErrorMessage('OpenAI API response is undefined');
        throw new Error('OpenAI API response is undefined');
    } else {
        if (typeof review !== 'string') {
            vscode.window.showErrorMessage('OpenAI API response is not a string');
            throw new Error('OpenAI API response is not a string');
        }
        return review;
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
