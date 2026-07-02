import { Classifier } from '../services/classifier';

describe('Auto-Classification', () => {
  beforeEach(() => {
    Classifier.clearLog();
  });

  describe('Category Classification', () => {
    it('should classify login issues as account_access', () => {
      const result = Classifier.classify('Cannot login', 'I forgot my password and cannot sign in to my account');
      expect(result.category).toBe('account_access');
    });

    it('should classify payment issues as billing_question', () => {
      const result = Classifier.classify('Payment failed', 'My credit card payment was declined and I need a refund');
      expect(result.category).toBe('billing_question');
    });

    it('should classify crash reports as technical_issue', () => {
      const result = Classifier.classify('App crashes', 'The application crashes with an error every time I open it');
      expect(result.category).toBe('technical_issue');
    });

    it('should classify enhancement suggestions as feature_request', () => {
      const result = Classifier.classify('Feature suggestion', 'I would like to request a new feature for the dashboard');
      expect(result.category).toBe('feature_request');
    });

    it('should classify bug reports with reproduction steps', () => {
      const result = Classifier.classify('Bug found', 'Steps to reproduce: open the app, click settings. Expected behavior: shows settings');
      expect(result.category).toBe('bug_report');
    });

    it('should classify unclear tickets as other', () => {
      const result = Classifier.classify('Hello', 'I have a question about something unrelated');
      expect(result.category).toBe('other');
    });
  });

  describe('Priority Classification', () => {
    it('should assign urgent priority for critical keywords', () => {
      const result = Classifier.classify('Production down', 'Our production system is down and we have a security breach');
      expect(result.priority).toBe('urgent');
    });

    it('should assign high priority for blocking keywords', () => {
      const result = Classifier.classify('Important issue', 'This is blocking our team and needs to be fixed asap');
      expect(result.priority).toBe('high');
    });

    it('should assign low priority for minor keywords', () => {
      const result = Classifier.classify('Minor suggestion', 'This is a cosmetic issue that would be nice to have');
      expect(result.priority).toBe('low');
    });

    it('should assign medium priority by default', () => {
      const result = Classifier.classify('Question', 'I have a general question about the application usage');
      expect(result.priority).toBe('medium');
    });
  });

  describe('Classification Logging', () => {
    it('should log classification decisions', () => {
      const result = Classifier.classify('Login issue', 'I cannot login to my account and need help with password reset');
      Classifier.logClassification('ticket-123', result);
      const log = Classifier.getLog();
      expect(log.length).toBe(1);
      expect(log[0].ticketId).toBe('ticket-123');
    });

    it('should include confidence score between 0 and 1', () => {
      const result = Classifier.classify('Payment refund needed', 'I need a refund for my billing subscription payment');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should include keywords found in result', () => {
      const result = Classifier.classify('Login problem', 'I cannot login with my password and the 2fa code fails');
      expect(result.keywords_found.length).toBeGreaterThan(0);
    });
  });
});
