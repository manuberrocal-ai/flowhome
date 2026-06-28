/**
 * Quality Gate - Content validation before publishing
 * Prevents Google "Scaled Content Abuse" penalty
 */

export interface QualityCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface QualityGateResult {
  passed: boolean;
  checks: QualityCheck[];
  score: number;
  issues: string[];
}

export function runQualityGate(content: string, productData?: any): QualityGateResult {
  const checks: QualityCheck[] = [];

  // 1. Word count >= 1200
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  checks.push({
    name: 'wordCount',
    passed: wordCount >= 1200,
    detail: `${wordCount} words (min 1200)`,
  });

  // 2. Has H2 structure
  const h2Count = (content.match(/^## .+/gm) || []).length;
  checks.push({
    name: 'h2Structure',
    passed: h2Count >= 4,
    detail: `${h2Count} H2 sections (min 4)`,
  });

  // 3. Has product specs
  const hasSpecs = /specifications|specs|features|technical details/i.test(content);
  checks.push({
    name: 'productSpecs',
    passed: hasSpecs,
    detail: hasSpecs ? 'Specifications found' : 'No specifications section',
  });

  // 4. Has pros and cons
  const hasProsCons = /pros|cons|advantages|disadvantages/i.test(content);
  checks.push({
    name: 'prosCons',
    passed: hasProsCons,
    detail: hasProsCons ? 'Pros/cons found' : 'No pros/cons section',
  });

  // 5. Has FAQ
  const hasFAQ = /faq|frequently asked/i.test(content);
  checks.push({
    name: 'faq',
    passed: hasFAQ,
    detail: hasFAQ ? 'FAQ found' : 'No FAQ section',
  });

  // 6. Has comparison
  const hasComparison = /comparison|vs|versus|compared to/i.test(content);
  checks.push({
    name: 'comparison',
    passed: hasComparison,
    detail: hasComparison ? 'Comparison found' : 'No comparison section',
  });

  // 7. Has affiliate disclosure
  const hasDisclosure = /affiliate|disclosure|we may earn|as an amazon associate/i.test(content);
  checks.push({
    name: 'affiliateDisclosure',
    passed: hasDisclosure,
    detail: hasDisclosure ? 'Disclosure found' : 'No affiliate disclosure',
  });

  // 8. Not generic AI pattern
  const genericPatterns = [
    /in today's fast-paced world/i,
    /are you tired of/i,
    /look no further/i,
    /it's important to note that/i,
    /when it comes to/i,
  ];
  const genericCount = genericPatterns.filter((p) => p.test(content)).length;
  checks.push({
    name: 'notGenericPattern',
    passed: genericCount <= 1,
    detail: genericCount <= 1 ? 'Unique voice' : `${genericCount} generic patterns detected`,
  });

  // 9. Readability (simple Flesch approximation)
  const sentences = content.split(/[.!?]+/).filter(Boolean).length;
  const words = wordCount;
  const avgWordsPerSentence = words / Math.max(sentences, 1);
  checks.push({
    name: 'readability',
    passed: avgWordsPerSentence <= 25,
    detail: `${avgWordsPerSentence.toFixed(1)} words/sentence (max 25)`,
  });

  // 10. Has data/variance (not too repetitive)
  const uniqueWords = new Set(content.toLowerCase().split(/\s+/)).size;
  const lexicalDiversity = uniqueWords / Math.max(words, 1);
  checks.push({
    name: 'lexicalDiversity',
    passed: lexicalDiversity > 0.4,
    detail: `${(lexicalDiversity * 100).toFixed(1)}% lexical diversity (min 40%)`,
  });

  const passedCount = checks.filter((c) => c.passed).length;
  const issues = checks.filter((c) => !c.passed).map((c) => `${c.name}: ${c.detail}`);

  return {
    passed: passedCount >= 7,
    checks,
    score: passedCount,
    issues,
  };
}
