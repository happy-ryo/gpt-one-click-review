import * as vscode from 'vscode';
export let webViewPanel: vscode.WebviewPanel | undefined = undefined;

export const startLoading = (content: vscode.ExtensionContext) => {
    webViewPanel = getWebViewPanel(content);
    webViewPanel.webview.html = `
    <html>
    <head></head>
    <body>
        <div id="content"></div>
        <script>
            window.addEventListener('message', event => {
                const message = event.data; 
                const contentElement = document.getElementById('content');
                contentElement.innerHTML += message;
            });
        </script>
    </body>
    </html>
`;
}
export const getWebViewPanel = (content: vscode.ExtensionContext): vscode.WebviewPanel => {
    if (!webViewPanel) {
        webViewPanel = vscode.window.createWebviewPanel(
            'codeReview',
            'Code Review',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
            }
        );
        webViewPanel.onDidDispose(() => {
            webViewPanel = undefined;
        }, undefined, content.subscriptions);
    }
    return webViewPanel;
}
