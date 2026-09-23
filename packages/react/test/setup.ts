import { bufferSerializer } from '@rockaway/grid';
import { expect } from 'vitest';

// A component's chrome prints as the screen it draws (cairn 0083, 0096).
expect.addSnapshotSerializer(bufferSerializer);
