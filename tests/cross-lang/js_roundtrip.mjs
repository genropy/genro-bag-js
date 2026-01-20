#!/usr/bin/env node
// Copyright 2025 Softwell S.r.l. - SPDX-License-Identifier: Apache-2.0

/**
 * JS part of the round-trip test.
 *
 * Reads TyTx from stdin, reconstructs a Bag, re-serializes to TyTx,
 * and writes to stdout.
 *
 * Usage: echo '{"rows":...}::JS' | node js_roundtrip.mjs
 */

import { Bag } from '../../src/index.js';

async function main() {
    // Read all input from stdin
    const chunks = [];
    for await (const chunk of process.stdin) {
        chunks.push(chunk);
    }
    const input = Buffer.concat(chunks).toString('utf8').trim();

    if (!input) {
        console.error('No input received');
        process.exit(1);
    }

    try {
        // Reconstruct Bag from TyTx (uses Bag.fromTytx which calls tytxDecode)
        const bag = Bag.fromTytx(input, 'json');

        // Re-serialize to TyTx (uses bag.toTytx which calls tytxEncode)
        const output = bag.toTytx('json');

        console.log(output);

    } catch (err) {
        console.error('Error:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
}

main();
