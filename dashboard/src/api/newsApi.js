const DEFAULT_TIMEOUT_MS = 12_000;

export class NewsApiError extends Error {
    constructor(message, { status = null, cause = null } = {}) {
        super(message, { cause });
        this.name = "NewsApiError";
        this.status = status;
    }
}

export function normalizeApiBase(url) {
    if (!url) return "";
    return url.trim().replace(/\/+$/, "").replace(/\/(predict|health)$/i, "");
}

async function fetchJson(
    url,
    options = {},
    { timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl = globalThis.fetch, signal } = {},
) {
    const controller = new AbortController();
    let timedOut = false;
    const abortRequest = () => controller.abort();
    const timeoutId = setTimeout(() => {
        timedOut = true;
        controller.abort();
    }, timeoutMs);

    signal?.addEventListener("abort", abortRequest, { once: true });

    try {
        const response = await fetchImpl(url, { ...options, signal: controller.signal });
        if (!response.ok) {
            throw new NewsApiError(`NewsSnap API returned HTTP ${response.status}.`, {
                status: response.status,
            });
        }
        return await response.json();
    } catch (error) {
        if (error instanceof NewsApiError) throw error;
        if (timedOut) {
            throw new NewsApiError(`NewsSnap API did not respond within ${timeoutMs / 1000} seconds.`, {
                cause: error,
            });
        }
        if (signal?.aborted) {
            throw error;
        }
        throw new NewsApiError("NewsSnap API could not be reached.", { cause: error });
    } finally {
        clearTimeout(timeoutId);
        signal?.removeEventListener("abort", abortRequest);
    }
}

export async function checkApiHealth(apiBase, options = {}) {
    const payload = await fetchJson(`${normalizeApiBase(apiBase)}/health`, {}, options);
    return payload?.mode ?? null;
}

export async function requestPrediction(apiBase, text, options = {}) {
    const payload = await fetchJson(
        `${normalizeApiBase(apiBase)}/predict`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
        },
        options,
    );

    const prediction = payload?.predictions?.[0];
    if (!prediction || typeof prediction.label !== "string" || !prediction.probabilities) {
        throw new NewsApiError("NewsSnap API returned an invalid prediction payload.");
    }

    return { ...prediction, mode: payload.mode ?? "unknown" };
}
