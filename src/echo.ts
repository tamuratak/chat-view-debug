import * as vscode from 'vscode'

export class EchoChatParticipant {

    getHandler(): vscode.ChatRequestHandler {
        return async (
            _request: vscode.ChatRequest,
            _context: vscode.ChatContext,
            stream: vscode.ChatResponseStream
        ) => {
            stream.markdown('**Echo Chat Participant**\n\n')
        }
    }

}