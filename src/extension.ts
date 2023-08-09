// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { getReview } from './apiManager';
import { startLoading, getWebViewPanel, webViewPanel } from './webViewManager';
import * as path from 'path';

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
    subscriptionReviewCode(context, 'gpt-3.5-turbo-16k');
}

const subscriptionReviewCode = (context: vscode.ExtensionContext, model: string) => {
    let reviewCode = vscode.commands.registerCommand(`gpt-one-click-review.reviewCode${getModelNumber(model)}`, async () => {
        const selectedText = getSelectedText();
        const fileExtension = getFileExtension();
        startLoading(context);

        getReview(selectedText, fileExtension, model, context);
    });
    context.subscriptions.push(reviewCode);
    return undefined;
};

const getFileExtension = (): string => {
    let editor = vscode.window.activeTextEditor;
    if (editor) {
        let document = editor.document.uri.fsPath;
        return path.extname(document);
    }
    return '';
};

const getSelectedText = (): string => {
    const editor = vscode.window.activeTextEditor;
    if (editor === undefined) {
        vscode.window.showErrorMessage('No active editor');
        throw new Error('No active editor');
    }
    const selectedText = editor.document.getText(editor.selection);
    if (selectedText === '') {
        vscode.window.showErrorMessage('No text selected');
        throw new Error('No text selected');
    } else {
        return selectedText;
    }
};

const getModelNumber = (model: string): number => {
    if (model === 'gpt-4') {
        return 4;
    } else {
        return 3;
    }
};

// This method is called when your extension is deactivated
export function deactivate() { }
