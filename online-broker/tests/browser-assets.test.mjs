import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('browser uses the same listing rules as server and unit checks',()=>{
 assert.equal(readFileSync(new URL('../public/listing.mjs',import.meta.url),'utf8'),readFileSync(new URL('../lib/listing.mjs',import.meta.url),'utf8'));
});
