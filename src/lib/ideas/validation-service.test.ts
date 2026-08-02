import { describe, expect, it } from 'vitest';
import { validationCreateSchema } from '@/src/lib/ideas/validation-service';

describe('validation decision gate', () => {
  const valid = {
    decision: 'BUILD', problemClarity: 4, evidenceStrength: 3, effortEstimate: 2,
    riskiestAssumption: 'People will complete the first validation action without coaching.',
    smallestTest: 'Interview five target users using a clickable prototype this week.',
    decisionRationale: 'There is enough direct evidence to build a narrow first version.',
    evidenceLinks: ['https://example.com/evidence'], createdBy: 'owner',
  };
  it('accepts a complete decision record', () => expect(validationCreateSchema.parse(valid).decision).toBe('BUILD'));
  it('requires evidence-bearing decision details', () => expect(() => validationCreateSchema.parse({ ...valid, smallestTest: 'no' })).toThrow());
});
