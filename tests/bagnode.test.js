// Copyright 2025 Softwell S.r.l. - SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BagNode } from '../src/bag-node.js';
import { Bag } from '../src/bag.js';
import { BagCbResolver } from '../src/resolver.js';

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

    // Aligned with Python genro-bag 0.11.0
    describe('nodeTag and xmlTag', () => {
        it('should default to null', () => {
            const node = new BagNode(null, 'test', 42);
            assert.strictEqual(node.nodeTag, null);
            assert.strictEqual(node.xmlTag, null);
        });

        it('should accept nodeTag in constructor', () => {
            const node = new BagNode(null, 'test', 42, null, null, 'myTag');
            assert.strictEqual(node.nodeTag, 'myTag');
        });

        it('should accept xmlTag in constructor', () => {
            const node = new BagNode(null, 'test', 42, null, null, null, 'div');
            assert.strictEqual(node.xmlTag, 'div');
        });

        it('should accept both nodeTag and xmlTag', () => {
            const node = new BagNode(null, 'test', 42, null, null, 'myTag', 'div');
            assert.strictEqual(node.nodeTag, 'myTag');
            assert.strictEqual(node.xmlTag, 'div');
        });

        it('should allow mutation after construction', () => {
            const node = new BagNode(null, 'test', 42);
            node.nodeTag = 'changed';
            node.xmlTag = 'span';
            assert.strictEqual(node.nodeTag, 'changed');
            assert.strictEqual(node.xmlTag, 'span');
        });
    });

    // Aligned with Python genro-bag 0.11.0
    describe('isValid and _invalidReasons', () => {
        it('should be valid by default', () => {
            const node = new BagNode(null, 'test', 42);
            assert.strictEqual(node.isValid, true);
            assert.deepStrictEqual(node._invalidReasons, []);
        });

        it('should become invalid when reasons are added', () => {
            const node = new BagNode(null, 'test', 42);
            node._invalidReasons.push('required field missing');
            assert.strictEqual(node.isValid, false);
        });

        it('should become valid again when reasons are cleared', () => {
            const node = new BagNode(null, 'test', 42);
            node._invalidReasons.push('error');
            assert.strictEqual(node.isValid, false);
            node._invalidReasons.length = 0;
            assert.strictEqual(node.isValid, true);
        });
    });

    // Aligned with Python genro-bag 0.11.0
    describe('compiled', () => {
        it('should be null internally before first access', () => {
            const node = new BagNode(null, 'test', 42);
            assert.strictEqual(node._compiled, null);
        });

        it('should return empty object on first access', () => {
            const node = new BagNode(null, 'test', 42);
            assert.deepStrictEqual(node.compiled, {});
        });

        it('should return same object on subsequent access', () => {
            const node = new BagNode(null, 'test', 42);
            const c1 = node.compiled;
            const c2 = node.compiled;
            assert.strictEqual(c1, c2);
        });

        it('should allow storing data', () => {
            const node = new BagNode(null, 'test', 42);
            node.compiled.widget = 'TextBox';
            assert.strictEqual(node.compiled.widget, 'TextBox');
        });
    });

    // Aligned with Python genro-bag 0.11.0
    describe('isBranch', () => {
        it('should return false for scalar value', () => {
            const node = new BagNode(null, 'test', 42);
            assert.strictEqual(node.isBranch, false);
        });

        it('should return false for null value', () => {
            const node = new BagNode(null, 'test', null);
            assert.strictEqual(node.isBranch, false);
        });

        it('should return true for Bag value', () => {
            const bag = new Bag();
            const node = new BagNode(null, 'test', bag);
            assert.strictEqual(node.isBranch, true);
        });

        it('should return true for any object with _htraverse method', () => {
            const fakeBag = { _htraverse: () => {} };
            const node = new BagNode(null, 'test', fakeBag);
            assert.strictEqual(node.isBranch, true);
        });
    });

    // Aligned with Python genro-bag 0.11.0
    describe('resolver in constructor', () => {
        it('should accept resolver as fifth parameter', () => {
            const resolver = new BagCbResolver({ callback: () => 99 });
            const node = new BagNode(null, 'test', null, null, resolver);
            assert.strictEqual(node.resolver, resolver);
            assert.strictEqual(resolver.node, node);
        });

        it('should not set resolver when null', () => {
            const node = new BagNode(null, 'test', 42, null, null);
            assert.strictEqual(node.resolver, null);
        });
    });

    // Aligned with Python genro-bag 0.11.0
    describe('resetResolver', () => {
        it('should reset resolver and clear value', () => {
            let callCount = 0;
            const resolver = new BagCbResolver({
                callback: () => { callCount++; return 100; }
            });
            const node = new BagNode(null, 'test', null, null, resolver);

            node.getValue();
            assert.strictEqual(node.staticValue, 100);

            node.resetResolver();
            assert.strictEqual(node.staticValue, null);
            assert.strictEqual(node.resolver, resolver);
        });

        it('should work when no resolver attached', () => {
            const node = new BagNode(null, 'test', 42);
            node.resetResolver();
            assert.strictEqual(node.staticValue, null);
        });
    });
});
