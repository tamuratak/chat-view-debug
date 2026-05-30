import * as vscode from 'vscode'
import { LanguageModelChatProvider, LanguageModelChatInformation, LanguageModelChatRequestMessage, ProvideLanguageModelChatResponseOptions, Progress, LanguageModelTextPart, LanguageModelThinkingPart } from 'vscode'
import { sleep, sleepCancellable } from './utils'


export class EchoChatProvider implements LanguageModelChatProvider<LanguageModelChatInformation> {
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
                isUserSelectable: true
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

    provideTokenCount() {
        return Promise.resolve(1)
    }

}

function extractUserRequest(text: string): string {
    const match = /<userRequest>(.*?)<\/userRequest>/s.exec(text)
    if (match) {
        return match[1]
    }
    return 'user request not found in message'
}

export class StreamChatProvider implements LanguageModelChatProvider<LanguageModelChatInformation> {
    provideLanguageModelChatInformation(): vscode.ProviderResult<vscode.LanguageModelChatInformation[]> {
        return [
            {
                id: 'chat-view-debug-stream',
                name: 'Chat View Debug Stream',
                family: 'chat-view-debug-stream',
                version: 'chat-view-debug-stream',
                capabilities: {
                    toolCalling: true
                },
                maxInputTokens: 1000000,
                maxOutputTokens: 10000,
                isUserSelectable: true
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
                        const [rawDirective, ...rest] = res.split(':')
                        const directive = (rawDirective ?? '').trim().toLowerCase()
                        const payload = rest.join(':').trim().replace(/\\n/g, '\n') + '\n' || undefined
                        if (directive === 'markdown') {
                            progress.report(new LanguageModelTextPart(payload ?? ''))
                        } else if (directive === 'thinking') {
                            progress.report(new LanguageModelThinkingPart([], 'dummyId'))
                        }
                        await sleep(10) // Simulate some delay between lines
                    }
                }
            }
        }
        return
    }

    provideTokenCount() {
        return Promise.resolve(1)
    }

}

export class SleepChatProvider implements LanguageModelChatProvider<LanguageModelChatInformation> {
    provideLanguageModelChatInformation(): vscode.ProviderResult<vscode.LanguageModelChatInformation[]> {
        return [
            {
                id: 'chat-view-debug-sleep',
                name: 'Chat View Debug Sleep',
                family: 'chat-view-debug-sleep',
                version: 'chat-view-debug-sleep',
                capabilities: {
                    toolCalling: true
                },
                maxInputTokens: 1000000,
                maxOutputTokens: 10000,
                isUserSelectable: true
            }
        ]
    }

    async provideLanguageModelChatResponse(
        _model: LanguageModelChatInformation,
        _messages: readonly LanguageModelChatRequestMessage[],
        _options: ProvideLanguageModelChatResponseOptions,
        progress: Progress<vscode.LanguageModelResponsePart2>,
        token: vscode.CancellationToken
    ) {
        const SLEEP_MS = 3000
        const cancelled = await sleepCancellable(SLEEP_MS, token)
        if (cancelled) {
            console.log('Woken up! (Cancelled)\n')
        } else {
            progress.report(new LanguageModelTextPart('Woke up! (Slept for 3 seconds)\n'))
            console.log('Woke up! (Slept for 3 seconds)\n')
        }
    }

    provideTokenCount() {
        return Promise.resolve(1)
    }
}
