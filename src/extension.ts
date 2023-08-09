// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Configuration, OpenAIApi } from 'openai';
let webViewPanel: vscode.WebviewPanel | undefined = undefined;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "gpt-one-click-review" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('gpt-one-click-review.helloWorld', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        vscode.window.showInformationMessage('Hello World from GPT One Click Review!');
    });

    context.subscriptions.push(disposable);

}

async function getReview(selectedText: string, fileExtension: string): Promise<string> {
    const prompt = `以下の${fileExtension}で書かれたコードをプロフェッショナルとしてレビューしてください、結果はHTMLとして返してください、Bodyタグ内に挿入される前提で項目毎に適宜PタグやBRタグ、プログラミングコードの部分はCodeタグで囲んで白背景で黒文字にし適切に整形してください。
    タイトルや項目のナンバーは太文字にして下線を引きわかりやすくしてください。日本語でやさしいレビューをお願いします。:\n\n${selectedText}`;

    const configuration = new Configuration({
        apiKey: getOpenAiApiKey(),
    });

    const openai = new OpenAIApi(configuration);

    const chatCompletion = await openai.createChatCompletion({
        model: "gpt-4",
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

function getFileExtension(): string {
    let editor = vscode.window.activeTextEditor;
    if (editor) {
        let document = editor.document.uri.fsPath;
        return require('path').extname(document);
    }
    return '';
}

function getSelectedText(): string {
    const editor = vscode.window.activeTextEditor;
    if (editor === undefined) {
        vscode.window.showErrorMessage('No active editor');
        throw new Error('No active editor');
    } else {
        const selectedText = editor.document.getText(editor.selection);
        if (selectedText === '') {
            vscode.window.showErrorMessage('No text selected');
            throw new Error('No text selected');
        } else {
            return selectedText;
        }
    }
}


function getOpenAiApiKey(): string {
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

function startLoading(): void {
    if (!webViewPanel) {
        webViewPanel = initializeWebViewPanel();
    }
    webViewPanel.webview.html = `
<html>
    <head>
        <!-- 必要に応じてスタイルを追加 -->
        <style>
            .loading-indicator {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                font-size: 24px;
            }
        </style>
    </head>
    <body>
        <div class="loading-indicator">
            Loading...
        </div>
    </body>
</html>`;
}

function initializeWebViewPanel(): vscode.WebviewPanel {
    webViewPanel = vscode.window.createWebviewPanel(
        'codeReview',
        'Code Review',
        vscode.ViewColumn.Beside,
        {}
    );
    return webViewPanel;
}

// This method is called when your extension is deactivated
export function deactivate() { }
