import * as vscode from 'vscode'
import { LanguageModelChatProvider, LanguageModelChatInformation, LanguageModelChatRequestMessage, ProvideLanguageModelChatResponseOptions, Progress, LanguageModelTextPart } from 'vscode'
import { sleep } from './utils'


export class ChatViewDebugChatProvider implements LanguageModelChatProvider<LanguageModelChatInformation> {
    provideLanguageModelChatInformation(): vscode.ProviderResult<vscode.LanguageModelChatInformation[]> {
        return [
            {
                id: 'chat-view-debug-echo',
                name: 'Chat View Debug Echo',
                family: 'chat-view-debug-echo',
                version: 'chat-view-debug-echo',
                capabilities: {
                    toolCalling: true
                },
                maxInputTokens: 1000000,
                maxOutputTokens: 10000,
            }
        ]
    }

    async provideLanguageModelChatResponse(
        _model: LanguageModelChatInformation,
        messages: readonly LanguageModelChatRequestMessage[],
        _options: ProvideLanguageModelChatResponseOptions,
        progress: Progress<vscode.LanguageModelResponsePart2>
    ) {
        const lastMessage = messages[messages.length - 1]
        if (lastMessage.role === vscode.LanguageModelChatMessageRole.User) {
            for (const part of lastMessage.content) {
                if (part instanceof vscode.LanguageModelTextPart) {
                    const userRequest = extractUserRequest(part.value)
                    const resArray = userRequest.split('\n')
                    for (const res of resArray) {
                        progress.report(new LanguageModelTextPart(res+'\n'))
                        await sleep(10) // Simulate some delay between lines
                    }
                }
            }
        }
        return
    }

    async provideTokenCount() {
        return 1
    }

}

function extractUserRequest(text: string): string {
    const match = /<userRequest>(.*?)<\/userRequest>/s.exec(text)
    if (match) {
        return match[1]
    }
    return 'user request not found in message'
}
