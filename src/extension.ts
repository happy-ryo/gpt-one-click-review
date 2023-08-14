// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { getReview } from './apiManager';
import { startLoading } from './webViewManager';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    subscriptionReviewCode(context, 'gpt-4');
    subscriptionReviewCode(context, 'gpt-3.5-turbo-16k');
}

const subscriptionReviewCode = (context: vscode.ExtensionContext, modelType: string) => {
    const reviewCode = vscode.commands.registerCommand(`gpt-one-click-review.reviewCode${getModelNumber(modelType)}`, async () => {
        const selectedText = getSelectedText();
        const fileExtension = getFileExtension();
        startLoading(context);

        getReview(selectedText, fileExtension, modelType, context);
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
