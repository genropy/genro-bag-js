// Copyright 2025 Softwell S.r.l. - SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BagNode } from '../src/BagNode.js';

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
});
