// Copyright 2025 Softwell S.r.l. - SPDX-License-Identifier: Apache-2.0

import { BagNode } from './bag-node.js';

/**
 * BagNodeContainer - Ordered container for BagNodes with positional insert.
 *
 * Combines dict-like access with list-like ordering. Elements can be
 * accessed by label, numeric index, or '#n' string index.
 */
export class BagNodeContainer {
    constructor() {
        this._dict = {};     // maps label -> BagNode
        this._list = [];     // BagNodes in order
        this._parentBag = null;
    }

    /**
     * Return the index of a label in this container.
     *
     * @param {string} label - The label or special syntax to look up.
     *   - 'label': exact label match
     *   - '#n': numeric index (e.g., '#0', '#1')
     *   - '#attr=value': find by attribute value (e.g., '#id=34')
     *   - '#=value': find by node value (e.g., '#=target')
     * @returns {number} Index position (0-based), or -1 if not found.
     */
    index(label) {
        if (label in this._dict) {
            return this._list.findIndex(node => node.label === label);
        }
        // Handle #n syntax
        let match = label.match(/^#(\d+)$/);
        if (match) {
            const idx = parseInt(match[1], 10);
            return idx < this._list.length ? idx : -1;
        }
        // Handle #attr=value or #=value syntax
        match = label.match(/^#(\w*)=(.*)$/);
        if (match) {
            const [, attr, value] = match;
            if (attr) {
                // #attr=value - find by attribute
                return this._list.findIndex(node => node.getAttr(attr) === value);
            } else {
                // #=value - find by node value
                return this._list.findIndex(node => node._value === value);
            }
        }
        return -1;
    }

    /**
     * Parse position syntax and return insertion index.
     *
     * @param {string|number|null} position - Position specification.
     * @returns {number} Index where to insert.
     */
    _parsePosition(position) {
        if (position === null || position === undefined || position === '>') {
            return this._list.length;
        }

        if (typeof position === 'number') {
            return Math.max(0, Math.min(position, this._list.length));
        }

        if (position === '<') {
            return 0;
        }

        if (position.startsWith('#')) {
            try {
                return Math.max(0, Math.min(parseInt(position.slice(1), 10), this._list.length));
            } catch {
                return this._list.length;
            }
        }

        if (position.startsWith('<')) {
            const ref = position.slice(1);
            if (ref.startsWith('#')) {
                try {
                    return Math.max(0, Math.min(parseInt(ref.slice(1), 10), this._list.length));
                } catch {
                    return this._list.length;
                }
            }
            const idx = this.index(ref);
            return idx >= 0 ? idx : this._list.length;
        }

        if (position.startsWith('>')) {
            const ref = position.slice(1);
            if (ref.startsWith('#')) {
                try {
                    return Math.max(0, Math.min(parseInt(ref.slice(1), 10) + 1, this._list.length));
                } catch {
                    return this._list.length;
                }
            }
            const idx = this.index(ref);
            return idx >= 0 ? idx + 1 : this._list.length;
        }

        return this._list.length;
    }

    /**
     * Get item by label or index.
     *
     * @param {string|number} key - Label string or integer index.
     * @returns {BagNode|null} The BagNode if found, null otherwise.
     */
    get(key) {
        if (typeof key === 'number') {
            return (key >= 0 && key < this._list.length) ? this._list[key] : null;
        }
        if (key.startsWith('#')) {
            try {
                const idx = parseInt(key.slice(1), 10);
                return (idx >= 0 && idx < this._list.length) ? this._list[idx] : null;
            } catch {
                return null;
            }
        }
        return this._dict[key] || null;
    }

    /**
     * Set or create a BagNode with optional position.
     *
     * Supports ?attr syntax to set attributes instead of value:
     *   - 'label?myattr' → sets attribute 'myattr' to value
     *   - 'label?x&y&z' → sets attributes from tuple (value must be array with matching length)
     *
     * @param {string} label - The node label. Can contain ?attr suffix.
     * @param {*} value - The value to set. With ?attr syntax, becomes the attribute value.
     * @param {string|number|null} [nodePosition='>'] - Position specification.
     * @param {Object} [attr=null] - Optional attributes.
     * @param {Object} [parentBag=null] - Parent Bag reference.
     * @returns {BagNode} The created or updated BagNode.
     */
    set(label, value, nodePosition = '>', attr = null, parentBag = null) {
        // Parse query string from label (like Python)
        let queryString = null;
        if (label.includes('?')) {
            [label, queryString] = label.split('?', 2);
        }

        // Validate label
        if (label === null || label === undefined || label.startsWith('#')) {
            throw new Error('Cannot create new node with #n syntax');
        }

        // Handle query string: convert value to attributes
        if (queryString) {
            const qs = queryString.split('&');
            if (qs.length === 1) {
                attr = { [qs[0]]: value };
            } else {
                if (!Array.isArray(value) || value.length !== qs.length) {
                    throw new Error('Wrong attributes assignment');
                }
                attr = {};
                for (let i = 0; i < qs.length; i++) {
                    attr[qs[i]] = value[i];
                }
            }
            value = null;
        }

        let node = this._dict[label];

        if (node) {
            // Existing node
            if (queryString) {
                // Only set_attr, don't touch value
                node.setAttr(attr);
            } else {
                // Update value
                node.setValue(value);
                if (attr) {
                    node.setAttr(attr);
                }
            }
        } else {
            // New node
            node = new BagNode(parentBag, label, queryString ? null : value, attr);
            const idx = this._parsePosition(nodePosition);
            this._dict[label] = node;
            this._list.splice(idx, 0, node);

            // Trigger insert event if backref enabled
            if (parentBag && parentBag.backref) {
                parentBag._onNodeInserted(node, idx);
            }
        }

        return node;
    }

    /**
     * Remove and return item.
     *
     * @param {string|number} key - Label, index, or '#n'.
     * @returns {BagNode|null} The removed BagNode, or null if not found.
     */
    pop(key) {
        const node = this.get(key);
        if (node) {
            delete this._dict[node.label];
            const idx = this._list.indexOf(node);
            if (idx >= 0) {
                this._list.splice(idx, 1);
            }
            return node;
        }
        return null;
    }

    /**
     * Check if label exists.
     *
     * @param {string} key - Label to check.
     * @returns {boolean} True if label exists.
     */
    has(key) {
        return key in this._dict;
    }

    /**
     * Return number of elements.
     *
     * @returns {number} Number of elements.
     */
    get length() {
        return this._list.length;
    }

    /**
     * Clear all elements.
     */
    clear() {
        this._dict = {};
        this._list = [];
    }

    /**
     * Return node labels in order.
     *
     * @returns {string[]} Array of labels.
     */
    keys() {
        return this._list.map(node => node.label);
    }

    /**
     * Return node values in order.
     *
     * @returns {Array} Array of values.
     */
    values() {
        return this._list.map(node => node.getValue());
    }

    /**
     * Return [label, value] tuples in order.
     *
     * @returns {Array} Array of [label, value] tuples.
     */
    items() {
        return this._list.map(node => [node.label, node.getValue()]);
    }

    /**
     * Make container iterable.
     */
    [Symbol.iterator]() {
        return this._list[Symbol.iterator]();
    }

    /**
     * Move element(s) to a new position.
     *
     * @param {number|number[]} what - Index or list of indices to move.
     * @param {number} position - Target index position.
     * @param {boolean} [trigger=true] - If true, fire del/ins events.
     */
    move(what, position, trigger = true) {
        if (position < 0) {
            return;
        }

        // Normalize to array
        const indices = Array.isArray(what) ? what : [what];
        if (indices.length === 0) {
            return;
        }

        // Get destination label BEFORE any removal
        if (position >= this._list.length) {
            return;
        }
        const destLabel = this._list[position].label;

        if (indices.length > 1) {
            // Multi-node move
            const sortedIndices = [...indices].sort((a, b) => a - b);
            const delta = sortedIndices[0] < position ? 1 : 0;

            // Pop nodes in reverse order (highest index first)
            const popped = [];
            for (let i = sortedIndices.length - 1; i >= 0; i--) {
                const idx = sortedIndices[i];
                if (idx >= 0 && idx < this._list.length) {
                    const node = this._list[idx];
                    this._list.splice(idx, 1);
                    popped.push(node);
                    if (trigger && this._parentBag && this._parentBag.backref) {
                        this._parentBag._onNodeDeleted(node, idx);
                    }
                }
            }

            // Find new position based on destLabel + delta
            let newPos = this.index(destLabel);
            if (newPos < 0) {
                newPos = this._list.length;
            }
            newPos += delta;

            // Insert all popped nodes at new position
            for (const node of popped) {
                this._list.splice(newPos, 0, node);
                if (trigger && this._parentBag && this._parentBag.backref) {
                    this._parentBag._onNodeInserted(node, newPos);
                }
            }
        } else {
            // Single node move
            const fromIdx = indices[0];
            if (fromIdx === position) {
                return;
            }
            if (fromIdx < 0 || fromIdx >= this._list.length) {
                return;
            }

            const node = this._list[fromIdx];
            this._list.splice(fromIdx, 1);

            if (trigger && this._parentBag && this._parentBag.backref) {
                this._parentBag._onNodeDeleted(node, fromIdx);
            }

            this._list.splice(position, 0, node);

            if (trigger && this._parentBag && this._parentBag.backref) {
                this._parentBag._onNodeInserted(node, position);
            }
        }
    }

    /**
     * Check equality with another BagNodeContainer.
     *
     * @param {BagNodeContainer} other - Container to compare with.
     * @returns {boolean} True if equal (same nodes in same order).
     */
    isEqual(other) {
        if (!(other instanceof BagNodeContainer)) {
            return false;
        }
        if (this._list.length !== other._list.length) {
            return false;
        }
        for (let i = 0; i < this._list.length; i++) {
            const thisNode = this._list[i];
            const otherNode = other._list[i];
            if (!thisNode.isEqual(otherNode)) {
                return false;
            }
        }
        return true;
    }
}
