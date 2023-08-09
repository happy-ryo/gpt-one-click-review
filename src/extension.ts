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

    subscriptionReviewCode(context, 'gpt-4');
    subscriptionReviewCode(context, 'gpt-3.5');
}

function subscriptionReviewCode(context: vscode.ExtensionContext, model: string) {
    let reviewCode = vscode.commands.registerCommand(`gpt-one-click-review.reviewCode${modelNumber(model)}`, async () => {
        const selectedText = getSelectedText();
        const fileExtension = getFileExtension();
        startLoading(context);

        getReview(selectedText, fileExtension, model).then((review) => {
            webViewPanel = getWebViewPanel(context);
            webViewPanel.webview.html = review;
        }).catch((error) => {
            webViewPanel = getWebViewPanel(context);
            webViewPanel.webview.html = `<html><body><h1>Error</h1><p>${error}</p></body></html>`;
        }).finally(() => {
            webViewPanel?.reveal();
        });
    });
    context.subscriptions.push(reviewCode);
    return undefined;
}

async function getReview(selectedText: string, fileExtension: string, model: string): Promise<string> {
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

function startLoading(content: vscode.ExtensionContext): void {
    webViewPanel = getWebViewPanel(content);
    webViewPanel.webview.html = `
    <html>
    <head>
        <style>
            /* ローディングインジケータのスタイル */
            .loader {
                border: 16px solid #f3f3f3;  /* ライトグレー */
                border-top: 16px solid #3498db; /* 青 */
                border-radius: 50%;
                width: 120px;
                height: 120px;
                animation: spin 2s linear infinite;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }

            /* 回転アニメーション */
            @keyframes spin {
                0% { transform: translate(-50%, -50%) rotate(0deg); }
                100% { transform: translate(-50%, -50%) rotate(360deg); }
            }
        </style>
    </head>
    <body>
        <div class="loader"></div>
    </body>
</html>`;
}

function getWebViewPanel(content: vscode.ExtensionContext): vscode.WebviewPanel {
    if (!webViewPanel) {
        webViewPanel = vscode.window.createWebviewPanel(
            'codeReview',
            'Code Review',
            vscode.ViewColumn.Beside,
            {}
        );
        webViewPanel.onDidDispose(() => {
            webViewPanel = undefined;
        }, null, content.subscriptions);
    }
    return webViewPanel;
}

function modelNumber(model: string): number {
    if (model === 'gpt-4') {
        return 4;
    } else {
        return 3;
    }
}

// This method is called when your extension is deactivated
export function deactivate() { }
