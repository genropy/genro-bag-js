// Copyright 2025 Softwell S.r.l. - SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BagNodeContainer } from '../src/bag-node-container.js';
import { BagCbResolver } from '../src/resolver.js';

describe('BagNodeContainer', () => {
    describe('array-compatible reads', () => {
        it('filters nodes without changing order or indexes', () => {
            const c = new BagNodeContainer();
            c.set('a', 1, '>', {tag: 'framepane_top'});
            c.set('b', 2, '>', {tag: 'other'});
            c.set('c', 3, '>', {tag: 'framepane_top'});

            const selected = c.filter(node => node.getAttr('tag') === 'framepane_top');

            assert.deepStrictEqual(selected.map(node => node.label), ['a', 'c']);
            assert.deepStrictEqual(c.keys(), ['a', 'b', 'c']);
            assert.strictEqual(c[0], c.get('a'));
        });
    });

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

    // Aligned with Python genro-bag 0.11.0
    describe('set with resolver', () => {
        it('should pass resolver to new node', () => {
            const c = new BagNodeContainer();
            const resolver = new BagCbResolver({ callback: () => 99 });
            const node = c.set('x', null, '>', null, null, resolver);
            assert.strictEqual(node.resolver, resolver);
            assert.strictEqual(resolver.node, node);
        });

        it('should update resolver on existing node', () => {
            const c = new BagNodeContainer();
            c.set('x', 42);
            const resolver = new BagCbResolver({ callback: () => 99 });
            c.set('x', null, '>', null, null, resolver);
            assert.strictEqual(c.get('x').resolver, resolver);
        });

        it('should remove resolver with resolver=false', () => {
            const c = new BagNodeContainer();
            const resolver = new BagCbResolver({ callback: () => 99 });
            c.set('x', null, '>', null, null, resolver);
            c.set('x', 42, '>', null, null, false);
            assert.strictEqual(c.get('x').resolver, null);
        });
    });

    // Aligned with Python genro-bag 0.11.0
    describe('set with nodeTag', () => {
        it('should pass nodeTag to new node', () => {
            const c = new BagNodeContainer();
            const node = c.set('x', 42, '>', null, null, null, false, true, null, true, false, 'myTag');
            assert.strictEqual(node.nodeTag, 'myTag');
        });

        it('should update nodeTag on existing node', () => {
            const c = new BagNodeContainer();
            c.set('x', 42);
            c.set('x', 42, '>', null, null, null, false, true, null, true, false, 'newTag');
            assert.strictEqual(c.get('x').nodeTag, 'newTag');
        });
    });

    // Aligned with Python genro-bag 0.11.0
    describe('set with doTrigger=false', () => {
        it('should not trigger events when doTrigger is false', () => {
            const c = new BagNodeContainer();
            // Create a mock parentBag with backref
            let insertCalled = false;
            const fakeBag = {
                backref: true,
                nodeClass: null,
                _onNodeInserted: () => { insertCalled = true; }
            };
            c.set('x', 42, '>', null, fakeBag, null, false, true, null, false);
            assert.strictEqual(insertCalled, false);
        });
    });

    // Aligned with Python genro-bag 0.11.0
    describe('set with fired', () => {
        it('should reset value to null after creation', () => {
            const c = new BagNodeContainer();
            const node = c.set('x', 42, '>', null, null, null, false, true, null, true, true);
            assert.strictEqual(node.staticValue, null);
        });
    });

    // Aligned with Python genro-bag 0.11.0
    describe('set with updattr and removeNullAttributes', () => {
        it('should propagate updattr to existing node setValue', () => {
            const c = new BagNodeContainer();
            c.set('x', 10, '>', { a: 1, b: 2 });
            // updattr=false clears existing attrs
            c.set('x', 20, '>', { c: 3 }, null, null, false);
            const node = c.get('x');
            assert.strictEqual(node.getAttr('a'), null);
            assert.strictEqual(node.getAttr('c'), 3);
        });

        it('should propagate removeNullAttributes=false', () => {
            const c = new BagNodeContainer();
            c.set('x', 10, '>', { a: 1 });
            c.set('x', 20, '>', { b: null }, null, null, true, false);
            const node = c.get('x');
            assert.strictEqual(node.getAttr('b'), null);
        });
    });

    describe('_parsePosition fail-fast', () => {
        const makeContainer = () => {
            const c = new BagNodeContainer();
            c.set('a', 1);
            c.set('b', 2);
            c.set('c', 3);
            return c;
        };

        it('should throw on #n with non-integer index', () => {
            const c = makeContainer();
            assert.throws(() => c.set('x', 9, '#abc'), /not an integer/);
        });

        it('should throw on #n with negative index', () => {
            const c = makeContainer();
            assert.throws(() => c.set('x', 9, '#-1'), /negative index not allowed/);
        });

        it('should throw on <label when label not found', () => {
            const c = makeContainer();
            assert.throws(() => c.set('x', 9, '<missing'), /not found/);
        });

        it('should throw on >label when label not found', () => {
            const c = makeContainer();
            assert.throws(() => c.set('x', 9, '>missing'), /not found/);
        });

        it('should throw on unrecognized syntax', () => {
            const c = makeContainer();
            assert.throws(() => c.set('x', 9, '@foo'), /unrecognized syntax/);
        });

        it('should support negative integer index Python-style', () => {
            const c = makeContainer();
            // -1 = before last element (insert at index len-1 = 2)
            assert.strictEqual(c._parsePosition(-1), 2);
            assert.strictEqual(c._parsePosition(-2), 1);
            // out-of-range negative clamps to 0
            assert.strictEqual(c._parsePosition(-99), 0);
        });

        it('should clamp #n above length to length', () => {
            const c = makeContainer();
            assert.strictEqual(c._parsePosition('#10'), 3);
        });

        it('should resolve <label and >label on existing labels', () => {
            const c = makeContainer();
            assert.strictEqual(c._parsePosition('<b'), 1);
            assert.strictEqual(c._parsePosition('>b'), 2);
        });
    });

    describe('set with ?attr query syntax', () => {
        it('should merge single attribute on existing node, preserving others', () => {
            const c = new BagNodeContainer();
            c.set('x', 'value', '>', { a: 1, b: 2 });
            c.set('x?b', 99);
            const node = c.get('x');
            // ?attr is an alias of setAttr: must merge, not replace
            assert.strictEqual(node.getAttr('a'), 1);
            assert.strictEqual(node.getAttr('b'), 99);
            // value must be untouched
            assert.strictEqual(node.getValue(), 'value');
        });

        it('should merge even when updattr=false is passed', () => {
            const c = new BagNodeContainer();
            c.set('x', 'value', '>', { a: 1, b: 2 });
            // updattr=false (7th positional) must NOT cause attribute replacement
            // in the ?attr branch
            c.set('x?b', 99, '>', null, null, null, false);
            const node = c.get('x');
            assert.strictEqual(node.getAttr('a'), 1);
            assert.strictEqual(node.getAttr('b'), 99);
        });

        it('should set multiple attributes from tuple, preserving others', () => {
            const c = new BagNodeContainer();
            c.set('x', 'value', '>', { a: 1 });
            c.set('x?b&c', [2, 3]);
            const node = c.get('x');
            assert.strictEqual(node.getAttr('a'), 1);
            assert.strictEqual(node.getAttr('b'), 2);
            assert.strictEqual(node.getAttr('c'), 3);
        });
    });

    describe('array-compatible access', () => {
        it('keeps numeric indexes and array helpers in sync', () => {
            const c = new BagNodeContainer();
            c.set('a', 1);
            c.set('b', 2);

            assert.strictEqual(c[0].label, 'a');
            assert.deepStrictEqual(c.map(node => node.label), ['a', 'b']);
            assert.strictEqual(c.indexOf(c[1]), 1);
            c.splice(0, 1);
            assert.strictEqual(c[0].label, 'b');
            assert.deepStrictEqual(c.keys(), ['b']);
        });
    });
});
