import * as vscode from 'vscode'
import { EchoChatParticipant } from './echo.js'
import { CvdTool } from './tool.js'

export function activate() {
    const participant = new EchoChatParticipant()
    vscode.chat.createChatParticipant('echo.chatParticipant', participant.getHandler())
    vscode.lm.registerTool('cvdtool', new CvdTool())
}
