import assert from "node:assert/strict";
import test from "node:test";

import {
    NewsApiError,
    checkApiHealth,
    normalizeApiBase,
    requestPrediction,
} from "./newsApi.js";

test("normalizeApiBase accepts base, predict, and health URLs", () => {
    assert.equal(normalizeApiBase(" https://example.com/ "), "https://example.com");
    assert.equal(normalizeApiBase("https://example.com/predict"), "https://example.com");
    assert.equal(normalizeApiBase("https://example.com/health/"), "https://example.com");
});

test("requestPrediction validates and returns the first API prediction", async () => {
    const fetchImpl = async (url, options) => {
        assert.equal(url, "https://example.com/predict");
        assert.deepEqual(JSON.parse(options.body), { text: "Market update" });
        return {
            ok: true,
            json: async () => ({
                mode: "real",
                predictions: [{ label: "Business", probabilities: { Business: 0.8 } }],
            }),
        };
    };

    const result = await requestPrediction("https://example.com", "Market update", { fetchImpl });
    assert.equal(result.label, "Business");
    assert.equal(result.mode, "real");
});

test("requestPrediction rejects malformed API responses", async () => {
    const fetchImpl = async () => ({ ok: true, json: async () => ({ predictions: [] }) });

    await assert.rejects(
        requestPrediction("https://example.com", "text", { fetchImpl }),
        (error) => error instanceof NewsApiError && error.message.includes("invalid prediction payload"),
    );
});

test("checkApiHealth returns the deployed inference mode", async () => {
    const fetchImpl = async () => ({ ok: true, json: async () => ({ mode: "demo" }) });
    assert.equal(await checkApiHealth("https://example.com/health", { fetchImpl }), "demo");
});

test("requests fail with a bounded timeout", async () => {
    const fetchImpl = (_url, { signal }) => new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    });

    await assert.rejects(
        checkApiHealth("https://example.com", { fetchImpl, timeoutMs: 5 }),
        (error) => error instanceof NewsApiError && error.message.includes("within 0.005 seconds"),
    );
});
