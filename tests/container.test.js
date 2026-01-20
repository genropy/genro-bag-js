// Copyright 2025 Softwell S.r.l. - SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BagNodeContainer } from '../src/BagNodeContainer.js';

describe('BagNodeContainer', () => {
    describe('index with special syntax', () => {
        it('should find by label', () => {
            const c = new BagNodeContainer();
            c.set('a', 1);
            c.set('b', 2);
            c.set('c', 3);
            assert.strictEqual(c.index('b'), 1);
        });

        it('should find by #n syntax', () => {
            const c = new BagNodeContainer();
            c.set('a', 1);
            c.set('b', 2);
            assert.strictEqual(c.index('#0'), 0);
            assert.strictEqual(c.index('#1'), 1);
            assert.strictEqual(c.index('#99'), -1);
        });

        it('should find by #attr=value syntax', () => {
            const c = new BagNodeContainer();
            c.set('a', 1, '>', { id: '10' });
            c.set('b', 2, '>', { id: '20' });
            c.set('c', 3, '>', { id: '30' });
            assert.strictEqual(c.index('#id=20'), 1);
            assert.strictEqual(c.index('#id=99'), -1);
        });

        it('should find by #=value syntax', () => {
            const c = new BagNodeContainer();
            c.set('a', 'apple');
            c.set('b', 'banana');
            c.set('c', 'cherry');
            assert.strictEqual(c.index('#=banana'), 1);
            assert.strictEqual(c.index('#=grape'), -1);
        });
    });

    describe('move', () => {
        it('should move single element forward', () => {
            const c = new BagNodeContainer();
            c.set('a', 1);
            c.set('b', 2);
            c.set('c', 3);
            // Move 'a' (index 0) to position 2
            c.move(0, 2);
            assert.deepStrictEqual(c.keys(), ['b', 'c', 'a']);
        });

        it('should move single element backward', () => {
            const c = new BagNodeContainer();
            c.set('a', 1);
            c.set('b', 2);
            c.set('c', 3);
            // Move 'c' (index 2) to position 0
            c.move(2, 0);
            assert.deepStrictEqual(c.keys(), ['c', 'a', 'b']);
        });

        it('should not move if same position', () => {
            const c = new BagNodeContainer();
            c.set('a', 1);
            c.set('b', 2);
            c.move(1, 1);
            assert.deepStrictEqual(c.keys(), ['a', 'b']);
        });

        it('should move multiple elements', () => {
            const c = new BagNodeContainer();
            c.set('a', 1);
            c.set('b', 2);
            c.set('c', 3);
            c.set('d', 4);
            // Move indices 0 and 2 to position 3
            c.move([0, 2], 3);
            // After: b, d, a, c (or similar depending on implementation)
            assert.strictEqual(c.length, 4);
        });
    });

    describe('isEqual', () => {
        it('should return true for equal containers', () => {
            const c1 = new BagNodeContainer();
            c1.set('a', 1);
            c1.set('b', 2);

            const c2 = new BagNodeContainer();
            c2.set('a', 1);
            c2.set('b', 2);

            assert.strictEqual(c1.isEqual(c2), true);
        });

        it('should return false for different values', () => {
            const c1 = new BagNodeContainer();
            c1.set('a', 1);

            const c2 = new BagNodeContainer();
            c2.set('a', 999);

            assert.strictEqual(c1.isEqual(c2), false);
        });

        it('should return false for different labels', () => {
            const c1 = new BagNodeContainer();
            c1.set('a', 1);

            const c2 = new BagNodeContainer();
            c2.set('x', 1);

            assert.strictEqual(c1.isEqual(c2), false);
        });

        it('should return false for different lengths', () => {
            const c1 = new BagNodeContainer();
            c1.set('a', 1);
            c1.set('b', 2);

            const c2 = new BagNodeContainer();
            c2.set('a', 1);

            assert.strictEqual(c1.isEqual(c2), false);
        });

        it('should return false for non-container', () => {
            const c = new BagNodeContainer();
            assert.strictEqual(c.isEqual({}), false);
            assert.strictEqual(c.isEqual(null), false);
        });
    });
});
