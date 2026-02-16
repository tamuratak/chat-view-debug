import * as vscode from 'vscode'
import { LanguageModelChatProvider, LanguageModelChatInformation, LanguageModelChatRequestMessage, ProvideLanguageModelChatResponseOptions, Progress, LanguageModelTextPart } from 'vscode'


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

    provideLanguageModelChatResponse(
        _model: LanguageModelChatInformation,
        messages: readonly LanguageModelChatRequestMessage[],
        _options: ProvideLanguageModelChatResponseOptions,
        progress: Progress<vscode.LanguageModelResponsePart2>
    ) {
        const lastMessage = messages[messages.length - 1]
        if (lastMessage.role === vscode.LanguageModelChatMessageRole.User) {
            for (const part of lastMessage.content) {
                if (part instanceof vscode.LanguageModelTextPart) {
                    progress.report(new LanguageModelTextPart(part.value))
                }
            }
        }
        return Promise.resolve()
    }

    async provideTokenCount() {
        return 1
    }

}
