// Copyright 2026 Softwell S.r.l. - SPDX-License-Identifier: Apache-2.0

import { BagResolver } from './resolver.js';

/**
 * Python-compatible resolver descriptions for TYTX, JSON and XML.
 * Registration is explicit: adapters translate parameters between runtimes.
 * Decoders must construct inert BagResolvers, never perform resolution or I/O.
 * Unknown descriptions and signed tokens remain opaque and travel unchanged.
 * A browser does not authenticate signed tokens; verification belongs to the
 * server. Signed tokens are never used to instantiate a client-side resolver.
 */
const MARKER = '::RSLV:';
const registrations = new Map();
const classes = new Map();
const opaquePayloads = new WeakMap();

export class BagSerializationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'BagSerializationError';
    }
}

/** A server resolver description that can travel, but cannot execute locally. */
export class OpaqueResolver extends BagResolver {
    constructor(payload) {
        super({ asBag: false });
        opaquePayloads.set(this, payload);
    }

    get payload() {
        return opaquePayloads.get(this);
    }

    load() {
        throw new BagSerializationError('This resolver is opaque; local execution is unavailable');
    }
}

/**
 * Register a JS counterpart for a Python module/class pair.
 * encode(resolver) returns {args: [], kwargs: {}}; decode({args, kwargs})
 * returns an inert instance of cls. Names are wire identifiers, not imports.
 */
export function registerResolver(cls, { module, name, encode, decode }) {
    if (!(cls.prototype instanceof BagResolver) || cls === OpaqueResolver
        || typeof module !== 'string' || !module || typeof name !== 'string' || !name
        || typeof encode !== 'function' || typeof decode !== 'function') {
        throw new TypeError('registerResolver requires a BagResolver subclass, module, name and adapters');
    }
    const key = JSON.stringify([module, name]);
    if (registrations.has(key) && registrations.get(key).cls !== cls) {
        throw new TypeError(`Resolver ${module}.${name} is already registered`);
    }
    if (classes.has(cls) && classes.get(cls).key !== key) {
        throw new TypeError('A resolver class cannot own two wire identities');
    }
    const entry = { cls, module, name, encode, decode, key };
    registrations.set(key, entry);
    classes.set(cls, entry);
}

function validateDescription(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)
        || typeof data.resolver_module !== 'string' || typeof data.resolver_class !== 'string'
        || !Array.isArray(data.args ?? []) || !data.kwargs
        || typeof data.kwargs !== 'object' || Array.isArray(data.kwargs)) {
        throw new BagSerializationError('Invalid resolver description');
    }
}

function validateJson(value, parents = new Set()) {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
    if (typeof value === 'number' && Number.isFinite(value)) return;
    if (typeof value !== 'object' || parents.has(value)
        || (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype
            && Object.getPrototypeOf(value) !== null)) {
        throw new BagSerializationError('Resolver parameters must be JSON data; callbacks cannot travel');
    }
    parents.add(value);
    for (const child of Object.values(value)) validateJson(child, parents);
    parents.delete(value);
}

export function encodeResolver(resolver) {
    if (opaquePayloads.has(resolver)) return opaquePayloads.get(resolver);
    const entry = classes.get(resolver.constructor);
    if (!entry) throw new BagSerializationError(`Unregistered resolver: ${resolver.constructor.name}`);
    const parameters = entry.encode(resolver);
    const data = {
        resolver_module: entry.module, resolver_class: entry.name,
        args: parameters.args ?? [], kwargs: parameters.kwargs ?? {},
    };
    validateDescription(data);
    validateJson(data);
    return MARKER + JSON.stringify(data);
}

export function decodeResolver(value) {
    if (typeof value !== 'string' || !value.startsWith(MARKER)) return null;
    const payload = value.slice(MARKER.length);
    // Preserve the exact signed token. Never trust its contents in the browser.
    if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+$/.test(payload)) {
        return new OpaqueResolver(value);
    }
    let data;
    try { data = JSON.parse(payload); }
    catch { throw new BagSerializationError('Invalid resolver JSON or signed token'); }
    validateDescription(data);
    const entry = registrations.get(JSON.stringify([data.resolver_module, data.resolver_class]));
    if (!entry) return new OpaqueResolver(value);
    const resolver = entry.decode({ args: data.args ?? [], kwargs: data.kwargs });
    if (!(resolver instanceof entry.cls)) {
        throw new BagSerializationError('Resolver decoder returned an incompatible instance');
    }
    return resolver;
}

export function encodeAttrs(attr) {
    return Object.fromEntries(Object.entries(attr || {}).map(([key, value]) =>
        [key, value instanceof BagResolver ? encodeResolver(value) : value]));
}

export function decodeAttrs(attr) {
    return Object.fromEntries(Object.entries(attr || {}).map(([key, value]) =>
        [key, decodeResolver(value) ?? value]));
}
