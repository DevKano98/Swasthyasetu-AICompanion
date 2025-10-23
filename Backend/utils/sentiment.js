const Sentiment = require('sentiment');
const sentiment = new Sentiment();

function analyze(text) {
  const result = sentiment.analyze(text);
  const score = Math.max(-1, Math.min(1, result.score / 5)); // Normalize to [-1, 1]
  let label = 'neutral';
  if (score > 0.1) label = 'positive';
  else if (score < -0.1) label = 'negative';
  return { score, label };
}

module.exports = { analyze };