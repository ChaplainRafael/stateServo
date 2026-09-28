import * as vscode from 'vscode';

import {
    activityState
} from './state/activityState';

import {
    FaceViewProvider
} from './ui/facePanel';

import {
    getMood,
    Mood
} from './mood/moodEngine';

const TYPING_TIMEOUT = 3000;
const INACTIVITY_TIMEOUT = 10000;

export function activate(
    context: vscode.ExtensionContext
) {

    console.log(
        'Code Feelings activated.'
    );

    /*
     * --------------------------------------------------
     * COMMAND
     * --------------------------------------------------
     */

    const disposable =
        vscode.commands.registerCommand(
            'code-feelings.helloWorld',
            () => {

                vscode.window.showInformationMessage(
                    'The Omnissiah watches over you, operator!'
                );
            }
        );

    context.subscriptions.push(
        disposable
    );


    /*
     * --------------------------------------------------
     * FACE PROVIDER
     * --------------------------------------------------
     */

    const faceProvider =
        new FaceViewProvider(
            context.extensionUri,
            activityState
        );

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'code-feelings.wrenchFace',
            faceProvider
        )
    );


    /*
     * --------------------------------------------------
     * HELPERS
     * --------------------------------------------------
     */

    function refreshDiagnostics(
        uri: vscode.Uri | undefined
    ): void {

        if (!uri) {

            activityState.errors = 0;
            activityState.warnings = 0;

            return;
        }

        const diagnostics =
            vscode.languages.getDiagnostics(uri);

        activityState.errors =
            diagnostics.filter(
                diagnostic =>
                    diagnostic.severity ===
                    vscode.DiagnosticSeverity.Error
            ).length;

        activityState.warnings =
            diagnostics.filter(
                diagnostic =>
                    diagnostic.severity ===
                    vscode.DiagnosticSeverity.Warning
            ).length;
    }


    /*
     * Keep track of the last mood we sent.
     * This prevents the timer from spamming
     * the webview unnecessarily.
     */

    let lastPublishedMood: Mood =
        getMood(activityState);


    function publishState(): void {

        faceProvider.update(
             activityState
         );

        lastPublishedMood =
            getMood(activityState);
    }


    /*
     * --------------------------------------------------
     * INITIAL STATE
     * --------------------------------------------------
     */

    const initialEditor =
        vscode.window.activeTextEditor;

        if (initialEditor) {

        activityState.activeFile =
            initialEditor.document.fileName;

        activityState.inactive = false;

        activityState.lastActive =
            Date.now();

        refreshDiagnostics(
            initialEditor.document.uri
        );

    } else {

        activityState.activeFile =
            undefined;

        activityState.inactive = true;

        activityState.errors = 0;
        activityState.warnings = 0;
    }

    publishState();


    /*
     * --------------------------------------------------
     * ACTIVE EDITOR CHANGED
     * --------------------------------------------------
     */

    const changeFile =
        vscode.window.onDidChangeActiveTextEditor(
            (event) => {

                activityState.activeFile =
                    event?.document.fileName;

                activityState.typing =
                    false;

                activityState.lastActive =
                    Date.now();

                activityState.inactive =
                    event === undefined;

                refreshDiagnostics(
                    event?.document.uri
                );
                
                publishState();
            }
        );

    context.subscriptions.push(
        changeFile
    );


    /*
     * --------------------------------------------------
     * DOCUMENT CHANGED
     * --------------------------------------------------
     */

    const typing =
        vscode.workspace.onDidChangeTextDocument(
            (event) => {

                /*
                 * The event can also fire for things
                 * that aren't actual text edits.
                 *
                 * contentChanges tells us whether
                 * the document content changed.
                 */

                if (
                    event.contentChanges.length === 0
                ) {
                    return;
                }

                const activeEditor =
                    vscode.window.activeTextEditor;

                /*
                 * Ignore changes happening in a
                 * background document.
                 */

                if (
                    !activeEditor ||
                    activeEditor.document.uri.toString() !==
                    event.document.uri.toString()
                ) {
                    return;
                }

                activityState.typing =
                    true;

                activityState.inactive =
                    false;

                activityState.lastActive =
                    Date.now();

                refreshDiagnostics(
                    event.document.uri
                );
                publishState();
            }
        );

    context.subscriptions.push(
        typing
    );


    /*
     * --------------------------------------------------
     * SAVE
     * --------------------------------------------------
     */

    const save =
        vscode.workspace.onDidSaveTextDocument(
            (document) => {

                const diagnostics =
                    vscode.languages.getDiagnostics(
                        document.uri
                    );

                activityState.lastSaveHadErrors =
                    diagnostics.some(
                        diagnostic =>
                            diagnostic.severity ===
                            vscode.DiagnosticSeverity.Error
                    );

                activityState.lastSaveTime =
                    Date.now();

                activityState.lastActive =
                    Date.now();

                activityState.inactive =
                    false;

                const activeEditor =
                    vscode.window.activeTextEditor;

                if (
                    activeEditor &&
                    activeEditor.document.uri.toString() ===
                    document.uri.toString()
                ) {
                    refreshDiagnostics(
                        document.uri
                    );
                }

                publishState();
            }
        );

    context.subscriptions.push(
        save
    );


    /*
     * --------------------------------------------------
     * DIAGNOSTICS
     * --------------------------------------------------
     */

    const diagnostics =
        vscode.languages.onDidChangeDiagnostics(
            (event) => {

                const activeEditor =
                    vscode.window.activeTextEditor;

                if (!activeEditor) {
                    return;
                }

                const activeUri =
                    activeEditor.document.uri;

                const changed =
                    event.uris.some(
                        uri =>
                            uri.toString() ===
                            activeUri.toString()
                    );

                if (!changed) {
                    return;
                }

                refreshDiagnostics(
                    activeUri
                );

                publishState();
            }
        );

    context.subscriptions.push(
        diagnostics
    );


    /*
     * --------------------------------------------------
     * INACTIVITY TIMER
     * --------------------------------------------------
     */

    const intervalId =
        setInterval(() => {

            const elapsed =
                Date.now() -
                activityState.lastActive;

            let stateChanged = false;


            /*
             * Typing stops after 3 seconds
             * without an edit.
             */

            if (
                elapsed >= TYPING_TIMEOUT &&
                activityState.typing
            ) {

                activityState.typing =
                    false;

                stateChanged = true;
            }


            /*
             * Full inactivity after 10 seconds.
             */

            if (
                elapsed >= INACTIVITY_TIMEOUT &&
                !activityState.inactive
            ) {

                activityState.inactive =
                    true;

                stateChanged = true;
            }


            /*
             * Save reactions expire after
             * their mood window.
             */

            const currentMood =
                getMood(activityState);


            if (
                stateChanged ||
                currentMood !== lastPublishedMood
            ) {

                publishState();
            }

        }, 1000);


    /*
     * NodeJS.Timeout isn't a VS Code Disposable,
     * so wrap clearInterval inside one.
     */

    context.subscriptions.push(
        new vscode.Disposable(
            () => clearInterval(intervalId)
        )
    );
}


export function deactivate() {}