// Copyright 2025 Softwell S.r.l. - SPDX-License-Identifier: Apache-2.0

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { StorageResolver } from '../src/resolvers/StorageResolver.js';
import { BagNode } from '../src/bag-node.js';

// Simulate browser localStorage/sessionStorage for Node.js tests
class MockStorage {
    constructor() { this._data = {}; }
    getItem(key) { return key in this._data ? this._data[key] : null; }
    setItem(key, value) { this._data[key] = String(value); }
    removeItem(key) { delete this._data[key]; }
    clear() { this._data = {}; }
}

describe('StorageResolver', () => {
    let originalLocalStorage;
    let originalSessionStorage;

    beforeEach(() => {
        originalLocalStorage = globalThis.localStorage;
        originalSessionStorage = globalThis.sessionStorage;
        globalThis.localStorage = new MockStorage();
        globalThis.sessionStorage = new MockStorage();
    });

    afterEach(() => {
        if (originalLocalStorage === undefined) {
            delete globalThis.localStorage;
        } else {
            globalThis.localStorage = originalLocalStorage;
        }
        if (originalSessionStorage === undefined) {
            delete globalThis.sessionStorage;
        } else {
            globalThis.sessionStorage = originalSessionStorage;
        }
    });

    describe('localStorage (default)', () => {
        it('should read from localStorage', () => {
            globalThis.localStorage.setItem('theme', 'dark');
            const resolver = new StorageResolver({ key: 'theme' });
            assert.strictEqual(resolver.resolve(), 'dark');
        });

        it('should return defaultValue when key not found', () => {
            const resolver = new StorageResolver({ key: 'missing', defaultValue: 'fallback' });
            assert.strictEqual(resolver.resolve(), 'fallback');
        });

        it('should accept key as positional string', () => {
            globalThis.localStorage.setItem('color', 'red');
            const resolver = new StorageResolver('color');
            assert.strictEqual(resolver.resolve(), 'red');
        });

        it('should cache forever when readOnly=false', () => {
            globalThis.localStorage.setItem('x', '1');
            const resolver = new StorageResolver({ key: 'x', readOnly: false });
            const node = new BagNode(null, 'test', null);
            resolver.setNode(node);

            resolver.resolve();
            globalThis.localStorage.setItem('x', '2');
            // Cached — still returns '1'
            assert.strictEqual(resolver.resolve(), '1');
        });

        it('should be readOnly by default (no caching)', () => {
            globalThis.localStorage.setItem('x', '1');
            const resolver = new StorageResolver({ key: 'x' });
            assert.strictEqual(resolver.readOnly, true);
        });
    });

    describe('sessionStorage', () => {
        it('should read from sessionStorage', () => {
            globalThis.sessionStorage.setItem('token', 'abc123');
            const resolver = new StorageResolver({
                key: 'token',
                storageType: 'session'
            });
            assert.strictEqual(resolver.resolve(), 'abc123');
        });

        it('should return defaultValue when key not in session', () => {
            const resolver = new StorageResolver({
                key: 'missing',
                storageType: 'session',
                defaultValue: null
            });
            assert.strictEqual(resolver.resolve(), null);
        });
    });

    describe('no storage available', () => {
        it('should return defaultValue when storage is unavailable', () => {
            delete globalThis.localStorage;
            const resolver = new StorageResolver({ key: 'x', defaultValue: 'none' });
            assert.strictEqual(resolver.resolve(), 'none');
        });
    });

    describe('no key', () => {
        it('should return defaultValue when no key provided', () => {
            const resolver = new StorageResolver({ defaultValue: 'empty' });
            assert.strictEqual(resolver.resolve(), 'empty');
        });
    });
});
