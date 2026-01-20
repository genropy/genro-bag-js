// Copyright 2025 Softwell S.r.l. - SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Bag } from '../src/index.js';

describe('Bag', () => {
    describe('setItem and getItem', () => {
        it('should set and get a simple value', () => {
            const bag = new Bag();
            bag.setItem('name', 'test');
            assert.strictEqual(bag.getItem('name'), 'test');
        });

        it('should set and get a nested path', () => {
            const bag = new Bag();
            bag.setItem('config.database.host', 'localhost');
            assert.strictEqual(bag.getItem('config.database.host'), 'localhost');
        });

        it('should set and get multiple nested values', () => {
            const bag = new Bag();
            bag.setItem('config.database.host', 'localhost');
            bag.setItem('config.database.port', 5432);
            bag.setItem('config.cache.enabled', true);

            assert.strictEqual(bag.getItem('config.database.host'), 'localhost');
            assert.strictEqual(bag.getItem('config.database.port'), 5432);
            assert.strictEqual(bag.getItem('config.cache.enabled'), true);
        });

        it('should return default value for missing path', () => {
            const bag = new Bag();
            assert.strictEqual(bag.getItem('missing'), null);
            assert.strictEqual(bag.getItem('missing', 'default'), 'default');
        });

        it('should return default for partially missing path', () => {
            const bag = new Bag();
            bag.setItem('a.b', 1);
            assert.strictEqual(bag.getItem('a.b.c.d', 'nope'), 'nope');
        });

        it('should update existing value', () => {
            const bag = new Bag();
            bag.setItem('key', 'old');
            bag.setItem('key', 'new');
            assert.strictEqual(bag.getItem('key'), 'new');
        });

        it('should handle empty path', () => {
            const bag = new Bag();
            bag.setItem('x', 42);
            assert.strictEqual(bag.getItem(''), bag);
        });
    });

    describe('length and iteration', () => {
        it('should return correct length', () => {
            const bag = new Bag();
            assert.strictEqual(bag.length, 0);
            bag.setItem('a', 1);
            assert.strictEqual(bag.length, 1);
            bag.setItem('b', 2);
            assert.strictEqual(bag.length, 2);
        });

        it('should iterate over nodes', () => {
            const bag = new Bag();
            bag.setItem('a', 1);
            bag.setItem('b', 2);
            bag.setItem('c', 3);

            const labels = [];
            for (const node of bag) {
                labels.push(node.label);
            }
            assert.deepStrictEqual(labels, ['a', 'b', 'c']);
        });

        it('should return keys in order', () => {
            const bag = new Bag();
            bag.setItem('x', 1);
            bag.setItem('y', 2);
            bag.setItem('z', 3);
            assert.deepStrictEqual(bag.keys(), ['x', 'y', 'z']);
        });

        it('should return values in order', () => {
            const bag = new Bag();
            bag.setItem('x', 10);
            bag.setItem('y', 20);
            bag.setItem('z', 30);
            assert.deepStrictEqual(bag.values(), [10, 20, 30]);
        });
    });

    describe('nested Bag access', () => {
        it('should automatically create nested Bags', () => {
            const bag = new Bag();
            bag.setItem('level1.level2.level3', 'deep');

            // level1 should be a Bag
            const level1 = bag.getItem('level1');
            assert.ok(level1 instanceof Bag);

            // level2 should be a Bag
            const level2 = bag.getItem('level1.level2');
            assert.ok(level2 instanceof Bag);

            // level3 should be the value
            assert.strictEqual(bag.getItem('level1.level2.level3'), 'deep');
        });
    });

    describe('pop', () => {
        it('should remove and return value at simple path', () => {
            const bag = new Bag();
            bag.setItem('a', 42);
            const result = bag.pop('a');
            assert.strictEqual(result, 42);
            assert.strictEqual(bag.length, 0);
        });

        it('should remove and return value at nested path', () => {
            const bag = new Bag();
            bag.setItem('x.y.z', 'deep');
            const result = bag.pop('x.y.z');
            assert.strictEqual(result, 'deep');
            // x.y should still exist but be empty
            const xy = bag.getItem('x.y');
            assert.ok(xy instanceof Bag);
            assert.strictEqual(xy.length, 0);
        });

        it('should return default for missing path', () => {
            const bag = new Bag();
            assert.strictEqual(bag.pop('missing'), null);
            assert.strictEqual(bag.pop('missing', 'default'), 'default');
        });

        it('should return default for partially missing path', () => {
            const bag = new Bag();
            bag.setItem('a', 1);
            assert.strictEqual(bag.pop('a.b.c', 'nope'), 'nope');
        });
    });

    describe('delItem', () => {
        it('should be an alias for pop', () => {
            const bag = new Bag();
            bag.setItem('key', 'value');
            const result = bag.delItem('key');
            assert.strictEqual(result, 'value');
            assert.strictEqual(bag.length, 0);
        });
    });

    describe('popNode', () => {
        it('should remove and return the BagNode', () => {
            const bag = new Bag();
            bag.setItem('item', 100, { type: 'number' });
            const node = bag.popNode('item');
            assert.ok(node !== null);
            assert.strictEqual(node.value, 100);
            assert.strictEqual(node.getAttr('type'), 'number');
            assert.strictEqual(bag.length, 0);
        });

        it('should return null for missing path', () => {
            const bag = new Bag();
            assert.strictEqual(bag.popNode('missing'), null);
        });
    });

    describe('clear', () => {
        it('should remove all nodes', () => {
            const bag = new Bag();
            bag.setItem('a', 1);
            bag.setItem('b', 2);
            bag.setItem('c', 3);
            assert.strictEqual(bag.length, 3);
            bag.clear();
            assert.strictEqual(bag.length, 0);
        });

        it('should work on empty bag', () => {
            const bag = new Bag();
            bag.clear();
            assert.strictEqual(bag.length, 0);
        });
    });

    describe('getNode', () => {
        it('should return the BagNode at path', () => {
            const bag = new Bag();
            bag.setItem('item', 42, { color: 'red' });
            const node = bag.getNode('item');
            assert.ok(node !== null);
            assert.strictEqual(node.label, 'item');
            assert.strictEqual(node.value, 42);
            assert.strictEqual(node.getAttr('color'), 'red');
        });

        it('should return node at nested path', () => {
            const bag = new Bag();
            bag.setItem('a.b.c', 'deep', { level: 3 });
            const node = bag.getNode('a.b.c');
            assert.ok(node !== null);
            assert.strictEqual(node.label, 'c');
            assert.strictEqual(node.value, 'deep');
        });

        it('should return null for missing path', () => {
            const bag = new Bag();
            assert.strictEqual(bag.getNode('missing'), null);
        });

        it('should return null for empty path', () => {
            const bag = new Bag();
            assert.strictEqual(bag.getNode(''), null);
        });
    });

    describe('backref system', () => {
        it('should enable backref with setBackref', () => {
            const bag = new Bag();
            assert.strictEqual(bag.backref, false);
            bag.setBackref();
            assert.strictEqual(bag.backref, true);
        });

        it('should set parent references with setBackref', () => {
            const parent = new Bag();
            const child = new Bag();
            parent.setItem('child', child);
            const node = parent.getNode('child');
            child.setBackref(node, parent);

            assert.strictEqual(child.parent, parent);
            assert.strictEqual(child.parentNode, node);
        });

        it('should clear backref with clearBackref', () => {
            const bag = new Bag();
            bag.setBackref();
            bag.setItem('a', 1);
            assert.strictEqual(bag.backref, true);

            bag.clearBackref();
            assert.strictEqual(bag.backref, false);
            assert.strictEqual(bag.parent, null);
            assert.strictEqual(bag.parentNode, null);
        });

        it('should clear backref recursively', () => {
            const parent = new Bag();
            parent.setBackref();
            const child = new Bag();
            parent.setItem('child', child);

            // Child should have backref set automatically
            child.setBackref(parent.getNode('child'), parent);
            assert.strictEqual(child.backref, true);

            parent.clearBackref();
            assert.strictEqual(parent.backref, false);
            assert.strictEqual(child.backref, false);
        });

        it('should delete parent ref with delParentRef', () => {
            const bag = new Bag();
            bag.setBackref();
            bag.delParentRef();
            assert.strictEqual(bag.backref, false);
            assert.strictEqual(bag.parent, null);
        });
    });

    describe('subscribe/unsubscribe', () => {
        it('should enable backref when subscribing', () => {
            const bag = new Bag();
            assert.strictEqual(bag.backref, false);
            bag.subscribe('test', { any: () => {} });
            assert.strictEqual(bag.backref, true);
        });

        it('should call insert callback when node is added', () => {
            const bag = new Bag();
            const events = [];
            bag.subscribe('test', {
                insert: (e) => events.push({ type: 'ins', label: e.node.label })
            });

            bag.setItem('a', 1);
            bag.setItem('b', 2);

            assert.strictEqual(events.length, 2);
            assert.strictEqual(events[0].label, 'a');
            assert.strictEqual(events[1].label, 'b');
        });

        it('should call delete callback when node is removed', () => {
            const bag = new Bag();
            bag.setItem('a', 1);
            bag.setItem('b', 2);

            const events = [];
            bag.subscribe('test', {
                delete: (e) => events.push({ type: 'del', label: e.node.label })
            });

            bag.pop('a');

            assert.strictEqual(events.length, 1);
            assert.strictEqual(events[0].label, 'a');
        });

        it('should call any callback for all event types', () => {
            const bag = new Bag();
            const events = [];
            bag.subscribe('test', {
                any: (e) => events.push(e.evt)
            });

            bag.setItem('a', 1);
            bag.pop('a');

            assert.strictEqual(events.length, 2);
            assert.strictEqual(events[0], 'ins');
            assert.strictEqual(events[1], 'del');
        });

        it('should unsubscribe from events', () => {
            const bag = new Bag();
            const events = [];
            bag.subscribe('test', {
                insert: (e) => events.push('ins')
            });

            bag.setItem('a', 1);
            assert.strictEqual(events.length, 1);

            bag.unsubscribe('test', { insert: true });
            bag.setItem('b', 2);
            assert.strictEqual(events.length, 1); // No new event
        });

        it('should propagate events to parent', () => {
            const parent = new Bag();
            parent.setBackref();
            const child = new Bag();
            parent.setItem('child', child);

            // Manually set backref for child
            child.setBackref(parent.getNode('child'), parent);

            const events = [];
            parent.subscribe('test', {
                insert: (e) => events.push({ path: e.pathlist, label: e.node.label })
            });

            child.setItem('item', 42);

            assert.strictEqual(events.length, 1);
            assert.deepStrictEqual(events[0].path, ['child']);
            assert.strictEqual(events[0].label, 'item');
        });
    });

    describe('walk', () => {
        it('should walk flat bag', () => {
            const bag = new Bag();
            bag.setItem('a', 1);
            bag.setItem('b', 2);
            bag.setItem('c', 3);

            const result = [];
            for (const [path, node] of bag.walk()) {
                result.push([path, node.value]);
            }

            assert.deepStrictEqual(result, [
                ['a', 1],
                ['b', 2],
                ['c', 3]
            ]);
        });

        it('should walk nested bag depth-first', () => {
            const bag = new Bag();
            bag.setItem('a', 1);
            bag.setItem('b.x', 10);
            bag.setItem('b.y', 20);
            bag.setItem('c', 3);

            const paths = [];
            for (const [path] of bag.walk()) {
                paths.push(path);
            }

            assert.deepStrictEqual(paths, ['a', 'b', 'b.x', 'b.y', 'c']);
        });

        it('should walk deeply nested structure', () => {
            const bag = new Bag();
            bag.setItem('level1.level2.level3', 'deep');

            const result = [];
            for (const [path, node] of bag.walk()) {
                result.push([path, node.value instanceof Bag ? 'Bag' : node.value]);
            }

            assert.deepStrictEqual(result, [
                ['level1', 'Bag'],
                ['level1.level2', 'Bag'],
                ['level1.level2.level3', 'deep']
            ]);
        });

        it('should walk empty bag', () => {
            const bag = new Bag();
            const result = [...bag.walk()];
            assert.deepStrictEqual(result, []);
        });
    });

    describe('_nodeFlattener', () => {
        it('should flatten flat bag', () => {
            const bag = new Bag();
            bag.setItem('a', 1);
            bag.setItem('b', 'hello');

            const rows = [...bag._nodeFlattener()];

            assert.strictEqual(rows.length, 2);
            // [parent, label, tag, value, attr]
            // Root level uses '' for parent (matches Python behavior)
            assert.deepStrictEqual(rows[0], ['', 'a', null, 1, {}]);
            assert.deepStrictEqual(rows[1], ['', 'b', null, 'hello', {}]);
        });

        it('should flatten nested bag with ::X marker', () => {
            const bag = new Bag();
            bag.setItem('parent.child', 'value');

            const rows = [...bag._nodeFlattener()];

            assert.strictEqual(rows.length, 2);
            // parent is a Bag -> ::X
            assert.strictEqual(rows[0][1], 'parent');
            assert.strictEqual(rows[0][3], '::X');
            // child has parent path
            assert.strictEqual(rows[1][0], 'parent');
            assert.strictEqual(rows[1][1], 'child');
            assert.strictEqual(rows[1][3], 'value');
        });

        it('should flatten null values with ::NN marker', () => {
            const bag = new Bag();
            bag.setItem('empty', null);

            const rows = [...bag._nodeFlattener()];

            assert.strictEqual(rows.length, 1);
            assert.strictEqual(rows[0][3], '::NN');
        });

        it('should include attributes', () => {
            const bag = new Bag();
            bag.setItem('item', 42, { color: 'red', size: 10 });

            const rows = [...bag._nodeFlattener()];

            assert.strictEqual(rows.length, 1);
            assert.deepStrictEqual(rows[0][4], { color: 'red', size: 10 });
        });

        it('should work in compact mode with path registry', () => {
            const bag = new Bag();
            bag.setItem('a.b', 1);
            bag.setItem('a.c', 2);

            const paths = {};
            const rows = [...bag._nodeFlattener(paths)];

            // 'a' is a Bag, should be registered
            assert.strictEqual(paths[0], 'a');
            // First row: 'a' has null parent (root)
            assert.strictEqual(rows[0][0], null);
            // Second and third rows have numeric parent ref
            assert.strictEqual(rows[1][0], 0);
            assert.strictEqual(rows[2][0], 0);
        });
    });
});
