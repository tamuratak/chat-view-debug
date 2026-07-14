import * as vscode from 'vscode'
import { sleep } from './utils.js'


export class EchoChatParticipant {

    getHandler(): vscode.ChatRequestHandler {
        return async (
            request: vscode.ChatRequest,
            _context: vscode.ChatContext,
            stream: vscode.ChatResponseStream
        ) => {
            const input = request.prompt ?? ''
            stream.markdown('**Echo Chat Participant**\n\n')

            const instructions = parsePromptLines(input)
            for (const instruction of instructions) {
                await dispatchDirective(instruction, stream, request)
                await sleep(500) // Simulate some delay between directives
            }
        }
    }

}

interface ParsedDirective {
    directive: string;
    payload: string | undefined;
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
            const payload = rest.join(':').trim() || undefined
            return {
                directive: directive || 'markdown',
                payload,
                index
            }
        })
}

let currentToolCallId: string | undefined = undefined

// Dispatch the parsed directive to the corresponding stream call, supplying defaults when needed.
async function dispatchDirective(
    parsed: ParsedDirective,
    stream: vscode.ChatResponseStream,
    request: vscode.ChatRequest
): Promise<void> {
    const reference = getFileReferenceUri(request.references)
    const payload = parsed.payload?.replace(/\\n/g, '\n')
    switch (parsed.directive) {
        case 'markdown': {
            const md = payload || 'hello'
            stream.markdown(md + '\n')
            return
        }
        case 'textedit': {
            if (reference) {
                const edit = vscode.TextEdit.insert(new vscode.Position(0, 0), payload ?? 'text edit')
                stream.textEdit(reference, [edit])
            }
            return
        }
        case 'toolcall': {
            await vscode.lm.invokeTool('cvdtool', { toolInvocationToken: request.toolInvocationToken, input: { input: payload ?? 'default input' } })
            return
        }
        case 'toolcall2': {
            const part1 = new vscode.ChatToolInvocationPart('my-tool', 'call-1');
            part1.enablePartialUpdate = true;
            part1.isComplete = false;
            part1.invocationMessage = 'Running tool...';
            stream.push(part1);
            const part2 = new vscode.ChatToolInvocationPart('my-tool', 'call-1');
            part2.enablePartialUpdate = true;
            part2.isComplete = true;
            part2.pastTenseMessage = 'Tool completed';
            stream.push(part2);
            return
        }
        case 'begintoolinvocation': {
            currentToolCallId = `cvdtool-${parsed.index}`
            stream.beginToolInvocation(currentToolCallId, 'cvdtool', { partialInput: JSON.stringify({ input: payload ?? 'begin stream input' }) })
            return
        }
        case 'updateToolInvocation': {
            if (currentToolCallId) {
                stream.updateToolInvocation(currentToolCallId, { partialInput: JSON.stringify({ input: payload ?? 'updated input' }) })
            }
            return
        }
        case 'codeblockuri': {
            const ref = reference ?? vscode.Uri.parse('file:///tmp/tmp.txt')
            stream.codeblockUri(ref, false)
            return
        }
        case 'codeblockuriisedit': {
            const ref = reference ?? vscode.Uri.parse('file:///tmp/tmp.txt')
            stream.codeblockUri(ref, true)
            return
        }
        case 'progress': {
            stream.progress(payload ?? 'Working ...')
            return
        }
        case 'progresserror': {
            stream.progress('Working ...', async () => { await sleep(10);throw new Error('Something went wrong') })
            return
        }
        case 'thinkingprogress': {
            stream.thinkingProgress({ id: `thinking-${parsed.index}`, text: payload ?? ['Thinking ...'] })
            return
        }
        case 'reference': {
            const ref = reference ?? vscode.Uri.parse('file:///tmp/tmp.txt')
            stream.reference(ref)
            return
        }
        case 'warning': {
            stream.warning(payload ?? 'warning')
            return
        }
        case 'confirmation': {
            stream.confirmation(
                'Confirmation required',
                payload ?? 'confirmation',
                { directive: parsed.directive, index: parsed.index },
                ['Accept', 'Reject']
            )
            return
        }
        case 'questioncarousel': {
            await stream.questionCarousel(
                [
                    {
                        id: `question-${parsed.index}`,
                        type: vscode.ChatQuestionType.Text,
                        title: payload ?? 'Question carousel',
                        message: 'Reply to continue the echo test'
                    }
                ],
                true
            )
            return
        }
        default: {
            return
        }
    }
}

function getFileReferenceUri(references: readonly vscode.ChatPromptReference[]): vscode.Uri | undefined {
    for (const reference of references) {
        if (reference.value instanceof vscode.Uri) {
            if (vscode.workspace.getWorkspaceFolder(reference.value)) {
                return reference.value
            }
        }
    }
    return undefined
}
