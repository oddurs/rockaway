import path from 'node:path';
import type { Reporter, TestCase } from 'vitest/node';

/**
 * Stories drifting toward the timeout. A story's limit is thirty seconds, and
 * CI's browsers run several times slower than a laptop, so a story that takes
 * half its limit there is the next one to time out on a busy run. This names
 * every story that took longer than that, with the browser it ran in, once
 * at the end of the run. It is a warning and never fails the run: the fix is
 * to split the story, as Continuity's and Callout's were.
 */
const SLOW_MS = 15_000;

export function slowStories(limit = SLOW_MS): Reporter {
  const slow: { readonly name: string; readonly ms: number }[] = [];
  return {
    onTestCaseResult(testCase: TestCase) {
      const ms = testCase.diagnostic()?.duration ?? 0;
      if (ms > limit) {
        const file = path.relative(process.cwd(), testCase.module.moduleId);
        slow.push({ name: `${testCase.project.name} › ${file} › ${testCase.fullName}`, ms });
      }
    },
    onTestRunEnd() {
      if (slow.length === 0) return;
      const list = slow
        .sort((a, b) => b.ms - a.ms)
        .map(({ name, ms }) => `  ${(ms / 1000).toFixed(1)}s  ${name}`)
        .join('\n');
      console.warn(
        `\nStories over ${limit / 1000}s, the next to time out on a slow run (split them):\n${list}`,
      );
    },
  };
}
