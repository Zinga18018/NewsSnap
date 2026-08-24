import assert from 'node:assert/strict';
import test from 'node:test';
import { browserDemoPrediction } from '../src/demoClassifier.js';

const cases = [
    ['Apple unveils a new AI chip for its laptops', 'Sci/Tech'],
    ['The Lakers win the championship game in overtime', 'Sports'],
    ['Stocks rally after the Federal Reserve updates interest rates', 'Business'],
    ['The United Nations debates new international sanctions', 'World'],
];

test('browser fallback returns expected labels for representative samples', () => {
    cases.forEach(([text, expected]) => assert.equal(browserDemoPrediction(text).label, expected));
});

test('browser fallback returns normalized score shares and an honest mode label', () => {
    const result = browserDemoPrediction(cases[0][0]);
    const total = Object.values(result.probabilities).reduce((sum, value) => sum + value, 0);
    assert.ok(Math.abs(total - 1) < 1e-12);
    assert.equal(result.mode, 'demo');
    assert.equal(result.model, 'transparent-browser-fallback');
});
