const KEYWORD_GROUPS = {
    "World": ["president", "minister", "election", "government", "sanction", "war", "diplomat", "united nations", "nato", "border", "parliament", "china", "ukraine", "israel"],
    "Sports": ["game", "team", "season", "goal", "score", "league", "championship", "tournament", "coach", "player", "lakers", "celtics", "nfl", "nba", "soccer", "cricket"],
    "Business": ["market", "stock", "revenue", "profit", "company", "bank", "investor", "shares", "earnings", "federal reserve", "inflation", "merger", "sales", "economy"],
    "Sci/Tech": ["technology", "software", "chip", "ai", "artificial intelligence", "space", "nasa", "satellite", "computer", "internet", "cyber", "apple", "google", "microsoft", "robot"],
};

export function browserDemoPrediction(text) {
    const normalized = text.toLowerCase();
    const scores = Object.fromEntries(Object.keys(KEYWORD_GROUPS).map((label) => [label, 1]));
    Object.entries(KEYWORD_GROUPS).forEach(([label, keywords]) => {
        keywords.forEach((keyword) => {
            if (normalized.includes(keyword)) scores[label] += keyword.includes(" ") ? 2.4 : 1.5;
        });
    });
    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const probabilities = Object.fromEntries(Object.entries(scores).map(([label, score]) => [label, score / total]));
    const label = Object.keys(probabilities).reduce((best, current) => probabilities[current] > probabilities[best] ? current : best);
    return {
        text,
        label,
        confidence: probabilities[label],
        probabilities,
        model: "transparent-browser-fallback",
        latency_ms: 0,
        mode: "demo",
    };
}
