import * as vscode from 'vscode'

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export class EchoChatParticipant {

    getHandler(): vscode.ChatRequestHandler {
        return async (
            request: vscode.ChatRequest,
            _context: vscode.ChatContext,
            stream: vscode.ChatResponseStream,
            token: vscode.CancellationToken
        ) => {
            const input = request.prompt ?? ''
            stream.markdown('**Echo Chat Participant**\n\n')

            const instructions = parsePromptLines(input)
            for (const instruction of instructions) {
                await dispatchDirective(instruction, stream, request, token)
                await sleep(500) // Simulate some delay between directives
            }
        }
    }

}

type ParsedDirective = {
    directive: string;
    payload: string;
    index: number;
};

// Split the prompt into directive/payload pairs so each line can drive a stream helper.
function parsePromptLines(input: string): ParsedDirective[] {
    return input.split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map((line, index) => {
            const [rawDirective, ...rest] = line.split(':')
            const directive = (rawDirective ?? '').trim().toLowerCase()
            const payload = rest.join(':').trim()
            return {
                directive: directive || 'markdown',
                payload,
                index
            }
        })
}

// Dispatch the parsed directive to the corresponding stream call, supplying defaults when needed.
async function dispatchDirective(
    parsed: ParsedDirective,
    stream: vscode.ChatResponseStream,
    request: vscode.ChatRequest,
    token: vscode.CancellationToken
): Promise<void> {
    const payload = parsed.payload || getDefaultPayload(parsed.directive, parsed.index)
    switch (parsed.directive) {
        case 'markdown':
            stream.markdown(payload)
            return
        case 'textedit': {
            const reference = request.references?.[0].value
            if (reference instanceof vscode.Uri) {
                const edit = vscode.TextEdit.insert(new vscode.Position(0, 0), payload)
                stream.textEdit(reference, [edit])
            }
            return
        }
        case 'toolcall': {
            await vscode.lm.invokeTool('cvdtool', {  toolInvocationToken: request.toolInvocationToken, input: { input: payload } })
            return
        }
        case 'progress':
            stream.progress(payload)
            return
        case 'thinkingprogress':
            stream.thinkingProgress({ id: `thinking-${parsed.index}`, text: payload })
            return
        case 'warning':
            stream.warning(payload)
            return
        case 'confirmation':
            stream.confirmation('Confirmation required', payload, { directive: parsed.directive, index: parsed.index }, ['Accept', 'Reject'])
            return
        case 'questioncarousel':
            await stream.questionCarousel(
                [
                    {
                        id: `question-${parsed.index}`,
                        type: vscode.ChatQuestionType.Text,
                        title: payload,
                        message: 'Reply to continue the echo test'
                    }
                ],
                true
            )
            return
        default:
            stream.markdown(payload)
            return
    }
}

// Provide a fallback payload when the directive payload is empty.
function getDefaultPayload(directive: string, index: number): string {
    switch (directive) {
        case 'progress':
            return `Running progress for directive #${index + 1}`
        case 'thinkingprogress':
            return `Thinking update #${index + 1}`
        case 'warning':
            return `Warning generated for directive #${index + 1}`
        case 'confirmation':
            return `Confirm directive #${index + 1}`
        case 'questioncarousel':
            return `Question carousel prompt #${index + 1}`
        default:
            return `
Echo directive #${index + 1}
~~~ts
// This is a default payload for the "${directive}" directive.
console.log('Hello from directive #${index + 1}');
~~~

`
    }
}