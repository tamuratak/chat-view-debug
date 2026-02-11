import * as vscode from 'vscode'
import { EchoChatParticipant } from './echo.js'

export function activate() {
    const participant = new EchoChatParticipant()
    vscode.chat.createChatParticipant('echo.chatParticipant', participant.getHandler())
}
