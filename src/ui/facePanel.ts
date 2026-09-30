import * as vscode from'vscode' ;
import { ActivityState } from '../state/activityState';
import { getMood } from '../mood/moodEngine';

export class FaceViewProvider implements vscode.WebviewViewProvider{

    private latestState : ActivityState;
    private webViewView : vscode.WebviewView | undefined ;

    constructor(private readonly extensionUri:vscode.Uri , initialState:ActivityState ){
        this.latestState = {...initialState}; 
    }
    update(state: ActivityState): void {
        this.latestState = {...state};
        const mood = getMood(this.latestState);
        this.webViewView?.webview.postMessage({
            type:"state",
            state: this.latestState,
            mood
        });
    }
    
    async resolveWebviewView(
        webviewView: vscode.WebviewView, 
        context: vscode.WebviewViewResolveContext, 
        token: vscode.CancellationToken): Promise<void> {
        
        this.webViewView = webviewView;

        const mediaUri = vscode.Uri.joinPath(this.extensionUri ,'src','ui', 'media');

        webviewView.webview.options = {
            enableScripts:true,
            localResourceRoots:[
                mediaUri
            ]
        };
        webviewView.webview.onDidReceiveMessage((message) => {
            if (message.type === "ready") {

                webviewView.webview.postMessage({
                    type: "state",
                    state: this.latestState,
                });
            }
        });    
        const htmlUri = vscode.Uri.joinPath(mediaUri,"face.html");

        const cssUri = vscode.Uri.joinPath(mediaUri,'face.css');
        const cssWebViewUri = webviewView.webview.asWebviewUri(cssUri);

        const jsUri = vscode.Uri.joinPath(mediaUri,'face.js');
        const jsWebViewUri = webviewView.webview.asWebviewUri(jsUri);

        const htmlFile = await vscode.workspace.fs.readFile(htmlUri);
        const html = new TextDecoder().decode(htmlFile)
        .replaceAll("__CSP_SOURCE__" , webviewView.webview.cspSource)
        .replace("__CSS_URI__",cssWebViewUri.toString())
        .replace("__JS_URI__",jsWebViewUri.toString());
        webviewView.webview.html = html;
    }
}