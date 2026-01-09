import { describe, it, expect, vi } from 'vitest';
import { VALID_MERMAID_TYPES } from './Canvas';

// Import the constant we exported for testing
describe('Canvas Mermaid Validation', () => {
  it('should have a list of valid Mermaid diagram types', () => {
    expect(VALID_MERMAID_TYPES).toBeDefined();
    expect(Array.isArray(VALID_MERMAID_TYPES)).toBe(true);
    expect(VALID_MERMAID_TYPES.length).toBeGreaterThan(0);
  });

  it('should include common diagram types', () => {
    const expectedTypes = ['graph', 'flowchart', 'sequencediagram', 'pie', 'mindmap'];
    expectedTypes.forEach(type => {
      expect(VALID_MERMAID_TYPES).toContain(type);
    });
  });

  it('should validate diagram types correctly', () => {
    const validDiagrams = [
      'graph TD',
      'flowchart LR',
      'sequenceDiagram',
      'pie title Pets',
      'mindmap',
    ];

    validDiagrams.forEach(diagram => {
      const firstLine = diagram.toLowerCase();
      const isValid = VALID_MERMAID_TYPES.some(type => firstLine.includes(type));
      expect(isValid).toBe(true);
    });
  });

  it('should reject invalid diagram types', () => {
    const invalidDiagrams = [
      'invalid diagram',
      'notavalidtype TD',
      'random text',
    ];

    invalidDiagrams.forEach(diagram => {
      const firstLine = diagram.toLowerCase();
      const isValid = VALID_MERMAID_TYPES.some(type => firstLine.includes(type));
      expect(isValid).toBe(false);
    });
  });
});
