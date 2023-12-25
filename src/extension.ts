// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { getGpt4Review, getGpt3Review } from './apiManager';
import { startLoading } from './webViewManager';
import * as path from 'path';
import { getModelNumber, GptModel } from './openaiHelper';

export function activate(context: vscode.ExtensionContext) {
    subscriptionReviewCode(context, GptModel.gpt4);
    subscriptionReviewCode(context, GptModel.gpt3);
}

const subscriptionReviewCode = (context: vscode.ExtensionContext, modelType: GptModel) => {
    const reviewCode = vscode.commands.registerCommand(`gpt-one-click-review.reviewCode${getModelNumber(modelType)}`, async () => {
        const selectedText = getSelectedText();
        const fileExtension = getFileExtension();
        startLoading(context);

        if (modelType === GptModel.gpt4) {
            getGpt4Review(selectedText, fileExtension, context);
        } else if (modelType === GptModel.gpt3) {
            getGpt3Review(selectedText, fileExtension, context);
        } else {
            throw new Error(`Invalid model: ${modelType}`);
        }
    });
    context.subscriptions.push(reviewCode);
    return undefined;
};

const getFileExtension = (): string => {
    const editor = vscode.window.activeTextEditor;
    if (editor === undefined) {
        vscode.window.showErrorMessage('No active editor');
        throw new Error('No active editor');
    }
    const filePath = editor.document.uri.fsPath;
    return path.extname(filePath);
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

// This method is called when your extension is deactivated
export function deactivate() { }
