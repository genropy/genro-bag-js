// Copyright 2025 Softwell S.r.l. - SPDX-License-Identifier: Apache-2.0

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { BagResolver, BagCbResolver } from '../src/resolver.js';
import { BagNode } from '../src/bag-node.js';

describe('BagResolver', () => {
    describe('constructor', () => {
        it('should use default classKwargs', () => {
            const resolver = new BagResolver();
            assert.strictEqual(resolver.cacheTime, 0);
            assert.strictEqual(resolver.readOnly, false);
        });

        it('should merge kwargs with defaults', () => {
            const resolver = new BagResolver({ cacheTime: 60 });
            assert.strictEqual(resolver.cacheTime, 60);
            assert.strictEqual(resolver.readOnly, false);
        });

        it('should store non-internal params in _kw', () => {
            const resolver = new BagResolver({ cacheTime: 60, customParam: 'value' });
            assert.strictEqual(resolver._kw.customParam, 'value');
            assert.strictEqual(resolver._kw.cacheTime, undefined);
        });
    });

    describe('setNode', () => {
        it('should set the node reference', () => {
            const resolver = new BagResolver();
            const node = new BagNode(null, 'test', null);
            resolver.setNode(node);
            assert.strictEqual(resolver.node, node);
        });

        it('should call onSetResolver hook', () => {
            let hookCalled = false;
            class CustomResolver extends BagResolver {
                onSetResolver(node) {
                    hookCalled = true;
                }
            }
            const resolver = new CustomResolver();
            const node = new BagNode(null, 'test', null);
            resolver.setNode(node);
            assert.strictEqual(hookCalled, true);
        });
    });

    describe('expired', () => {
        it('should be expired when cacheTime=0 (never cache)', () => {
            const resolver = new BagResolver({ cacheTime: 0 });
            assert.strictEqual(resolver.expired, true);
        });

        it('should be expired when cacheTime<0 and never resolved', () => {
            const resolver = new BagResolver({ cacheTime: -1 });
            assert.strictEqual(resolver.expired, true);
        });

        it('should not be expired after resolve when cacheTime<0', () => {
            const resolver = new BagResolver({ cacheTime: -1 });
            resolver._lastUpdate = Date.now();
            assert.strictEqual(resolver.expired, false);
        });

        it('should be expired when TTL exceeded', () => {
            const resolver = new BagResolver({ cacheTime: 1 });
            // Simulate resolve 2 seconds ago
            resolver._lastUpdate = Date.now() - 2000;
            assert.strictEqual(resolver.expired, true);
        });

        it('should not be expired within TTL', () => {
            const resolver = new BagResolver({ cacheTime: 60 });
            resolver._lastUpdate = Date.now();
            assert.strictEqual(resolver.expired, false);
        });
    });

    describe('reset', () => {
        it('should clear lastUpdate', () => {
            const resolver = new BagResolver({ cacheTime: -1 });
            resolver._lastUpdate = Date.now();
            assert.strictEqual(resolver.expired, false);

            resolver.reset();
            assert.strictEqual(resolver.expired, true);
        });
    });

    describe('resolve', () => {
        it('should call load and return value', () => {
            class TestResolver extends BagResolver {
                load(kwargs) {
                    return 42;
                }
            }
            const resolver = new TestResolver();
            const result = resolver.resolve();
            assert.strictEqual(result, 42);
        });

        it('should pass kwargs to load', () => {
            class TestResolver extends BagResolver {
                load(kwargs) {
                    return kwargs.a + kwargs.b;
                }
            }
            const resolver = new TestResolver({ a: 10, b: 20 });
            const result = resolver.resolve();
            assert.strictEqual(result, 30);
        });

        it('should merge call kwargs with resolver kwargs', () => {
            class TestResolver extends BagResolver {
                load(kwargs) {
                    return kwargs.a + kwargs.b;
                }
            }
            const resolver = new TestResolver({ a: 10 });
            const result = resolver.resolve({ b: 5 });
            assert.strictEqual(result, 15);
        });

        it('should return cached value in static mode', () => {
            class TestResolver extends BagResolver {
                load(kwargs) {
                    return 42;
                }
            }
            const resolver = new TestResolver();
            const node = new BagNode(null, 'test', 100);
            resolver.setNode(node);

            const result = resolver.resolve({ static: true });
            assert.strictEqual(result, 100); // staticValue, not load()
        });

        it('should store value in node unless readOnly', () => {
            class TestResolver extends BagResolver {
                load(kwargs) {
                    return 42;
                }
            }
            const resolver = new TestResolver();
            const node = new BagNode(null, 'test', null);
            resolver.setNode(node);

            resolver.resolve();
            assert.strictEqual(node.staticValue, 42);
        });

        it('should not store value in node when readOnly', () => {
            class TestResolver extends BagResolver {
                load(kwargs) {
                    return 42;
                }
            }
            const resolver = new TestResolver({ readOnly: true });
            const node = new BagNode(null, 'test', null);
            resolver.setNode(node);

            const result = resolver.resolve();
            assert.strictEqual(result, 42);
            assert.strictEqual(node.staticValue, null);
        });

        it('should return cached value when not expired', () => {
            let loadCount = 0;
            class TestResolver extends BagResolver {
                load(kwargs) {
                    loadCount++;
                    return loadCount;
                }
            }
            const resolver = new TestResolver({ cacheTime: -1 }); // cache forever
            const node = new BagNode(null, 'test', null);
            resolver.setNode(node);

            const result1 = resolver.resolve();
            const result2 = resolver.resolve();

            assert.strictEqual(result1, 1);
            assert.strictEqual(result2, 1); // Cached, load not called again
            assert.strictEqual(loadCount, 1);
        });
    });

    describe('async resolve', () => {
        it('should handle async load', async () => {
            class AsyncResolver extends BagResolver {
                async load(kwargs) {
                    return Promise.resolve(42);
                }
            }
            const resolver = new AsyncResolver();
            const result = await resolver.resolve();
            assert.strictEqual(result, 42);
        });

        it('should store async result in node', async () => {
            class AsyncResolver extends BagResolver {
                async load(kwargs) {
                    return Promise.resolve(42);
                }
            }
            const resolver = new AsyncResolver();
            const node = new BagNode(null, 'test', null);
            resolver.setNode(node);

            await resolver.resolve();
            assert.strictEqual(node.staticValue, 42);
        });
    });
});

describe('BagCbResolver', () => {
    describe('constructor', () => {
        it('should accept callback in kwargs', () => {
            const cb = () => 42;
            const resolver = new BagCbResolver({ callback: cb });
            assert.strictEqual(resolver._callback, cb);
        });

        it('should accept callback as function directly', () => {
            const cb = () => 42;
            const resolver = new BagCbResolver(cb);
            assert.strictEqual(resolver._callback, cb);
        });
    });

    describe('sync callback', () => {
        it('should call callback and return result', () => {
            const resolver = new BagCbResolver({
                callback: (kw) => kw.x * 2,
                x: 21
            });
            const result = resolver.resolve();
            assert.strictEqual(result, 42);
        });

        it('should pass merged kwargs to callback', () => {
            const resolver = new BagCbResolver({
                callback: (kw) => kw.a + kw.b,
                a: 10
            });
            const result = resolver.resolve({ b: 5 });
            assert.strictEqual(result, 15);
        });

        it('should have access to resolver via this', () => {
            const resolver = new BagCbResolver({
                callback: function(kw) {
                    return this.cacheTime;
                },
                cacheTime: 60
            });
            const result = resolver.resolve();
            assert.strictEqual(result, 60);
        });
    });

    describe('async callback', () => {
        it('should handle async callback', async () => {
            const resolver = new BagCbResolver({
                callback: async (kw) => {
                    return Promise.resolve(kw.value);
                },
                value: 42
            });
            const result = await resolver.resolve();
            assert.strictEqual(result, 42);
        });

        it('should handle callback returning Promise', async () => {
            const resolver = new BagCbResolver({
                callback: (kw) => Promise.resolve(kw.value),
                value: 42
            });
            const result = await resolver.resolve();
            assert.strictEqual(result, 42);
        });
    });

    describe('with node', () => {
        it('should store result in node', () => {
            const resolver = new BagCbResolver({
                callback: () => 42
            });
            const node = new BagNode(null, 'test', null);
            resolver.setNode(node);

            resolver.resolve();
            assert.strictEqual(node.staticValue, 42);
        });

        it('should use node attributes as kwargs', () => {
            const resolver = new BagCbResolver({
                callback: (kw) => kw.multiplier * 10
            });
            const node = new BagNode(null, 'test', null, { multiplier: 5 });
            resolver.setNode(node);

            const result = resolver.resolve();
            assert.strictEqual(result, 50);
        });
    });

    describe('caching', () => {
        it('should cache with cacheTime < 0', () => {
            let callCount = 0;
            const resolver = new BagCbResolver({
                callback: () => ++callCount,
                cacheTime: -1
            });
            const node = new BagNode(null, 'test', null);
            resolver.setNode(node);

            resolver.resolve();
            resolver.resolve();
            resolver.resolve();

            assert.strictEqual(callCount, 1);
        });

        it('should not cache with cacheTime = 0', () => {
            let callCount = 0;
            const resolver = new BagCbResolver({
                callback: () => ++callCount,
                cacheTime: 0
            });

            resolver.resolve();
            resolver.resolve();
            resolver.resolve();

            assert.strictEqual(callCount, 3);
        });
    });
});
