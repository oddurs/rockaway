/**
 * Writes `dist/meta.json` and `dist/meta.schema.json` after tsdown has built
 * the package (cairn 0047), and fails the build if the metadata does not
 * validate against its schema.
 *
 * It reads the built `metadata` entry rather than the source, so what is
 * written is exactly what `@rockaway/react/metadata` exports to a consumer.
 */
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import type { MetadataDocument } from '../src/metadata/schema.ts';
import { packageRoot } from './extract.ts';

const dist = path.join(packageRoot, 'dist');
const entry = pathToFileURL(path.join(dist, 'metadata/index.js')).href;
const { metadata } = (await import(entry)) as { metadata: MetadataDocument };

const schemaFile = path.join(packageRoot, 'src/metadata/meta.schema.json');
const schema = JSON.parse(readFileSync(schemaFile, 'utf8')) as object;
const validate = new Ajv2020({ allErrors: true }).compile(schema);
const json = JSON.parse(JSON.stringify(metadata)) as unknown;
if (!validate(json)) {
  for (const error of validate.errors ?? []) {
    console.error(`  ✗ meta.json${error.instancePath}: ${error.message}`);
  }
  process.exit(1);
}

writeFileSync(path.join(dist, 'meta.json'), `${JSON.stringify(json, null, 2)}\n`);
copyFileSync(schemaFile, path.join(dist, 'meta.schema.json'));
console.log(`Wrote dist/meta.json: ${metadata.components.length} components, valid.`);
