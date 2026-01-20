// Copyright 2025 Softwell S.r.l. - SPDX-License-Identifier: Apache-2.0

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Bag } from '../src/index.js';

describe('XML Serialization', () => {
    describe('toXml', () => {
        it('should serialize simple values', () => {
            const bag = new Bag();
            bag.setItem('name', 'test');
            bag.setItem('count', 42);

            const xml = bag.toXml();
            assert.ok(xml.includes('<name>test</name>'));
            assert.ok(xml.includes('<count>42</count>'));
        });

        it('should serialize nested Bags', () => {
            const bag = new Bag();
            bag.setItem('config.db.host', 'localhost');
            bag.setItem('config.db.port', 5432);

            const xml = bag.toXml();
            assert.ok(xml.includes('<config>'));
            assert.ok(xml.includes('<db>'));
            assert.ok(xml.includes('<host>localhost</host>'));
            assert.ok(xml.includes('<port>5432</port>'));
        });

        it('should serialize attributes', () => {
            const bag = new Bag();
            bag.setItem('item', 'value', { id: '123', type: 'string' });

            const xml = bag.toXml();
            assert.ok(xml.includes('id="123"'));
            assert.ok(xml.includes('type="string"'));
        });

        it('should escape special characters', () => {
            const bag = new Bag();
            bag.setItem('text', '<hello> & "world"');

            const xml = bag.toXml();
            assert.ok(xml.includes('&lt;hello&gt;'));
            assert.ok(xml.includes('&amp;'));
        });

        it('should self-close empty elements by default', () => {
            const bag = new Bag();
            bag.setItem('empty', '');

            const xml = bag.toXml();
            assert.ok(xml.includes('<empty/>'));
        });

        it('should add XML declaration when docHeader is true', () => {
            const bag = new Bag();
            bag.setItem('test', 'value');

            const xml = bag.toXml({ docHeader: true });
            assert.ok(xml.startsWith("<?xml version='1.0' encoding='UTF-8'?>"));
        });

        it('should pretty print when requested', () => {
            const bag = new Bag();
            bag.setItem('config.name', 'test');

            const xml = bag.toXml({ pretty: true });
            assert.ok(xml.includes('\n'));
        });
    });

    describe('fromXml', () => {
        it('should deserialize simple values', () => {
            const xml = '<root><name>test</name><count>42</count></root>';
            const bag = Bag.fromXml(xml);

            assert.equal(bag.getItem('name'), 'test');
            assert.equal(bag.getItem('count'), '42'); // XML values are strings
        });

        it('should deserialize nested structures', () => {
            const xml = '<root><config><db><host>localhost</host><port>5432</port></db></config></root>';
            const bag = Bag.fromXml(xml);

            assert.equal(bag.getItem('config.db.host'), 'localhost');
            assert.equal(bag.getItem('config.db.port'), '5432');
        });

        it('should deserialize attributes', () => {
            const xml = '<root><item id="123" type="string">value</item></root>';
            const bag = Bag.fromXml(xml);

            const node = bag.getNode('item');
            assert.equal(node.value, 'value');
            assert.equal(node.getAttr('id'), '123');
            assert.equal(node.getAttr('type'), 'string');
        });

        it('should handle empty elements', () => {
            const xml = '<root><empty></empty></root>';
            const bag = Bag.fromXml(xml);

            assert.equal(bag.getItem('empty'), '');
        });

        it('should roundtrip XML', () => {
            const original = new Bag();
            original.setItem('config.name', 'test');
            original.setItem('config.version', '1.0');
            original.setItem('users.admin', 'admin@example.com');

            const xml = original.toXml();
            const restored = Bag.fromXml(`<root>${xml}</root>`);

            assert.equal(restored.getItem('config.name'), 'test');
            assert.equal(restored.getItem('config.version'), '1.0');
            assert.equal(restored.getItem('users.admin'), 'admin@example.com');
        });
    });
});

describe('JSON Serialization', () => {
    describe('toJson', () => {
        it('should serialize simple values', () => {
            const bag = new Bag();
            bag.setItem('name', 'test');
            bag.setItem('count', 42);

            const json = bag.toJson();
            const parsed = JSON.parse(json);

            assert.equal(parsed.length, 2);
            assert.equal(parsed[0].label, 'name');
            assert.equal(parsed[0].value, 'test');
            assert.equal(parsed[1].label, 'count');
            assert.equal(parsed[1].value, 42);
        });

        it('should serialize nested Bags as arrays', () => {
            const bag = new Bag();
            bag.setItem('config.db.host', 'localhost');

            const json = bag.toJson();
            const parsed = JSON.parse(json);

            assert.equal(parsed[0].label, 'config');
            assert.ok(Array.isArray(parsed[0].value));
            assert.equal(parsed[0].value[0].label, 'db');
        });

        it('should serialize attributes', () => {
            const bag = new Bag();
            bag.setItem('item', 'value', { id: '123' });

            const json = bag.toJson();
            const parsed = JSON.parse(json);

            assert.equal(parsed[0].attr.id, '123');
        });

        it('should handle empty Bags', () => {
            const bag = new Bag();
            const json = bag.toJson();
            const parsed = JSON.parse(json);

            assert.deepEqual(parsed, []);
        });
    });

    describe('fromJson', () => {
        it('should deserialize from JSON string', () => {
            const json = '[{"label":"name","value":"test","attr":{}},{"label":"count","value":42,"attr":{}}]';
            const bag = Bag.fromJson(json);

            assert.equal(bag.getItem('name'), 'test');
            assert.equal(bag.getItem('count'), 42);
        });

        it('should deserialize nested structures', () => {
            const json = '[{"label":"config","value":[{"label":"host","value":"localhost","attr":{}}],"attr":{}}]';
            const bag = Bag.fromJson(json);

            assert.equal(bag.getItem('config.host'), 'localhost');
        });

        it('should deserialize attributes', () => {
            const json = '[{"label":"item","value":"test","attr":{"id":"123"}}]';
            const bag = Bag.fromJson(json);

            const node = bag.getNode('item');
            assert.equal(node.getAttr('id'), '123');
        });

        it('should handle plain objects', () => {
            const obj = { name: 'test', count: 42 };
            const bag = Bag.fromJson(obj);

            assert.equal(bag.getItem('name'), 'test');
            assert.equal(bag.getItem('count'), 42);
        });

        it('should handle plain arrays', () => {
            const arr = ['a', 'b', 'c'];
            const bag = Bag.fromJson(arr);

            assert.equal(bag.getItem('r_0'), 'a');
            assert.equal(bag.getItem('r_1'), 'b');
            assert.equal(bag.getItem('r_2'), 'c');
        });
    });

    describe('roundtrip', () => {
        it('should roundtrip simple Bag', () => {
            const original = new Bag();
            original.setItem('name', 'test');
            original.setItem('count', 42);
            original.setItem('active', true);

            const json = original.toJson();
            const restored = Bag.fromJson(json);

            assert.equal(restored.getItem('name'), 'test');
            assert.equal(restored.getItem('count'), 42);
            assert.equal(restored.getItem('active'), true);
        });

        it('should roundtrip nested Bag', () => {
            const original = new Bag();
            original.setItem('config.db.host', 'localhost');
            original.setItem('config.db.port', 5432);
            original.setItem('config.app.name', 'myapp');

            const json = original.toJson();
            const restored = Bag.fromJson(json);

            assert.equal(restored.getItem('config.db.host'), 'localhost');
            assert.equal(restored.getItem('config.db.port'), 5432);
            assert.equal(restored.getItem('config.app.name'), 'myapp');
        });

        it('should roundtrip with attributes', () => {
            const original = new Bag();
            original.setItem('item', 'value', { id: '123', type: 'test' });

            const json = original.toJson();
            const restored = Bag.fromJson(json);

            const node = restored.getNode('item');
            assert.equal(node.getAttr('id'), '123');
            assert.equal(node.getAttr('type'), 'test');
        });
    });
});
