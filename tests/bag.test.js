// Copyright 2025 Softwell S.r.l. - SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Bag } from '../src/index.js';
import { BagResolver } from '../src/resolver.js';

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

    describe('#n index access', () => {
        it('should get value by #n index', () => {
            const bag = new Bag();
            bag.setItem('a', 10);
            bag.setItem('b', 20);
            bag.setItem('c', 30);

            assert.strictEqual(bag.getItem('#0'), 10);
            assert.strictEqual(bag.getItem('#1'), 20);
            assert.strictEqual(bag.getItem('#2'), 30);
        });

        it('should return default for out of range index', () => {
            const bag = new Bag();
            bag.setItem('a', 1);

            assert.strictEqual(bag.getItem('#99'), null);
            assert.strictEqual(bag.getItem('#99', 'default'), 'default');
        });

        it('should get node by #n index', () => {
            const bag = new Bag();
            bag.setItem('a', 10);
            bag.setItem('b', 20);

            const node = bag.getNode('#1');
            assert.strictEqual(node.label, 'b');
            assert.strictEqual(node.value, 20);
        });

        it('should find node by #attr=value syntax via container', () => {
            const bag = new Bag();
            bag.setItem('item1', 'val1', { id: '123' });
            bag.setItem('item2', 'val2', { id: '456' });
            bag.setItem('item3', 'val3', { id: '789' });

            // #attr=value works at container level
            const idx = bag._nodes.index('#id=456');
            assert.strictEqual(idx, 1);
            const node = bag._nodes.get(idx);
            assert.strictEqual(node.label, 'item2');
        });

        it('should find node by #=value syntax via container', () => {
            const bag = new Bag();
            bag.setItem('a', 'alpha');
            bag.setItem('b', 'beta');
            bag.setItem('c', 'gamma');

            // #=value works at container level
            const idx = bag._nodes.index('#=beta');
            assert.strictEqual(idx, 1);
            const node = bag._nodes.get(idx);
            assert.strictEqual(node.label, 'b');
        });
    });

    describe('position parameter in setItem', () => {
        it('should append at end by default', () => {
            const bag = new Bag();
            bag.setItem('a', 1);
            bag.setItem('b', 2);
            bag.setItem('c', 3);

            assert.deepStrictEqual(bag.keys(), ['a', 'b', 'c']);
        });

        it('should append at end with > position', () => {
            const bag = new Bag();
            bag.setItem('a', 1);
            bag.setItem('b', 2);
            bag.setItem('last', 'X', null, '>');

            assert.deepStrictEqual(bag.keys(), ['a', 'b', 'last']);
        });

        it('should prepend at beginning with < position', () => {
            const bag = new Bag();
            bag.setItem('a', 1);
            bag.setItem('b', 2);
            bag.setItem('first', 'X', null, '<');

            assert.deepStrictEqual(bag.keys(), ['first', 'a', 'b']);
        });

        it('should insert at index with #n position', () => {
            const bag = new Bag();
            bag.setItem('a', 1);
            bag.setItem('b', 2);
            bag.setItem('c', 3);
            bag.setItem('mid', 'X', null, '#1');

            assert.deepStrictEqual(bag.keys(), ['a', 'mid', 'b', 'c']);
        });

        it('should insert after label with >label position', () => {
            const bag = new Bag();
            bag.setItem('a', 1);
            bag.setItem('b', 2);
            bag.setItem('c', 3);
            bag.setItem('after_a', 'X', null, '>a');

            assert.deepStrictEqual(bag.keys(), ['a', 'after_a', 'b', 'c']);
        });

        it('should insert before label with <label position', () => {
            const bag = new Bag();
            bag.setItem('a', 1);
            bag.setItem('b', 2);
            bag.setItem('c', 3);
            bag.setItem('before_c', 'X', null, '<c');

            assert.deepStrictEqual(bag.keys(), ['a', 'b', 'before_c', 'c']);
        });

        it('should insert before index with <#n position', () => {
            const bag = new Bag();
            bag.setItem('a', 1);
            bag.setItem('b', 2);
            bag.setItem('c', 3);
            bag.setItem('new', 'X', null, '<#2');

            assert.deepStrictEqual(bag.keys(), ['a', 'b', 'new', 'c']);
        });

        it('should insert after index with >#n position', () => {
            const bag = new Bag();
            bag.setItem('a', 1);
            bag.setItem('b', 2);
            bag.setItem('c', 3);
            bag.setItem('new', 'X', null, '>#0');

            assert.deepStrictEqual(bag.keys(), ['a', 'new', 'b', 'c']);
        });

        it('should append at end for missing label reference', () => {
            const bag = new Bag();
            bag.setItem('a', 1);
            bag.setItem('b', 2);
            bag.setItem('new', 'X', null, '>missing');

            assert.deepStrictEqual(bag.keys(), ['a', 'b', 'new']);
        });

        it('should append at end for unknown position syntax', () => {
            const bag = new Bag();
            bag.setItem('a', 1);
            bag.setItem('b', 2);
            bag.setItem('new', 'X', null, 'unknown');

            assert.deepStrictEqual(bag.keys(), ['a', 'b', 'new']);
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

    describe('fullpath', () => {
        it('should return null for root bag', () => {
            const bag = new Bag();
            bag.setItem('a', 1);
            assert.strictEqual(bag.fullpath, null);
        });

        it('should return path for nested bag with backref', () => {
            const root = new Bag();
            root.setBackref();
            root.setItem('level1.level2.value', 42);

            const level1 = root.getItem('level1');
            const level2 = root.getItem('level1.level2');

            // level1 is a child of root
            assert.strictEqual(level1.fullpath, 'level1');
            // level2 is a child of level1
            assert.strictEqual(level2.fullpath, 'level1.level2');
        });
    });

    describe('node position and fullpath', () => {
        it('should return node position in parent', () => {
            const bag = new Bag();
            bag.setItem('a', 1);
            bag.setItem('b', 2);
            bag.setItem('c', 3);

            assert.strictEqual(bag.getNode('a').position, 0);
            assert.strictEqual(bag.getNode('b').position, 1);
            assert.strictEqual(bag.getNode('c').position, 2);
        });

        it('should return node fullpath with backref', () => {
            const bag = new Bag();
            bag.setBackref();
            bag.setItem('parent.child.grandchild', 'deep');

            const childNode = bag.getNode('parent.child');
            const grandchildNode = bag.getNode('parent.child.grandchild');

            // Note: node fullpath depends on parent bag fullpath
            // which is only set when backref is enabled
            assert.strictEqual(childNode.fullpath, 'parent.child');
            assert.strictEqual(grandchildNode.fullpath, 'parent.child.grandchild');
        });

        it('should return parentNode for nested nodes', () => {
            const bag = new Bag();
            bag.setBackref();
            bag.setItem('parent.child', 'value');

            const parentNode = bag.getNode('parent');
            const childNode = bag.getNode('parent.child');

            // childNode's parentNode is parentNode (the node containing the parent Bag)
            assert.strictEqual(childNode.parentNode, parentNode);
        });
    });

    describe('attributeOwnerNode', () => {
        it('should find attribute owner in ancestor chain', () => {
            const bag = new Bag();
            bag.setBackref();
            bag.setItem('parent', new Bag(), { inherited: 'from-parent' });
            bag.setItem('parent.child', 'value', { own: 'attr' });

            const childNode = bag.getNode('parent.child');

            // own attribute
            assert.strictEqual(childNode.attributeOwnerNode('own'), childNode);

            // inherited attribute - should find parent node
            const owner = childNode.attributeOwnerNode('inherited');
            assert.strictEqual(owner, bag.getNode('parent'));
        });

        it('should return null when attribute not found in chain', () => {
            const bag = new Bag();
            bag.setBackref();
            bag.setItem('parent.child', 'value');

            const childNode = bag.getNode('parent.child');
            assert.strictEqual(childNode.attributeOwnerNode('nonexistent'), null);
        });

        it('should check attribute value when provided', () => {
            const bag = new Bag();
            bag.setBackref();
            bag.setItem('parent', new Bag(), { color: 'red' });
            bag.setItem('parent.child', 'value', { color: 'blue' });

            const childNode = bag.getNode('parent.child');

            // Find owner of color='blue'
            assert.strictEqual(childNode.attributeOwnerNode('color', 'blue'), childNode);

            // Find owner of color='red' (should be parent)
            assert.strictEqual(childNode.attributeOwnerNode('color', 'red'), bag.getNode('parent'));

            // Find owner of color='green' (should be null)
            assert.strictEqual(childNode.attributeOwnerNode('color', 'green'), null);
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

        it('should call update callback when node value changes', () => {
            const bag = new Bag();
            bag.setItem('a', 1);

            const events = [];
            bag.subscribe('test', {
                update: (e) => events.push({ evt: e.evt, label: e.node.label, oldvalue: e.oldvalue })
            });

            bag.setItem('a', 2);

            assert.strictEqual(events.length, 1);
            assert.strictEqual(events[0].evt, 'upd_value');
            assert.strictEqual(events[0].label, 'a');
            assert.strictEqual(events[0].oldvalue, 1);
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

            bag.setItem('a', 1);  // insert
            bag.setItem('a', 2);  // update
            bag.pop('a');         // delete

            assert.strictEqual(events.length, 3);
            assert.strictEqual(events[0], 'ins');
            assert.strictEqual(events[1], 'upd_value');
            assert.strictEqual(events[2], 'del');
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

        it('should unsubscribe update callback', () => {
            const bag = new Bag();
            bag.setItem('a', 1);
            const events = [];
            bag.subscribe('test', {
                update: (e) => events.push('upd')
            });

            bag.setItem('a', 2);
            assert.strictEqual(events.length, 1);

            bag.unsubscribe('test', { update: true });
            bag.setItem('a', 3);
            assert.strictEqual(events.length, 1); // No new event
        });

        it('should unsubscribe with any=true removes all callbacks', () => {
            const bag = new Bag();
            const events = [];
            bag.subscribe('test', {
                any: (e) => events.push(e.evt)
            });

            bag.setItem('a', 1);
            assert.strictEqual(events.length, 1);

            bag.unsubscribe('test', { any: true });
            bag.setItem('a', 2);
            bag.pop('a');
            assert.strictEqual(events.length, 1); // No new events
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

        it('should have multiple subscribers receive events independently', () => {
            const bag = new Bag();
            const events1 = [];
            const events2 = [];
            bag.subscribe('sub1', { insert: (e) => events1.push('ins') });
            bag.subscribe('sub2', { insert: (e) => events2.push('ins') });

            bag.setItem('a', 1);

            assert.deepStrictEqual(events1, ['ins']);
            assert.deepStrictEqual(events2, ['ins']);
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

    describe('isEqual', () => {
        it('should return true for equal bags', () => {
            const bag1 = new Bag();
            bag1.setItem('a', 1);
            bag1.setItem('b', 2);

            const bag2 = new Bag();
            bag2.setItem('a', 1);
            bag2.setItem('b', 2);

            assert.strictEqual(bag1.isEqual(bag2), true);
        });

        it('should return false for different values', () => {
            const bag1 = new Bag();
            bag1.setItem('a', 1);

            const bag2 = new Bag();
            bag2.setItem('a', 2);

            assert.strictEqual(bag1.isEqual(bag2), false);
        });

        it('should return false for different keys', () => {
            const bag1 = new Bag();
            bag1.setItem('a', 1);

            const bag2 = new Bag();
            bag2.setItem('b', 1);

            assert.strictEqual(bag1.isEqual(bag2), false);
        });

        it('should return false for different lengths', () => {
            const bag1 = new Bag();
            bag1.setItem('a', 1);
            bag1.setItem('b', 2);

            const bag2 = new Bag();
            bag2.setItem('a', 1);

            assert.strictEqual(bag1.isEqual(bag2), false);
        });

        it('should compare attributes', () => {
            const bag1 = new Bag();
            bag1.setItem('a', 1, { color: 'red' });

            const bag2 = new Bag();
            bag2.setItem('a', 1, { color: 'red' });

            const bag3 = new Bag();
            bag3.setItem('a', 1, { color: 'blue' });

            assert.strictEqual(bag1.isEqual(bag2), true);
            assert.strictEqual(bag1.isEqual(bag3), false);
        });

        it('should compare nested bags recursively', () => {
            const bag1 = new Bag();
            bag1.setItem('parent.child', 'value');

            const bag2 = new Bag();
            bag2.setItem('parent.child', 'value');

            const bag3 = new Bag();
            bag3.setItem('parent.child', 'different');

            assert.strictEqual(bag1.isEqual(bag2), true);
            assert.strictEqual(bag1.isEqual(bag3), false);
        });

        it('should return true for empty bags', () => {
            const bag1 = new Bag();
            const bag2 = new Bag();

            assert.strictEqual(bag1.isEqual(bag2), true);
        });
    });

    describe('root property', () => {
        it('should return itself for root bag', () => {
            const bag = new Bag();
            bag.setItem('a', 1);
            assert.strictEqual(bag.root, bag);
        });

        it('should return root for nested bag with backref', () => {
            const root = new Bag();
            root.setBackref();
            root.setItem('level1.level2.value', 42);

            const level1 = root.getItem('level1');
            const level2 = root.getItem('level1.level2');

            assert.strictEqual(level1.root, root);
            assert.strictEqual(level2.root, root);
        });

        it('should return itself when no parent set', () => {
            const bag = new Bag();
            assert.strictEqual(bag.root, bag);
        });
    });

    describe('attributes property', () => {
        it('should return empty object for root bag', () => {
            const bag = new Bag();
            assert.deepStrictEqual(bag.attributes, {});
        });

        it('should return parent node attributes', () => {
            const parent = new Bag();
            parent.setBackref();
            parent.setItem('child', new Bag(), { color: 'red', size: 10 });

            const child = parent.getItem('child');
            assert.deepStrictEqual(child.attributes, { color: 'red', size: 10 });
        });

        it('should return empty object when parentNode is null', () => {
            const bag = new Bag();
            bag._parent = new Bag(); // Set parent but not parentNode
            assert.deepStrictEqual(bag.attributes, {});
        });
    });

    describe('rootAttributes property', () => {
        it('should be null by default', () => {
            const bag = new Bag();
            assert.strictEqual(bag.rootAttributes, null);
        });

        it('should set and get root attributes', () => {
            const bag = new Bag();
            bag.rootAttributes = { version: '1.0', encoding: 'utf-8' };
            assert.deepStrictEqual(bag.rootAttributes, { version: '1.0', encoding: 'utf-8' });
        });

        it('should copy attributes on set', () => {
            const bag = new Bag();
            const attrs = { a: 1, b: 2 };
            bag.rootAttributes = attrs;
            attrs.c = 3; // Modify original
            assert.deepStrictEqual(bag.rootAttributes, { a: 1, b: 2 }); // Should not have c
        });

        it('should allow setting to null', () => {
            const bag = new Bag();
            bag.rootAttributes = { key: 'value' };
            bag.rootAttributes = null;
            assert.strictEqual(bag.rootAttributes, null);
        });
    });

    describe('nodes property', () => {
        it('should return all nodes', () => {
            const bag = new Bag();
            bag.setItem('a', 1);
            bag.setItem('b', 2);
            bag.setItem('c', 3);

            const nodes = bag.nodes;
            assert.strictEqual(nodes.length, 3);
            assert.strictEqual(nodes[0].label, 'a');
            assert.strictEqual(nodes[1].label, 'b');
            assert.strictEqual(nodes[2].label, 'c');
        });

        it('should return empty array for empty bag', () => {
            const bag = new Bag();
            assert.deepStrictEqual(bag.nodes, []);
        });
    });

    describe('node() method', () => {
        it('should get node by label', () => {
            const bag = new Bag();
            bag.setItem('alpha', 10, { type: 'number' });
            bag.setItem('beta', 20);

            const node = bag.node('alpha');
            assert.strictEqual(node.label, 'alpha');
            assert.strictEqual(node.value, 10);
            assert.strictEqual(node.getAttr('type'), 'number');
        });

        it('should get node by index', () => {
            const bag = new Bag();
            bag.setItem('a', 1);
            bag.setItem('b', 2);
            bag.setItem('c', 3);

            const node = bag.node(1);
            assert.strictEqual(node.label, 'b');
            assert.strictEqual(node.value, 2);
        });

        it('should return null for missing label', () => {
            const bag = new Bag();
            bag.setItem('a', 1);
            assert.strictEqual(bag.node('missing'), null);
        });

        it('should return null for out of range index', () => {
            const bag = new Bag();
            bag.setItem('a', 1);
            assert.strictEqual(bag.node(99), null);
        });
    });

    describe('setAttr() method', () => {
        it('should set attributes on path', () => {
            const bag = new Bag();
            bag.setItem('item', 'value');
            bag.setAttr('item', { color: 'red', size: 10 });

            const node = bag.getNode('item');
            assert.strictEqual(node.getAttr('color'), 'red');
            assert.strictEqual(node.getAttr('size'), 10);
        });

        it('should merge with existing attributes', () => {
            const bag = new Bag();
            bag.setItem('item', 'value', { existing: 'attr' });
            bag.setAttr('item', { color: 'blue' });

            const node = bag.getNode('item');
            assert.strictEqual(node.getAttr('existing'), 'attr');
            assert.strictEqual(node.getAttr('color'), 'blue');
        });

        it('should work on nested path', () => {
            const bag = new Bag();
            bag.setItem('parent.child', 'value');
            bag.setAttr('parent.child', { nested: true });

            assert.strictEqual(bag.getNode('parent.child').getAttr('nested'), true);
        });
    });

    describe('getAttr() method', () => {
        it('should get attribute from path', () => {
            const bag = new Bag();
            bag.setItem('item', 'value', { color: 'red' });

            assert.strictEqual(bag.getAttr('item', 'color'), 'red');
        });

        it('should return default for missing attribute', () => {
            const bag = new Bag();
            bag.setItem('item', 'value');

            assert.strictEqual(bag.getAttr('item', 'missing'), null);
            assert.strictEqual(bag.getAttr('item', 'missing', 'default'), 'default');
        });

        it('should return default for missing path', () => {
            const bag = new Bag();
            assert.strictEqual(bag.getAttr('missing', 'attr'), null);
            assert.strictEqual(bag.getAttr('missing', 'attr', 'default'), 'default');
        });

        it('should work on nested path', () => {
            const bag = new Bag();
            bag.setItem('parent.child', 'value', { level: 2 });

            assert.strictEqual(bag.getAttr('parent.child', 'level'), 2);
        });
    });

    describe('delAttr() method', () => {
        it('should delete single attribute', () => {
            const bag = new Bag();
            bag.setItem('item', 'value', { color: 'red', size: 10 });
            bag.delAttr('item', 'color');

            const node = bag.getNode('item');
            assert.strictEqual(node.getAttr('color'), null);
            assert.strictEqual(node.getAttr('size'), 10);
        });

        it('should delete multiple attributes', () => {
            const bag = new Bag();
            bag.setItem('item', 'value', { a: 1, b: 2, c: 3 });
            bag.delAttr('item', 'a', 'c');

            const node = bag.getNode('item');
            assert.strictEqual(node.getAttr('a'), null);
            assert.strictEqual(node.getAttr('b'), 2);
            assert.strictEqual(node.getAttr('c'), null);
        });

        it('should do nothing for missing path', () => {
            const bag = new Bag();
            bag.delAttr('missing', 'attr'); // Should not throw
        });
    });

    describe('getInheritedAttributes() method', () => {
        it('should return empty object for root bag', () => {
            const bag = new Bag();
            assert.deepStrictEqual(bag.getInheritedAttributes(), {});
        });

        it('should return inherited attributes from parent chain', () => {
            const root = new Bag();
            root.setBackref();
            root.setItem('parent', new Bag(), { parentAttr: 'value', shared: 'parent' });
            root.setItem('parent.child', new Bag(), { childAttr: 'child', shared: 'child' });

            const child = root.getItem('parent.child');
            const inherited = child.getInheritedAttributes();

            assert.strictEqual(inherited.childAttr, 'child');
            assert.strictEqual(inherited.parentAttr, 'value');
            assert.strictEqual(inherited.shared, 'child'); // Child overrides parent
        });
    });

    // =========================================================================
    // Phase 3: Structure Manipulation Methods
    // =========================================================================

    describe('move() method', () => {
        it('should move single element forward', () => {
            const bag = new Bag();
            bag.setItem('a', 1);
            bag.setItem('b', 2);
            bag.setItem('c', 3);

            bag.move(0, 2);  // move 'a' to position 2

            assert.deepStrictEqual(bag.query('#k'), ['b', 'c', 'a']);
        });

        it('should move single element backward', () => {
            const bag = new Bag();
            bag.setItem('a', 1);
            bag.setItem('b', 2);
            bag.setItem('c', 3);

            bag.move(2, 0);  // move 'c' to position 0

            assert.deepStrictEqual(bag.query('#k'), ['c', 'a', 'b']);
        });

        it('should move multiple elements', () => {
            const bag = new Bag();
            bag.setItem('a', 1);
            bag.setItem('b', 2);
            bag.setItem('c', 3);
            bag.setItem('d', 4);

            bag.move([0, 3], 2);  // move 'a' and 'd' to position 2

            assert.deepStrictEqual(bag.query('#k'), ['b', 'c', 'a', 'd']);
        });
    });

    describe('asDict() method', () => {
        it('should convert to plain object', () => {
            const bag = new Bag();
            bag.setItem('name', 'Alice');
            bag.setItem('age', 30);

            const obj = bag.asDict();

            assert.deepStrictEqual(obj, { name: 'Alice', age: 30 });
        });

        it('should convert keys to lowercase when lower=true', () => {
            const bag = new Bag();
            bag.setItem('Name', 'Alice');
            bag.setItem('AGE', 30);

            const obj = bag.asDict(false, true);

            assert.deepStrictEqual(obj, { name: 'Alice', age: 30 });
        });

        it('should return empty object for empty bag', () => {
            const bag = new Bag();
            assert.deepStrictEqual(bag.asDict(), {});
        });

        it('should only convert first level', () => {
            const bag = new Bag();
            bag.setItem('outer.inner', 'nested');

            const obj = bag.asDict();

            // 'outer' is a Bag, not converted recursively
            assert.ok(obj.outer instanceof Bag);
        });
    });

    describe('setdefault() method', () => {
        it('should return existing value if path exists', () => {
            const bag = new Bag();
            bag.setItem('existing', 'value');

            const result = bag.setdefault('existing', 'default');

            assert.strictEqual(result, 'value');
            assert.strictEqual(bag.getItem('existing'), 'value');
        });

        it('should set and return default if path does not exist', () => {
            const bag = new Bag();

            const result = bag.setdefault('missing', 'default');

            assert.strictEqual(result, 'default');
            assert.strictEqual(bag.getItem('missing'), 'default');
        });

        it('should set default to null if not provided', () => {
            const bag = new Bag();

            const result = bag.setdefault('missing');

            assert.strictEqual(result, null);
            assert.strictEqual(bag.getItem('missing'), null);
        });

        it('should work with nested paths', () => {
            const bag = new Bag();

            const result = bag.setdefault('a.b.c', 'deep');

            assert.strictEqual(result, 'deep');
            assert.strictEqual(bag.getItem('a.b.c'), 'deep');
        });
    });

    describe('deepcopy() method', () => {
        it('should create independent copy', () => {
            const bag = new Bag();
            bag.setItem('a', 1);
            bag.setItem('b', 2);

            const copy = bag.deepcopy();

            copy.setItem('a', 100);
            assert.strictEqual(bag.getItem('a'), 1);  // Original unchanged
            assert.strictEqual(copy.getItem('a'), 100);
        });

        it('should deep copy nested Bags', () => {
            const bag = new Bag();
            bag.setItem('outer.inner', 'value');

            const copy = bag.deepcopy();

            copy.setItem('outer.inner', 'changed');
            assert.strictEqual(bag.getItem('outer.inner'), 'value');  // Original unchanged
            assert.strictEqual(copy.getItem('outer.inner'), 'changed');
        });

        it('should copy attributes', () => {
            const bag = new Bag();
            bag.setItem('item', 'value', { color: 'red', size: 10 });

            const copy = bag.deepcopy();

            assert.strictEqual(copy.getAttr('item', 'color'), 'red');
            assert.strictEqual(copy.getAttr('item', 'size'), 10);

            // Modify copy attributes
            copy.setAttr('item', { color: 'blue' });
            assert.strictEqual(bag.getAttr('item', 'color'), 'red');  // Original unchanged
        });

        it('should copy empty bag', () => {
            const bag = new Bag();
            const copy = bag.deepcopy();

            assert.strictEqual(copy.length, 0);
        });
    });

    describe('update() method', () => {
        it('should update from plain object', () => {
            const bag = new Bag();
            bag.setItem('a', 1);
            bag.setItem('b', 2);

            bag.update({ a: 10, c: 3 });

            assert.strictEqual(bag.getItem('a'), 10);  // Updated
            assert.strictEqual(bag.getItem('b'), 2);   // Unchanged
            assert.strictEqual(bag.getItem('c'), 3);   // Added
        });

        it('should update from another Bag', () => {
            const bag = new Bag();
            bag.setItem('a', 1);

            const other = new Bag();
            other.setItem('a', 100, { attr: 'value' });
            other.setItem('b', 200);

            bag.update(other);

            assert.strictEqual(bag.getItem('a'), 100);
            assert.strictEqual(bag.getAttr('a', 'attr'), 'value');
            assert.strictEqual(bag.getItem('b'), 200);
        });

        it('should merge attributes', () => {
            const bag = new Bag();
            bag.setItem('item', 'value', { existing: 'attr' });

            const other = new Bag();
            other.setItem('item', 'newvalue', { new: 'attr' });

            bag.update(other);

            assert.strictEqual(bag.getAttr('item', 'existing'), 'attr');
            assert.strictEqual(bag.getAttr('item', 'new'), 'attr');
        });

        it('should recursively update nested Bags', () => {
            const bag = new Bag();
            bag.setItem('outer.a', 1);
            bag.setItem('outer.b', 2);

            const other = new Bag();
            other.setItem('outer.a', 100);
            other.setItem('outer.c', 300);

            bag.update(other);

            assert.strictEqual(bag.getItem('outer.a'), 100);  // Updated
            assert.strictEqual(bag.getItem('outer.b'), 2);    // Unchanged
            assert.strictEqual(bag.getItem('outer.c'), 300);  // Added
        });

        it('should respect ignoreNone option', () => {
            const bag = new Bag();
            bag.setItem('a', 'original');
            bag.setItem('b', 'also original');

            bag.update({ a: null, b: 'changed' }, true);

            assert.strictEqual(bag.getItem('a'), 'original');  // Not overwritten with null
            assert.strictEqual(bag.getItem('b'), 'changed');
        });

        it('should overwrite with null when ignoreNone=false', () => {
            const bag = new Bag();
            bag.setItem('a', 'original');

            bag.update({ a: null }, false);

            assert.strictEqual(bag.getItem('a'), null);
        });
    });

    describe('fillFrom', () => {
        it('should do nothing when source is null', () => {
            const bag = new Bag();
            bag.setItem('existing', 'value');

            const result = bag.fillFrom(null);

            assert.strictEqual(result, bag);
            assert.strictEqual(bag.getItem('existing'), 'value');
        });

        it('should do nothing when source is undefined', () => {
            const bag = new Bag();
            bag.setItem('existing', 'value');

            const result = bag.fillFrom(undefined);

            assert.strictEqual(result, bag);
            assert.strictEqual(bag.getItem('existing'), 'value');
        });

        it('should clear and fill from plain object', () => {
            const bag = new Bag();
            bag.setItem('old', 'data');

            bag.fillFrom({ a: 1, b: 2 });

            assert.strictEqual(bag.getItem('old'), null);  // Cleared
            assert.strictEqual(bag.getItem('a'), 1);
            assert.strictEqual(bag.getItem('b'), 2);
        });

        it('should convert nested objects to Bags', () => {
            const bag = new Bag();
            bag.fillFrom({
                name: 'test',
                config: {
                    host: 'localhost',
                    port: 5432
                }
            });

            assert.strictEqual(bag.getItem('name'), 'test');
            assert.ok(bag.getItem('config') instanceof Bag);
            assert.strictEqual(bag.getItem('config.host'), 'localhost');
            assert.strictEqual(bag.getItem('config.port'), 5432);
        });

        it('should convert deeply nested objects', () => {
            const bag = new Bag();
            bag.fillFrom({
                level1: {
                    level2: {
                        level3: 'deep'
                    }
                }
            });

            assert.strictEqual(bag.getItem('level1.level2.level3'), 'deep');
        });

        it('should clear and fill from another Bag', () => {
            const source = new Bag();
            source.setItem('x', 10);
            source.setItem('y', 20);

            const bag = new Bag();
            bag.setItem('old', 'data');
            bag.fillFrom(source);

            assert.strictEqual(bag.getItem('old'), null);  // Cleared
            assert.strictEqual(bag.getItem('x'), 10);
            assert.strictEqual(bag.getItem('y'), 20);
        });

        it('should deep copy nested Bags from source Bag', () => {
            const source = new Bag();
            const inner = new Bag();
            inner.setItem('deep', 'value');
            source.setItem('outer', inner);

            const bag = new Bag();
            bag.fillFrom(source);

            // Modify source inner
            inner.setItem('deep', 'changed');

            // Target should be unaffected (deep copy)
            assert.strictEqual(bag.getItem('outer.deep'), 'value');
        });

        it('should copy attributes from source Bag nodes', () => {
            const source = new Bag();
            source.setItem('item', 'value', { color: 'red', size: 10 });

            const bag = new Bag();
            bag.fillFrom(source);

            const node = bag.getNode('item');
            assert.strictEqual(node.getAttr().color, 'red');
            assert.strictEqual(node.getAttr().size, 10);
        });

        it('should return this for chaining', () => {
            const bag = new Bag();
            const result = bag.fillFrom({ a: 1 });

            assert.strictEqual(result, bag);
        });

        it('should be chainable with other methods', () => {
            const bag = new Bag();
            bag.fillFrom({ a: 1 }).setItem('b', 2);

            assert.strictEqual(bag.getItem('a'), 1);
            assert.strictEqual(bag.getItem('b'), 2);
        });

        it('should handle arrays as values (not convert to Bag)', () => {
            const bag = new Bag();
            bag.fillFrom({ items: [1, 2, 3] });

            const items = bag.getItem('items');
            assert.ok(Array.isArray(items));
            assert.deepStrictEqual(items, [1, 2, 3]);
        });

        it('should preserve existing Bag values in source object', () => {
            const innerBag = new Bag();
            innerBag.setItem('key', 'value');

            const bag = new Bag();
            bag.fillFrom({ inner: innerBag });

            assert.ok(bag.getItem('inner') instanceof Bag);
            assert.strictEqual(bag.getItem('inner.key'), 'value');
        });
    });

    describe('toStringTree', () => {
        it('should return empty string for empty bag', () => {
            const bag = new Bag();
            assert.strictEqual(bag.toStringTree(), '');
        });

        it('should show simple values with tree structure', () => {
            const bag = new Bag();
            bag.setItem('a', 1);
            bag.setItem('b', 2);

            const result = bag.toStringTree();
            assert.ok(result.includes('├── a: 1'));
            assert.ok(result.includes('└── b: 2'));
        });

        it('should show single item with └──', () => {
            const bag = new Bag();
            bag.setItem('only', 'item');

            const result = bag.toStringTree();
            assert.ok(result.includes('└── only: "item"'));
        });

        it('should show string values with quotes', () => {
            const bag = new Bag();
            bag.setItem('name', 'hello');

            const result = bag.toStringTree();
            assert.ok(result.includes('"hello"'));
        });

        it('should truncate long strings', () => {
            const bag = new Bag();
            const longStr = 'a'.repeat(100);
            bag.setItem('long', longStr);

            const result = bag.toStringTree();
            assert.ok(result.includes('...'));
            assert.ok(!result.includes('a'.repeat(100)));
        });

        it('should show null values', () => {
            const bag = new Bag();
            bag.setItem('empty', null);

            const result = bag.toStringTree();
            assert.ok(result.includes('empty: null'));
        });

        it('should show nested Bags with indentation', () => {
            const bag = new Bag();
            bag.setItem('outer.inner', 'deep');

            const result = bag.toStringTree();
            assert.ok(result.includes('outer'));
            assert.ok(result.includes('inner: "deep"'));
            // Should have indentation for nested
            assert.ok(result.includes('    '));
        });

        it('should show attributes in brackets', () => {
            const bag = new Bag();
            bag.setItem('item', 'value', { color: 'red' });

            const result = bag.toStringTree();
            assert.ok(result.includes('[color="red"]'));
        });

        it('should show multiple attributes', () => {
            const bag = new Bag();
            bag.setItem('item', 'value', { a: 1, b: 2 });

            const result = bag.toStringTree();
            assert.ok(result.includes('a=1'));
            assert.ok(result.includes('b=2'));
        });

        it('should handle deeply nested structure', () => {
            const bag = new Bag();
            bag.setItem('l1.l2.l3', 'deep');

            const result = bag.toStringTree();
            const lines = result.split('\n');
            assert.ok(lines.length >= 3);
            assert.ok(result.includes('l1'));
            assert.ok(result.includes('l2'));
            assert.ok(result.includes('l3: "deep"'));
        });

        it('should handle mixed siblings with correct tree chars', () => {
            const bag = new Bag();
            bag.setItem('first', 1);
            bag.setItem('middle', 2);
            bag.setItem('last', 3);

            const result = bag.toStringTree();
            // First two should use ├──, last should use └──
            const lines = result.split('\n');
            assert.ok(lines[0].includes('├── first'));
            assert.ok(lines[1].includes('├── middle'));
            assert.ok(lines[2].includes('└── last'));
        });

        it('should handle nested bag with siblings', () => {
            const bag = new Bag();
            bag.setItem('config.host', 'localhost');
            bag.setItem('config.port', 5432);
            bag.setItem('name', 'app');

            const result = bag.toStringTree();
            assert.ok(result.includes('config'));
            assert.ok(result.includes('host: "localhost"'));
            assert.ok(result.includes('port: 5432'));
            assert.ok(result.includes('name: "app"'));
        });

        it('should show backref marker for bags with backref', () => {
            const bag = new Bag();
            bag.setBackref();  // Enable backref mode
            bag.setItem('child', new Bag());

            const result = bag.toStringTree();
            assert.ok(result.includes('(*)'));
        });

        it('should handle numeric values', () => {
            const bag = new Bag();
            bag.setItem('int', 42);
            bag.setItem('float', 3.14);
            bag.setItem('negative', -10);

            const result = bag.toStringTree();
            assert.ok(result.includes('int: 42'));
            assert.ok(result.includes('float: 3.14'));
            assert.ok(result.includes('negative: -10'));
        });

        it('should handle boolean values', () => {
            const bag = new Bag();
            bag.setItem('yes', true);
            bag.setItem('no', false);

            const result = bag.toStringTree();
            assert.ok(result.includes('yes: true'));
            assert.ok(result.includes('no: false'));
        });
    });

    // =========================================================================
    // Phase 5: Remaining Methods (has, resolver methods)
    // =========================================================================

    describe('has() method', () => {
        it('should return true for existing path', () => {
            const bag = new Bag();
            bag.setItem('a.b.c', 'value');

            assert.strictEqual(bag.has('a'), true);
            assert.strictEqual(bag.has('a.b'), true);
            assert.strictEqual(bag.has('a.b.c'), true);
        });

        it('should return false for non-existing path', () => {
            const bag = new Bag();
            bag.setItem('a.b', 'value');

            assert.strictEqual(bag.has('x'), false);
            assert.strictEqual(bag.has('a.c'), false);
            assert.strictEqual(bag.has('a.b.c'), false);
        });

        it('should return true for direct child by node', () => {
            const bag = new Bag();
            bag.setItem('item', 'value');

            const node = bag.node('item');
            assert.strictEqual(bag.has(node), true);
        });

        it('should return false for node not in this bag', () => {
            const bag1 = new Bag();
            bag1.setItem('a', 1);

            const bag2 = new Bag();
            bag2.setItem('b', 2);

            const node1 = bag1.node('a');
            assert.strictEqual(bag2.has(node1), false);
        });

        it('should return false for invalid input', () => {
            const bag = new Bag();
            bag.setItem('a', 1);

            assert.strictEqual(bag.has(123), false);
            assert.strictEqual(bag.has(null), false);
            assert.strictEqual(bag.has(undefined), false);
        });

        it('should work with empty bag', () => {
            const bag = new Bag();

            assert.strictEqual(bag.has('anything'), false);
        });
    });

    describe('getResolver() method', () => {
        it('should return null when node has no resolver', () => {
            const bag = new Bag();
            bag.setItem('item', 'value');

            assert.strictEqual(bag.getResolver('item'), null);
        });

        it('should return null for non-existing path', () => {
            const bag = new Bag();

            assert.strictEqual(bag.getResolver('missing'), null);
        });

        it('should return the resolver when set', () => {
            const bag = new Bag();
            const resolver = new BagResolver();
            bag.setResolver('item', resolver);

            assert.strictEqual(bag.getResolver('item'), resolver);
        });
    });

    describe('setResolver() method', () => {
        it('should set resolver on existing path', () => {
            const bag = new Bag();
            bag.setItem('item', 'initial');

            const resolver = new BagResolver();
            bag.setResolver('item', resolver);

            assert.strictEqual(bag.getResolver('item'), resolver);
        });

        it('should create path if not exists', () => {
            const bag = new Bag();
            const resolver = new BagResolver();

            bag.setResolver('new.path', resolver);

            assert.strictEqual(bag.has('new.path'), true);
            assert.strictEqual(bag.getResolver('new.path'), resolver);
        });

        it('should set value to null when setting resolver', () => {
            const bag = new Bag();
            const resolver = new BagResolver();

            bag.setResolver('item', resolver);

            const node = bag.getNode('item');
            assert.strictEqual(node.getValue(true), null);
        });
    });

    describe('setCallbackItem() method', () => {
        it('should create BagCbResolver with callback', () => {
            const bag = new Bag();
            const callback = () => 42;

            bag.setCallbackItem('computed', callback);

            const resolver = bag.getResolver('computed');
            assert.ok(resolver !== null);
            assert.strictEqual(resolver.constructor.name, 'BagCbResolver');
        });

        it('should pass options to resolver', () => {
            const bag = new Bag();
            const callback = () => 'value';

            bag.setCallbackItem('item', callback, { cacheTime: 60 });

            const resolver = bag.getResolver('item');
            assert.strictEqual(resolver.cacheTime, 60);
        });

        it('should create nested path', () => {
            const bag = new Bag();
            const callback = () => 'deep';

            bag.setCallbackItem('a.b.c', callback);

            assert.strictEqual(bag.has('a.b.c'), true);
            assert.ok(bag.getResolver('a.b.c') !== null);
        });
    });
});
