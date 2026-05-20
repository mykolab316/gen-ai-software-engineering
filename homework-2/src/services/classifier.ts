import { Category, Priority, ClassificationResult } from '../types/ticket';

interface KeywordMap {
  [key: string]: string[];
}

const categoryKeywords: Record<Category, string[]> = {
  account_access: ['login', 'password', 'sign in', 'signin', 'sign-in', 'locked out', '2fa', 'two-factor', 'authentication', 'access denied', 'can\'t log in', 'forgot password', 'reset password', 'account locked'],
  technical_issue: ['bug', 'error', 'crash', 'not working', 'broken', 'fails', 'issue', 'problem', 'glitch', 'freeze', 'slow', 'timeout', 'unresponsive'],
  billing_question: ['payment', 'invoice', 'refund', 'charge', 'billing', 'subscription', 'plan', 'price', 'cost', 'receipt', 'overcharged', 'credit card', 'transaction'],
  feature_request: ['feature', 'request', 'suggestion', 'enhancement', 'improve', 'add', 'would like', 'wish', 'could you', 'new functionality', 'idea'],
  bug_report: ['reproduce', 'steps to reproduce', 'expected behavior', 'actual behavior', 'defect', 'regression', 'broken since', 'used to work'],
  other: [],
};

const urgentKeywords: string[] = ['can\'t access', 'critical', 'production down', 'security', 'urgent', 'emergency', 'data loss', 'breach', 'vulnerability'];
const highKeywords: string[] = ['important', 'blocking', 'asap', 'high priority', 'severely', 'major'];
const lowKeywords: string[] = ['minor', 'cosmetic', 'suggestion', 'low priority', 'nice to have', 'when possible'];

export class Classifier {
  private static classificationLog: Array<{ ticketId: string; result: ClassificationResult; timestamp: Date }> = [];

  static classify(subject: string, description: string): ClassificationResult {
    const text = `${subject} ${description}`.toLowerCase();
    
    const category = this.classifyCategory(text);
    const priority = this.classifyPriority(text);
    const allKeywords = this.findKeywords(text);
    const confidence = this.calculateConfidence(text, category, allKeywords);

    const result: ClassificationResult = {
      category: category.category,
      priority: priority.priority,
      confidence,
      reasoning: `Category "${category.category}" assigned based on ${category.matchCount} keyword match(es). Priority "${priority.priority}" assigned based on ${priority.matchCount} keyword match(es).`,
      keywords_found: allKeywords,
    };

    return result;
  }

  static logClassification(ticketId: string, result: ClassificationResult): void {
    this.classificationLog.push({
      ticketId,
      result,
      timestamp: new Date(),
    });
  }

  static getLog() {
    return [...this.classificationLog];
  }

  static clearLog(): void {
    this.classificationLog = [];
  }

  private static classifyCategory(text: string): { category: Category; matchCount: number } {
    let bestCategory: Category = 'other';
    let bestMatchCount = 0;

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (category === 'other') continue;
      
      const matchCount = keywords.filter((kw) => text.includes(kw)).length;
      if (matchCount > bestMatchCount) {
        bestMatchCount = matchCount;
        bestCategory = category as Category;
      }
    }

    return { category: bestCategory, matchCount: bestMatchCount };
  }

  private static classifyPriority(text: string): { priority: Priority; matchCount: number } {
    const urgentMatches = urgentKeywords.filter((kw) => text.includes(kw)).length;
    if (urgentMatches > 0) return { priority: 'urgent', matchCount: urgentMatches };

    const highMatches = highKeywords.filter((kw) => text.includes(kw)).length;
    if (highMatches > 0) return { priority: 'high', matchCount: highMatches };

    const lowMatches = lowKeywords.filter((kw) => text.includes(kw)).length;
    if (lowMatches > 0) return { priority: 'low', matchCount: lowMatches };

    return { priority: 'medium', matchCount: 0 };
  }

  private static findKeywords(text: string): string[] {
    const found: string[] = [];
    
    for (const keywords of Object.values(categoryKeywords)) {
      for (const kw of keywords) {
        if (text.includes(kw) && !found.includes(kw)) {
          found.push(kw);
        }
      }
    }

    for (const kw of [...urgentKeywords, ...highKeywords, ...lowKeywords]) {
      if (text.includes(kw) && !found.includes(kw)) {
        found.push(kw);
      }
    }

    return found;
  }

  private static calculateConfidence(text: string, category: { category: Category; matchCount: number }, keywords: string[]): number {
    if (category.category === 'other') return 0.1;
    
    const matchRatio = category.matchCount / (categoryKeywords[category.category].length || 1);
    const totalKeywordDensity = keywords.length / (text.split(' ').length || 1);
    
    const confidence = Math.min(0.95, 0.3 + (matchRatio * 0.4) + (totalKeywordDensity * 0.3));
    return Math.round(confidence * 100) / 100;
  }
}
