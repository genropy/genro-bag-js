// Copyright 2025 Softwell S.r.l. - SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { UuidResolver } from '../src/resolvers/UuidResolver.js';
import { BagNode } from '../src/bag-node.js';

// Aligned with Python genro-bag 0.11.0
describe('UuidResolver', () => {
    it('should generate a valid UUID v4', () => {
        const resolver = new UuidResolver();
        const result = resolver.resolve();
        assert.match(result, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it('should generate different UUIDs each time', () => {
        const resolver = new UuidResolver();
        const a = resolver.resolve();
        resolver.reset();
        const b = resolver.resolve();
        assert.notStrictEqual(a, b);
    });

    it('should cache forever by default (cacheTime=-1)', () => {
        const resolver = new UuidResolver();
        const node = new BagNode(null, 'test', null);
        resolver.setNode(node);

        const first = resolver.resolve();
        const second = resolver.resolve();
        assert.strictEqual(first, second);
    });

    it('should generate new UUID after reset', () => {
        const resolver = new UuidResolver();
        const node = new BagNode(null, 'test', null);
        resolver.setNode(node);

        const first = resolver.resolve();
        resolver.reset();
        const second = resolver.resolve();
        assert.notStrictEqual(first, second);
    });
});
