type LoadingHandler = {
    show: (message?: string) => void
    hide: () => void
}

let handler: LoadingHandler | null = null

let requestCount = 0
let timeout: any = null

export function registerLoadingHandler(newHandler: LoadingHandler) {
    handler = newHandler
}

export function showGlobalLoading(message?: string) {

    requestCount++

    if (requestCount === 1) {
        timeout = setTimeout(() => {
            handler?.show(message)
        }, 200)
    }
}

export function hideGlobalLoading() {

    requestCount = Math.max(0, requestCount - 1)

    if (requestCount === 0) {
        clearTimeout(timeout)
        handler?.hide()
    }
}