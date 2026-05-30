import * as vscode from 'vscode'

export async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Sleep for `ms` milliseconds, but resolve early if the token is cancelled.
 * Returns `true` if the sleep was interrupted by cancellation, `false` if it completed naturally.
 */
export async function sleepCancellable(ms: number, token: vscode.CancellationToken): Promise<boolean> {
    return new Promise<boolean>(resolve => {
        const timer = setTimeout(() => {
            tokenListener.dispose()
            resolve(false)
        }, ms)
        const tokenListener = token.onCancellationRequested(() => {
            clearTimeout(timer)
            resolve(true)
        })
    })
}
