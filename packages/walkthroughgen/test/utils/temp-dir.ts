import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * Creates a temporary directory, executes a function with that directory, then removes it
 */
export function withTmpDir<T>(fn: (dir: string) => T): T {
  const dir = mkdtempSync(join(__dirname, '.tmptest'));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
