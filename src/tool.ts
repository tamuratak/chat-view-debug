import * as vscode from 'vscode'
import { LanguageModelTool, LanguageModelToolInvocationPrepareOptions, PreparedToolInvocation, ProviderResult } from 'vscode';
export interface CvdInput {
    input: string;
}

export class CvdTool implements LanguageModelTool<CvdInput> {

    prepareInvocation(options: LanguageModelToolInvocationPrepareOptions<CvdInput>): ProviderResult<PreparedToolInvocation> {
        return {
            confirmationMessages: {
                title: 'CVD Tool Invocation',
                message: `Do you want to invoke the CVD tool with input: "${options.input.input}"?`
            },
            invocationMessage: 'Invoking CVD tool...'
        }
    }

    invoke(options: vscode.LanguageModelToolInvocationOptions<CvdInput>): ProviderResult<vscode.LanguageModelToolResult> {
        return new vscode.LanguageModelToolResult([new vscode.LanguageModelTextPart('CVD Tool received input: ' + options.input.input)]);
    }

}
