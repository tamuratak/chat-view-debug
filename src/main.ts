import * as vscode from 'vscode'
import { EchoChatParticipant } from './echo.js'
import { CvdTool } from './tool.js'
import { EchoChatProvider, StreamChatProvider } from './llm.js'

export function activate() {
    const participant = new EchoChatParticipant()
    vscode.chat.createChatParticipant('echo.chatParticipant', participant.getHandler())
    vscode.lm.registerTool('cvdtool', new CvdTool())
    const echoProvider = new EchoChatProvider()
    vscode.lm.registerLanguageModelChatProvider('chat-view-debug', echoProvider)
    const streamProvider = new StreamChatProvider()
    vscode.lm.registerLanguageModelChatProvider('chat-view-debug-stream', streamProvider)
}
