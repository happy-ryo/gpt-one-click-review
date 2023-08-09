import * as vscode from 'vscode';
import { webViewPanel } from './extension';

export const startLoading = (content: vscode.ExtensionContext) => {
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
export const getWebViewPanel = (content: vscode.ExtensionContext): vscode.WebviewPanel => {
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
