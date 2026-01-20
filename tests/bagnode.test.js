// Copyright 2025 Softwell S.r.l. - SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BagNode } from '../src/bag-node.js';

describe('BagNode', () => {
    describe('getValue with queryString', () => {
        it('should return value without queryString', () => {
            const node = new BagNode(null, 'test', 42);
            assert.strictEqual(node.getValue(), 42);
        });

        it('should return single attribute with queryString', () => {
            const node = new BagNode(null, 'test', 42, { color: 'red', size: 10 });
            assert.strictEqual(node.getValue(false, 'color'), 'red');
            assert.strictEqual(node.getValue(false, 'size'), 10);
        });

        it('should return multiple attributes with queryString', () => {
            const node = new BagNode(null, 'test', 42, { x: 1, y: 2, z: 3 });
            assert.deepStrictEqual(node.getValue(false, 'x&y'), [1, 2]);
            assert.deepStrictEqual(node.getValue(false, 'x&y&z'), [1, 2, 3]);
        });
    });

    describe('setValue with attributes', () => {
        it('should set value and attributes together', () => {
            const node = new BagNode(null, 'test');
            node.setValue(100, true, { type: 'number' });
            assert.strictEqual(node.value, 100);
            assert.strictEqual(node.getAttr('type'), 'number');
        });

        it('should preserve existing attributes with updattr=true', () => {
            const node = new BagNode(null, 'test', null, { a: 1, b: 2 });
            node.setValue(42, true, { c: 3 }, true);
            assert.deepStrictEqual(node.attr, { a: 1, b: 2, c: 3 });
        });

        it('should replace attributes with updattr=false', () => {
            const node = new BagNode(null, 'test', null, { a: 1, b: 2 });
            node.setValue(42, true, { c: 3 }, false);
            assert.deepStrictEqual(node.attr, { c: 3 });
        });
    });

    describe('setAttr', () => {
        it('should set attributes', () => {
            const node = new BagNode(null, 'test');
            node.setAttr({ a: 1, b: 2 });
            assert.deepStrictEqual(node.attr, { a: 1, b: 2 });
        });

        it('should merge attributes by default', () => {
            const node = new BagNode(null, 'test', null, { a: 1 });
            node.setAttr({ b: 2 });
            assert.deepStrictEqual(node.attr, { a: 1, b: 2 });
        });

        it('should replace attributes with updattr=false', () => {
            const node = new BagNode(null, 'test', null, { a: 1 });
            node.setAttr({ b: 2 }, true, false);
            assert.deepStrictEqual(node.attr, { b: 2 });
        });

        it('should remove null attributes by default', () => {
            const node = new BagNode(null, 'test', null, { a: 1, b: 2 });
            node.setAttr({ a: null });
            assert.deepStrictEqual(node.attr, { b: 2 });
        });

        it('should keep null attributes with removeNullAttributes=false', () => {
            const node = new BagNode(null, 'test', null, { a: 1 });
            node.setAttr({ b: null }, true, true, false);
            assert.deepStrictEqual(node.attr, { a: 1, b: null });
        });
    });

    describe('delAttr', () => {
        it('should delete single attribute', () => {
            const node = new BagNode(null, 'test', null, { a: 1, b: 2, c: 3 });
            node.delAttr('b');
            assert.deepStrictEqual(node.attr, { a: 1, c: 3 });
        });

        it('should delete multiple attributes', () => {
            const node = new BagNode(null, 'test', null, { a: 1, b: 2, c: 3 });
            node.delAttr('a', 'c');
            assert.deepStrictEqual(node.attr, { b: 2 });
        });

        it('should handle comma-separated string', () => {
            const node = new BagNode(null, 'test', null, { a: 1, b: 2, c: 3 });
            node.delAttr('a,c');
            assert.deepStrictEqual(node.attr, { b: 2 });
        });

        it('should ignore non-existent attributes', () => {
            const node = new BagNode(null, 'test', null, { a: 1 });
            node.delAttr('x', 'y');
            assert.deepStrictEqual(node.attr, { a: 1 });
        });
    });

    describe('hasAttr', () => {
        it('should return true if attribute exists', () => {
            const node = new BagNode(null, 'test', null, { color: 'red' });
            assert.strictEqual(node.hasAttr('color'), true);
        });

        it('should return false if attribute does not exist', () => {
            const node = new BagNode(null, 'test', null, { color: 'red' });
            assert.strictEqual(node.hasAttr('size'), false);
        });

        it('should check attribute value when provided', () => {
            const node = new BagNode(null, 'test', null, { color: 'red' });
            assert.strictEqual(node.hasAttr('color', 'red'), true);
            assert.strictEqual(node.hasAttr('color', 'blue'), false);
        });
    });

    describe('getInheritedAttributes', () => {
        it('should return own attributes when no parent', () => {
            const node = new BagNode(null, 'test', null, { a: 1, b: 2 });
            assert.deepStrictEqual(node.getInheritedAttributes(), { a: 1, b: 2 });
        });

        // Note: deeper inheritance tests require Bag with backref setup
    });

    describe('position', () => {
        it('should return null when no parent bag', () => {
            const node = new BagNode(null, 'test', 42);
            assert.strictEqual(node.position, null);
        });

        // Note: position with parent bag tested in bag.test.js
    });

    describe('fullpath', () => {
        it('should return null when no parent bag', () => {
            const node = new BagNode(null, 'test', 42);
            assert.strictEqual(node.fullpath, null);
        });

        // Note: fullpath with parent bag tested in bag.test.js
    });

    describe('parentNode', () => {
        it('should return null when no parent bag', () => {
            const node = new BagNode(null, 'test', 42);
            assert.strictEqual(node.parentNode, null);
        });

        // Note: parentNode with parent bag tested in bag.test.js
    });

    describe('attributeOwnerNode', () => {
        it('should return self when attribute exists', () => {
            const node = new BagNode(null, 'test', 42, { color: 'red' });
            assert.strictEqual(node.attributeOwnerNode('color'), node);
        });

        it('should return null when attribute not found and no parent', () => {
            const node = new BagNode(null, 'test', 42, { color: 'red' });
            assert.strictEqual(node.attributeOwnerNode('size'), null);
        });

        it('should check attribute value when provided', () => {
            const node = new BagNode(null, 'test', 42, { color: 'red' });
            assert.strictEqual(node.attributeOwnerNode('color', 'red'), node);
            assert.strictEqual(node.attributeOwnerNode('color', 'blue'), null);
        });
    });

    describe('asTuple', () => {
        it('should return array with label, value, attr, resolver', () => {
            const node = new BagNode(null, 'test', 42, { color: 'red' });
            const tuple = node.asTuple();
            assert.strictEqual(tuple[0], 'test');
            assert.strictEqual(tuple[1], 42);
            assert.deepStrictEqual(tuple[2], { color: 'red' });
            assert.strictEqual(tuple[3], null);
        });
    });

    describe('node subscribe/unsubscribe', () => {
        it('should call subscriber on setValue', () => {
            const node = new BagNode(null, 'test', 10);
            const events = [];
            node.subscribe('test', (e) => events.push(e));

            node.setValue(20);

            assert.strictEqual(events.length, 1);
            assert.strictEqual(events[0].evt, 'upd_value');
            assert.strictEqual(events[0].info, 10); // oldvalue
            assert.strictEqual(events[0].node, node);
        });

        it('should call subscriber on setAttr', () => {
            const node = new BagNode(null, 'test', 10, { a: 1 });
            const events = [];
            node.subscribe('test', (e) => events.push(e));

            node.setAttr({ b: 2 });

            assert.strictEqual(events.length, 1);
            assert.strictEqual(events[0].evt, 'upd_attrs');
            assert.deepStrictEqual(events[0].info, ['b']); // changed attrs
        });

        it('should not call subscriber when trigger=false', () => {
            const node = new BagNode(null, 'test', 10);
            const events = [];
            node.subscribe('test', (e) => events.push(e));

            node.setValue(20, false);
            node.setAttr({ a: 1 }, false);

            assert.strictEqual(events.length, 0);
        });

        it('should not call subscriber when value unchanged', () => {
            const node = new BagNode(null, 'test', 10);
            const events = [];
            node.subscribe('test', (e) => events.push(e));

            node.setValue(10); // same value

            assert.strictEqual(events.length, 0);
        });

        it('should unsubscribe correctly', () => {
            const node = new BagNode(null, 'test', 10);
            const events = [];
            node.subscribe('test', (e) => events.push(e));
            node.unsubscribe('test');

            node.setValue(20);

            assert.strictEqual(events.length, 0);
        });
    });
});
