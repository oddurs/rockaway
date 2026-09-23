import { expect } from 'vitest';
import { bufferSerializer } from '../src/snapshot.ts';

// A buffer prints as the screen it draws (cairn 0083).
expect.addSnapshotSerializer(bufferSerializer);
