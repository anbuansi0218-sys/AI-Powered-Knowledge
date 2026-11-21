function tokenize(expression) {
  const tokens = expression.match(/\s+|\d*\.?\d+|[()+\-*/]/g);
  if (!tokens || tokens.join('').replace(/\s+/g, '') !== expression.replace(/\s+/g, '')) {
    return null;
  }
  return tokens.filter((token) => !/^\s+$/.test(token));
}

export function evaluateArithmeticQuestion(question) {
  let expression = question.trim()
    .replace(/^(?:what\s+is|what's|calculate|compute|solve|evaluate)\s+/i, '')
    .replace(/\bmultiplied\s+by\b/gi, '*')
    .replace(/\bdivided\s+by\b/gi, '/')
    .replace(/\bplus\b/gi, '+')
    .replace(/\bminus\b/gi, '-')
    .replace(/\btimes\b/gi, '*')
    .replace(/[?=]+\s*$/, '')
    .trim();

  if (!expression || expression.length > 200) return null;
  const tokens = tokenize(expression);
  if (!tokens || tokens.length > 100) return null;

  let index = 0;
  let binaryOperatorCount = 0;

  function parsePrimary() {
    const token = tokens[index];
    if (token === '(') {
      index += 1;
      const value = parseExpression();
      if (tokens[index] !== ')') throw new SyntaxError('Missing closing parenthesis.');
      index += 1;
      return value;
    }

    if (!token || !/^(?:\d*\.?\d+)$/.test(token)) {
      throw new SyntaxError('Expected a number.');
    }
    index += 1;
    return Number(token);
  }

  function parseUnary() {
    if (tokens[index] === '+' || tokens[index] === '-') {
      const operator = tokens[index];
      index += 1;
      const value = parseUnary();
      return operator === '-' ? -value : value;
    }
    return parsePrimary();
  }

  function parseTerm() {
    let value = parseUnary();
    while (tokens[index] === '*' || tokens[index] === '/') {
      const operator = tokens[index];
      index += 1;
      binaryOperatorCount += 1;
      const right = parseUnary();
      if (operator === '/' && right === 0) throw new RangeError('Cannot divide by zero.');
      value = operator === '*' ? value * right : value / right;
    }
    return value;
  }

  function parseExpression() {
    let value = parseTerm();
    while (tokens[index] === '+' || tokens[index] === '-') {
      const operator = tokens[index];
      index += 1;
      binaryOperatorCount += 1;
      const right = parseTerm();
      value = operator === '+' ? value + right : value - right;
    }
    return value;
  }

  try {
    const result = parseExpression();
    if (index !== tokens.length || binaryOperatorCount === 0) return null;
    if (!Number.isFinite(result)) return 'The result is outside the supported number range.';
    return Number(result.toPrecision(12)).toString();
  } catch (error) {
    return error instanceof RangeError ? error.message : null;
  }
}
