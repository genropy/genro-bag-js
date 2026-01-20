// Copyright 2025 Softwell S.r.l. - SPDX-License-Identifier: Apache-2.0

import { BagNodeContainer } from './bag-node-container.js';
import { toTytx as tytxEncode, fromTytx as tytxDecode } from 'genro-tytx';

/**
 * Bag - Hierarchical data container with path-based access.
 *
 * A Bag is an ordered container of BagNodes, accessible by label, numeric index,
 * or hierarchical path. Nested elements can be accessed with dot-separated paths
 * like 'a.b.c'.
 */
export class Bag {
    constructor() {
        this._nodes = new BagNodeContainer();
        this._backref = false;
        this._parent = null;
        this._parentNode = null;
        // Subscriber dictionaries for events
        this._updSubscribers = {};
        this._insSubscribers = {};
        this._delSubscribers = {};
    }

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    get parent() {
        return this._parent;
    }

    set parent(value) {
        this._parent = value;
    }

    get parentNode() {
        return this._parentNode;
    }

    set parentNode(value) {
        this._parentNode = value;
    }

    get backref() {
        return Boolean(this._backref);
    }

    /**
     * Full path from root Bag to this Bag.
     *
     * Returns the dot-separated path from the root of the hierarchy to this
     * Bag. Returns null if backref mode is not enabled or if this is the root.
     *
     * @returns {string|null} The full path or null.
     */
    get fullpath() {
        if (this._parent !== null && this._parentNode !== null) {
            const parentFullpath = this._parent.fullpath;
            if (parentFullpath) {
                return `${parentFullpath}.${this._parentNode.label}`;
            } else {
                return this._parentNode.label;
            }
        }
        return null;
    }

    get length() {
        return this._nodes.length;
    }

    // -------------------------------------------------------------------------
    // _htraverse helpers
    // -------------------------------------------------------------------------

    /**
     * Parse path and handle #parent navigation.
     *
     * @param {string|Array} path - Dot-separated path or array of segments.
     * @returns {Array} Tuple of [curr, pathlist].
     */
    _htraverseBefore(path) {
        let curr = this;

        let pathlist;
        if (typeof path === 'string') {
            path = path.replace(/\.\.\//g, '#parent.');
            pathlist = path.split('.').filter(x => x);
        } else {
            pathlist = [...path];
        }

        // Handle parent reference #parent at the beginning
        while (pathlist.length && pathlist[0] === '#parent' && curr !== null) {
            pathlist.shift();
            curr = curr.parent;
        }

        return [curr, pathlist];
    }

    // -------------------------------------------------------------------------
    // _htraverse
    // -------------------------------------------------------------------------

    /**
     * Traverse a hierarchical path.
     *
     * @param {string|Array} path - Path as dot-separated string or array.
     * @param {boolean} [writeMode=false] - If true, create intermediate Bags.
     * @param {boolean} [isStatic=true] - If true, don't trigger resolvers.
     * @returns {Array} Tuple of [container, label].
     */
    _htraverse(path, writeMode = false, isStatic = true) {
        let [curr, pathlist] = this._htraverseBefore(path);

        if (curr === null) {
            return [null, null];
        }
        if (pathlist.length === 0) {
            return [curr, ''];
        }

        // Traverse path segments
        while (pathlist.length > 1 && curr instanceof Bag) {
            const segment = pathlist[0];
            const node = curr._nodes.get(segment);

            if (!node) {
                break;
            }

            const value = node.getValue(isStatic);

            if (value instanceof Bag) {
                pathlist.shift();
                curr = value;
            } else if (writeMode) {
                // Create intermediate Bag
                const newBag = new Bag();
                node.setValue(newBag);
                pathlist.shift();
                curr = newBag;
            } else {
                break;
            }
        }

        // Finalize
        if (!writeMode) {
            if (pathlist.length > 1) {
                return [null, null];
            }
            return [curr, pathlist[0]];
        }

        // Write mode: create intermediate nodes
        while (pathlist.length > 1) {
            const label = pathlist.shift();
            if (label.startsWith('#')) {
                throw new BagException('Not existing index in #n syntax');
            }
            const newBag = new Bag();
            curr._nodes.set(label, newBag, '>', null, curr);
            curr = newBag;
        }

        return [curr, pathlist[0]];
    }

    // -------------------------------------------------------------------------
    // get (single level)
    // -------------------------------------------------------------------------

    /**
     * Get value at a single level (no path traversal).
     *
     * @param {string} label - Node label to look up.
     * @param {*} [defaultValue=null] - Value to return if label not found.
     * @param {boolean} [isStatic=true] - If true, don't trigger resolvers.
     * @returns {*} The node's value if found, otherwise default.
     */
    get(label, defaultValue = null, isStatic = true) {
        if (!label) {
            return this;
        }
        if (label === '#parent') {
            return this.parent;
        }
        const node = this._nodes.get(label);
        if (!node) {
            return defaultValue;
        }
        return node.getValue(isStatic);
    }

    // -------------------------------------------------------------------------
    // getItem
    // -------------------------------------------------------------------------

    /**
     * Get value at a hierarchical path.
     *
     * @param {string} path - Hierarchical path like 'a.b.c'.
     * @param {*} [defaultValue=null] - Value to return if path not found.
     * @param {boolean} [isStatic=false] - If true, don't trigger resolvers.
     * @returns {*} The value at the path if found, otherwise default.
     */
    getItem(path, defaultValue = null, isStatic = false) {
        if (!path) {
            return this;
        }

        const [obj, label] = this._htraverse(path, false, isStatic);

        if (obj instanceof Bag) {
            return obj.get(label, defaultValue, isStatic);
        }
        return defaultValue;
    }

    // -------------------------------------------------------------------------
    // setItem
    // -------------------------------------------------------------------------

    /**
     * Set value at a hierarchical path.
     *
     * @param {string} path - Hierarchical path like 'a.b.c'.
     * @param {*} value - Value to set at the path.
     * @param {Object} [attr=null] - Optional attributes to set on the node.
     * @param {string|number|null} [nodePosition='>'] - Position for new nodes.
     * @returns {BagNode} The created or updated BagNode.
     */
    setItem(path, value, attr = null, nodePosition = '>') {
        const [obj, label] = this._htraverse(path, true);

        return obj._nodes.set(label, value, nodePosition, attr, obj);
    }

    // -------------------------------------------------------------------------
    // _pop (internal)
    // -------------------------------------------------------------------------

    /**
     * Internal pop by label at current level.
     *
     * @param {string} label - Node label to remove.
     * @param {string|null} [reason=null] - Reason for deletion (for events).
     * @returns {BagNode|null} The removed BagNode, or null if not found.
     */
    _pop(label, reason = null) {
        const p = this._nodes.index(label);
        if (p >= 0) {
            const node = this._nodes.pop(p);
            if (this.backref) {
                this._onNodeDeleted(node, p, reason);
            }
            return node;
        }
        return null;
    }

    // -------------------------------------------------------------------------
    // pop
    // -------------------------------------------------------------------------

    /**
     * Remove a node and return its value.
     *
     * Traverses to the path, removes the node, and returns its value.
     *
     * @param {string} path - Hierarchical path to the node to remove.
     * @param {*} [defaultValue=null] - Value to return if path not found.
     * @param {string|null} [reason=null] - Reason for deletion (for events).
     * @returns {*} The value of the removed node, or default if not found.
     */
    pop(path, defaultValue = null, reason = null) {
        let result = defaultValue;
        const [obj, label] = this._htraverse(path, false, true);
        if (obj) {
            const n = obj._pop(label, reason);
            if (n) {
                result = n.value;
            }
        }
        return result;
    }

    /**
     * Alias for pop.
     */
    delItem(path, defaultValue = null, reason = null) {
        return this.pop(path, defaultValue, reason);
    }

    // -------------------------------------------------------------------------
    // popNode
    // -------------------------------------------------------------------------

    /**
     * Remove and return the BagNode at a path.
     *
     * Like pop(), but returns the entire BagNode instead of just its value.
     *
     * @param {string} path - Hierarchical path to the node to remove.
     * @param {string|null} [reason=null] - Reason for deletion (for events).
     * @returns {BagNode|null} The removed BagNode, or null if not found.
     */
    popNode(path, reason = null) {
        const [obj, label] = this._htraverse(path, false, true);
        if (obj && label) {
            const n = obj._pop(label, reason);
            if (n) {
                return n;
            }
        }
        return null;
    }

    // -------------------------------------------------------------------------
    // clear
    // -------------------------------------------------------------------------

    /**
     * Remove all nodes from this Bag.
     *
     * Empties the Bag completely. In backref mode, triggers delete events
     * for all removed nodes.
     */
    clear() {
        const oldNodes = [...this._nodes];
        this._nodes.clear();
        if (this.backref) {
            this._onNodeDeleted(oldNodes, -1);
        }
    }

    // -------------------------------------------------------------------------
    // getNode
    // -------------------------------------------------------------------------

    /**
     * Get the BagNode at a path (not its value).
     *
     * @param {string} path - Hierarchical path like 'a.b.c'.
     * @param {boolean} [isStatic=true] - If true, don't trigger resolvers.
     * @returns {BagNode|null} The BagNode if found, null otherwise.
     */
    getNode(path, isStatic = true) {
        if (!path) {
            return null;
        }
        const [obj, label] = this._htraverse(path, false, isStatic);
        if (obj instanceof Bag && label) {
            return obj._nodes.get(label);
        }
        return null;
    }

    // -------------------------------------------------------------------------
    // Backref system
    // -------------------------------------------------------------------------

    /**
     * Enable backref mode (tree-leaf model with parent references).
     *
     * @param {BagNode|null} [node=null] - The BagNode that contains this Bag.
     * @param {Bag|null} [parent=null] - The parent Bag.
     */
    setBackref(node = null, parent = null) {
        if (this._backref !== true) {
            this._backref = true;
            this._parent = parent;
            this._parentNode = node;
            this._nodes._parentBag = this;
            for (const n of this) {
                n.parentBag = this;
            }
        }
    }

    /**
     * Clear parent reference and disable backref.
     */
    delParentRef() {
        this._parent = null;
        this._backref = false;
    }

    /**
     * Clear all backref assumptions recursively.
     */
    clearBackref() {
        if (this._backref) {
            this._backref = false;
            this._parent = null;
            this._parentNode = null;
            this._nodes._parentBag = null;
            for (const node of this) {
                node.parentBag = null;
                const value = node.getValue(true);
                if (value instanceof Bag) {
                    value.clearBackref();
                }
            }
        }
    }

    // -------------------------------------------------------------------------
    // Event triggers
    // -------------------------------------------------------------------------

    /**
     * Trigger for node change events.
     *
     * @param {BagNode} node - The changed node.
     * @param {string[]} pathlist - Path to the node.
     * @param {string} evt - Event type.
     * @param {*} [oldvalue=null] - Previous value.
     * @param {string|null} [reason=null] - Reason for change.
     */
    _onNodeChanged(node, pathlist, evt, oldvalue = null, reason = null) {
        for (const s of Object.values(this._updSubscribers)) {
            s({ node, pathlist, oldvalue, evt, reason });
        }
        if (this._parent && this._parentNode) {
            this._parent._onNodeChanged(
                node,
                [this._parentNode.label, ...pathlist],
                evt,
                oldvalue,
                reason
            );
        }
    }

    /**
     * Trigger for node insert events.
     *
     * @param {BagNode} node - The inserted node.
     * @param {number} ind - Index where inserted.
     * @param {string[]|null} [pathlist=null] - Path to the node.
     * @param {string|null} [reason=null] - Reason for insertion.
     */
    _onNodeInserted(node, ind, pathlist = null, reason = null) {
        const parent = node.parentBag;
        if (parent !== null && parent.backref && node.value instanceof Bag) {
            node.value.setBackref(node, parent);
        }

        if (pathlist === null) {
            pathlist = [];
        }
        for (const s of Object.values(this._insSubscribers)) {
            s({ node, pathlist, ind, evt: 'ins', reason });
        }
        if (this._parent && this._parentNode) {
            this._parent._onNodeInserted(
                node,
                ind,
                [this._parentNode.label, ...pathlist],
                reason
            );
        }
    }

    /**
     * Trigger for node delete events.
     *
     * @param {BagNode|BagNode[]} node - The deleted node(s).
     * @param {number} ind - Index where deleted (-1 for clear).
     * @param {string[]|null} [pathlist=null] - Path to the node.
     * @param {string|null} [reason=null] - Reason for deletion.
     */
    _onNodeDeleted(node, ind, pathlist = null, reason = null) {
        for (const s of Object.values(this._delSubscribers)) {
            s({ node, pathlist, ind, evt: 'del', reason });
        }
        if (this._parent && this._parentNode) {
            if (pathlist === null) {
                pathlist = [];
            }
            this._parent._onNodeDeleted(
                node,
                ind,
                [this._parentNode.label, ...pathlist],
                reason
            );
        }
    }

    // -------------------------------------------------------------------------
    // Subscription
    // -------------------------------------------------------------------------

    /**
     * Internal subscribe helper.
     */
    _subscribe(subscriberId, subscribersDict, callback) {
        if (callback !== null && callback !== undefined) {
            subscribersDict[subscriberId] = callback;
        }
    }

    /**
     * Subscribe to bag events.
     *
     * @param {string} subscriberId - Unique identifier for this subscription.
     * @param {Object} options - Subscription options.
     * @param {Function} [options.update] - Callback for update events.
     * @param {Function} [options.insert] - Callback for insert events.
     * @param {Function} [options.delete] - Callback for delete events.
     * @param {Function} [options.any] - Callback for all events.
     */
    subscribe(subscriberId, { update = null, insert = null, delete: del = null, any = null } = {}) {
        if (!this.backref) {
            this.setBackref();
        }

        this._subscribe(subscriberId, this._updSubscribers, update || any);
        this._subscribe(subscriberId, this._insSubscribers, insert || any);
        this._subscribe(subscriberId, this._delSubscribers, del || any);
    }

    /**
     * Unsubscribe from bag events.
     *
     * @param {string} subscriberId - The subscription identifier to remove.
     * @param {Object} options - Unsubscription options.
     * @param {boolean} [options.update=false] - Remove update subscription.
     * @param {boolean} [options.insert=false] - Remove insert subscription.
     * @param {boolean} [options.delete=false] - Remove delete subscription.
     * @param {boolean} [options.any=false] - Remove all subscriptions.
     */
    unsubscribe(subscriberId, { update = false, insert = false, delete: del = false, any = false } = {}) {
        if (update || any) {
            delete this._updSubscribers[subscriberId];
        }
        if (insert || any) {
            delete this._insSubscribers[subscriberId];
        }
        if (del || any) {
            delete this._delSubscribers[subscriberId];
        }
    }

    // -------------------------------------------------------------------------
    // Iteration
    // -------------------------------------------------------------------------

    /**
     * Iterate over BagNodes.
     */
    [Symbol.iterator]() {
        return this._nodes[Symbol.iterator]();
    }

    /**
     * Return node labels in order.
     *
     * @returns {string[]} Array of labels.
     */
    keys() {
        return this._nodes.keys();
    }

    /**
     * Return node values in order.
     *
     * @returns {Array} Array of values.
     */
    values() {
        return this._nodes.values();
    }

    /**
     * Return [label, value] tuples in order.
     *
     * @returns {Array} Array of [label, value] tuples.
     */
    items() {
        return this._nodes.items();
    }

    /**
     * Check equality with another Bag.
     *
     * @param {Bag} other - Bag to compare with.
     * @returns {boolean} True if both Bags have same nodes with same values and attributes.
     */
    isEqual(other) {
        return this._nodes.isEqual(other._nodes);
    }

    // -------------------------------------------------------------------------
    // walk - Depth-first tree traversal
    // -------------------------------------------------------------------------

    /**
     * Walk the tree depth-first.
     *
     * Generator mode: yields [path, node] tuples for all nodes in the tree.
     *
     * @param {boolean} [isStatic=true] - If true, don't trigger resolvers.
     * @yields {Array} [path, node] tuples.
     *
     * @example
     * for (const [path, node] of bag.walk()) {
     *     console.log(`${path}: ${node.value}`);
     * }
     */
    *walk(isStatic = true) {
        yield* this._walkInner('', isStatic);
    }

    /**
     * Internal recursive walk helper.
     *
     * @param {string} prefix - Current path prefix.
     * @param {boolean} isStatic - If true, don't trigger resolvers.
     * @yields {Array} [path, node] tuples.
     */
    *_walkInner(prefix, isStatic) {
        for (const node of this._nodes) {
            const path = prefix ? `${prefix}.${node.label}` : node.label;
            yield [path, node];

            const value = node.getValue(isStatic);
            if (value instanceof Bag) {
                yield* value._walkInner(path, isStatic);
            }
        }
    }

    // -------------------------------------------------------------------------
    // TyTx Serialization
    // -------------------------------------------------------------------------

    /**
     * Flatten nodes into (parent, label, tag, value, attr) tuples for TyTx.
     *
     * @param {Object|null} [pathRegistry=null] - If provided, enable compact mode.
     * @yields {Array} Tuples of [parent, label, tag, value, attr].
     */
    *_nodeFlattener(pathRegistry = null) {
        const compact = pathRegistry !== null;
        const pathToCode = compact ? {} : null;
        let codeCounter = 0;

        for (const [path, node] of this.walk(true)) {
            const lastDot = path.lastIndexOf('.');
            const parentPath = lastDot >= 0 ? path.slice(0, lastDot) : '';

            const nodeValue = node.getValue(true);

            // Value encoding
            let value;
            if (nodeValue instanceof Bag) {
                value = '::X';
            } else if (nodeValue === null) {
                value = '::NN';
            } else {
                value = nodeValue;
            }

            const attr = node.attr ? { ...node.attr } : {};
            const tag = node.tag || null;

            if (compact) {
                const parentRef = parentPath ? pathToCode[parentPath] : null;
                yield [parentRef, node.label, tag, value, attr];

                if (nodeValue instanceof Bag) {
                    pathToCode[path] = codeCounter;
                    pathRegistry[codeCounter] = path;
                    codeCounter++;
                }
            } else {
                // Use empty string for root level (matches Python behavior)
                yield [parentPath, node.label, tag, value, attr];
            }
        }
    }

    /**
     * Serialize Bag to TyTx format.
     *
     * Converts the Bag hierarchy into a flat list of row tuples,
     * then encodes using TyTx which preserves types (Decimal, Date, etc.).
     *
     * @param {string} [transport='json'] - Output format: 'json' or 'msgpack'.
     * @param {boolean} [compact=false] - If true, use numeric path codes.
     * @returns {string|Uint8Array} Serialized data.
     */
    toTytx(transport = 'json', compact = false) {
        let data;

        if (compact) {
            const paths = {};
            const rows = [...this._nodeFlattener(paths)];
            data = { rows, paths };
        } else {
            const rows = [...this._nodeFlattener(null)];
            data = { rows };
        }

        const tytxTransport = transport === 'json' ? null : transport;
        return tytxEncode(data, tytxTransport);
    }

    /**
     * Deserialize Bag from TyTx format.
     *
     * @param {string|Uint8Array} data - Serialized data from toTytx().
     * @param {string} [transport='json'] - Input format: 'json' or 'msgpack'.
     * @returns {Bag} Reconstructed Bag.
     */
    static fromTytx(data, transport = 'json') {
        const tytxTransport = transport === 'json' ? null : transport;
        const parsed = tytxDecode(data, tytxTransport);

        const rows = parsed.rows;
        const pathsRaw = parsed.paths;
        const codeToPath = pathsRaw
            ? Object.fromEntries(Object.entries(pathsRaw).map(([k, v]) => [parseInt(k), v]))
            : null;

        const bag = new Bag();
        const pathToBag = { '': bag };

        for (const row of rows) {
            const [parentRef, label, tag, value, attr] = row;

            // Resolve parent path
            let parentPath;
            if (codeToPath !== null) {
                parentPath = parentRef !== null ? (codeToPath[parentRef] || '') : '';
            } else {
                parentPath = parentRef || '';
            }

            const parentBag = pathToBag[parentPath] || bag;
            const fullPath = parentPath ? `${parentPath}.${label}` : label;

            // Decode value
            if (value === '::X') {
                const childBag = new Bag();
                parentBag.setItem(label, childBag, attr);
                pathToBag[fullPath] = childBag;
            } else if (value === '::NN') {
                parentBag.setItem(label, null, attr);
            } else {
                parentBag.setItem(label, value, attr);
            }

            // Set tag if present
            if (tag) {
                const node = parentBag.getNode(label);
                if (node) {
                    node.tag = tag;
                }
            }
        }

        return bag;
    }

    // -------------------------------------------------------------------------
    // String representation
    // -------------------------------------------------------------------------

    toString() {
        const lines = [];
        let idx = 0;
        for (const node of this._nodes) {
            const value = node.getValue(true);
            const typeName = value === null ? 'null' : typeof value;
            lines.push(`${idx} - (${typeName}) ${node.label}: ${value}`);
            idx++;
        }
        return lines.join('\n');
    }
}

/**
 * Exception raised for Bag-specific errors.
 */
export class BagException extends Error {
    constructor(message) {
        super(message);
        this.name = 'BagException';
    }
}
