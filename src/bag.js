// Copyright 2025 Softwell S.r.l. - SPDX-License-Identifier: Apache-2.0

import { BagNodeContainer } from './bag-node-container.js';
import { toTytx as tytxEncode, fromTytx as tytxDecode } from 'genro-tytx';
import { DOMParser as XmlDOMParser } from '@xmldom/xmldom';

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
        this._rootAttributes = null;
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

    /**
     * Root Bag of the hierarchy.
     *
     * Traverses the parent chain to find the topmost Bag. If this Bag has no
     * parent, returns itself.
     *
     * @returns {Bag} The root Bag.
     */
    get root() {
        let curr = this;
        while (curr.parent !== null) {
            curr = curr.parent;
        }
        return curr;
    }

    /**
     * Attributes of the node containing this Bag.
     *
     * Returns the attributes of the parent node that contains this Bag.
     * Returns an empty object if this Bag has no parent node.
     *
     * @returns {Object} Attributes dictionary.
     */
    get attributes() {
        if (this._parentNode !== null) {
            return this._parentNode.getAttr();
        }
        return {};
    }

    /**
     * Root-level attributes for this Bag hierarchy.
     *
     * These are special attributes stored at the hierarchy level,
     * independent of any node attributes.
     *
     * @returns {Object|null} Root attributes or null.
     */
    get rootAttributes() {
        return this._rootAttributes;
    }

    set rootAttributes(attrs) {
        this._rootAttributes = attrs !== null ? { ...attrs } : null;
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
        // Parse queryString from label
        let queryString = null;
        if (label.includes('?')) {
            [label, queryString] = label.split('?', 2);
        }
        const node = this._nodes.get(label);
        if (!node) {
            return defaultValue;
        }
        return node.getValue(isStatic, queryString);
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

    // -------------------------------------------------------------------------
    // Node Access Methods
    // -------------------------------------------------------------------------

    /**
     * Property alias for getNodes().
     *
     * @returns {BagNode[]} List of BagNodes.
     */
    get nodes() {
        return this.getNodes();
    }

    /**
     * Get a first-level node by label or index.
     *
     * Sync method for quick access to direct child nodes.
     * Does not traverse paths or trigger resolvers.
     *
     * @param {string|number} key - Node label (str) or index (int).
     * @returns {BagNode|null} The BagNode if found, null otherwise.
     *
     * @example
     * bag.node('a').value  // 1
     * bag.node(0).label    // 'a'
     */
    node(key) {
        return this._nodes.get(key);
    }

    /**
     * Set attributes on a node at the given path.
     *
     * @param {string|null} [path=null] - Path to the node.
     * @param {Object|null} [attr=null] - Dict of attributes to set.
     * @param {boolean} [removeNullAttributes=true] - If true, remove attributes with null value.
     */
    setAttr(path = null, attr = null, removeNullAttributes = true) {
        const node = this.getNode(path);
        if (node) {
            node.setAttr(attr, true, removeNullAttributes);
        }
    }

    /**
     * Get an attribute from a node at the given path.
     *
     * @param {string|null} [path=null] - Path to the node.
     * @param {string|null} [attr=null] - Attribute name to get.
     * @param {*} [defaultVal=null] - Default value if node or attribute not found.
     * @returns {*} Attribute value or default.
     */
    getAttr(path = null, attr = null, defaultVal = null) {
        const node = this.getNode(path);
        if (node) {
            return node.getAttr(attr, defaultVal);
        }
        return defaultVal;
    }

    /**
     * Delete attributes from a node at the given path.
     *
     * @param {string|null} [path=null] - Path to the node.
     * @param {...string} attrs - Attribute names to delete.
     */
    delAttr(path = null, ...attrs) {
        const node = this.getNode(path);
        if (node) {
            node.delAttr(...attrs);
        }
    }

    /**
     * Get inherited attributes from parent chain.
     *
     * @returns {Object} Dict of attributes inherited from parent nodes.
     */
    getInheritedAttributes() {
        if (this._parentNode) {
            return this._parentNode.getInheritedAttributes();
        }
        return {};
    }

    // -------------------------------------------------------------------------
    // Query Methods (BagQuery)
    // -------------------------------------------------------------------------

    /**
     * Get the actual list of nodes contained in the Bag.
     *
     * The getNodes method works as the filter of a list.
     *
     * @param {Function|null} [condition=null] - Optional callable that takes a BagNode and returns bool.
     * @returns {BagNode[]} List of BagNodes, optionally filtered by condition.
     */
    getNodes(condition = null) {
        if (!condition) {
            return [...this._nodes];
        }
        return [...this._nodes].filter(n => condition(n));
    }

    /**
     * Return the first BagNode whose value contains key=value.
     *
     * Searches only direct children (not recursive).
     * The node's value must be dict-like (Bag or dict).
     *
     * @param {string} key - Key to look for in node.value.
     * @param {*} value - Value to match.
     * @returns {BagNode|null} BagNode if found, null otherwise.
     */
    getNodeByValue(key, value) {
        for (const node of this._nodes) {
            const nodeValue = node.value;
            if (nodeValue && nodeValue.get && nodeValue.get(key) === value) {
                return node;
            }
        }
        return null;
    }

    /**
     * Return the first BagNode with the requested attribute value.
     *
     * Search strategy (hybrid depth-first with level priority):
     * 1. First checks all direct children of current Bag
     * 2. Then recursively searches into sub-Bags (depth-first)
     *
     * This means a match at the current level is always found before
     * descending into nested Bags, but once descent begins, it proceeds
     * depth-first through the subtree before checking siblings.
     *
     * @param {string} attr - Attribute name to search.
     * @param {*} value - Attribute value to match.
     * @returns {BagNode|null} BagNode if found, null otherwise.
     */
    getNodeByAttr(attr, value) {
        const subBags = [];
        for (const node of this._nodes) {
            if (node.hasAttr(attr, value)) {
                return node;
            }
            if (node.value instanceof Bag) {
                subBags.push(node);
            }
        }

        for (const node of subBags) {
            const found = node.value.getNodeByAttr(attr, value);
            if (found) {
                return found;
            }
        }

        return null;
    }

    /**
     * Check if the Bag is empty.
     *
     * A node is considered non-empty if:
     * - It has a resolver (even if static value is null, the resolver
     *   represents potential content that can be loaded)
     * - It has a non-null static value (unless zeroIsNone/blankIsNone apply)
     *
     * This method never triggers resolver I/O - it only checks static values
     * and resolver presence.
     *
     * @param {boolean} [zeroIsNone=false] - If true, treat 0 values as empty.
     * @param {boolean} [blankIsNone=false] - If true, treat blank strings as empty.
     * @returns {boolean} True if Bag is empty according to criteria, false otherwise.
     */
    isEmpty(zeroIsNone = false, blankIsNone = false) {
        if (this._nodes.length === 0) {
            return true;
        }

        for (const node of this._nodes) {
            // A node with a resolver is not empty (has potential content)
            if (node._resolver !== null) {
                return false;
            }
            const v = node.getValue(true);  // static=true
            if (v === null || v === undefined) {
                continue;
            }
            if (zeroIsNone && v === 0) {
                continue;
            }
            if (blankIsNone && v === '') {
                continue;
            }
            return false;
        }

        return true;
    }

    /**
     * Query Bag elements, extracting specified data.
     *
     * @param {string|Array|null} [what=null] - String of special keys separated by comma, or array of keys.
     *     Special keys:
     *     - '#k': label of each item
     *     - '#v': value of each item
     *     - '#v.path': inner values of each item
     *     - '#__v': static value (always bypasses resolver)
     *     - '#a': all attributes of each item
     *     - '#a.attrname': specific attribute for each item
     *     - '#p': path (full path from root, useful with deep=true)
     *     - '#n': node (the BagNode itself)
     *     - callable: custom function applied to each node
     * @param {Function|null} [condition=null] - Optional callable filter (receives BagNode, returns bool).
     * @param {boolean} [iter=false] - If true, return a generator instead of an array.
     * @param {boolean} [deep=false] - If true, traverse recursively (depth-first) instead of first level only.
     * @param {boolean} [leaf=true] - If true (default), include leaf nodes (non-Bag values).
     * @param {boolean} [branch=true] - If true (default), include branch nodes (Bag values).
     * @param {number|null} [limit=null] - Maximum number of results to return. null means no limit.
     * @param {boolean} [isStatic=true] - If true (default), don't trigger resolvers during traversal.
     * @returns {Array|Generator} Array of tuples, or generator if iter=true.
     */
    query(what = null, condition = null, iter = false, deep = false, leaf = true, branch = true, limit = null, isStatic = true) {
        if (!what) {
            what = '#k,#v,#a';
        }

        let obj = this;
        let whatsplit;

        if (typeof what === 'string') {
            if (what.includes(':')) {
                const [where, whatPart] = what.split(':');
                obj = this.getItem(where);
                what = whatPart;
            }
            whatsplit = what.split(',').map(x => x.trim());
        } else {
            whatsplit = what;
        }

        const _extractValue = (node, w, path, isDeep) => {
            if (w === '#k') {
                return node.label;
            } else if (w === '#p') {
                return path;
            } else if (w === '#n') {
                return node;
            } else if (typeof w === 'function') {
                return w(node);
            } else if (w === '#v') {
                const v = node.getValue(isStatic);
                // With deep=true, Bag values return null (content comes in later iterations)
                return isDeep && v instanceof Bag ? null : v;
            } else if (w.startsWith('#v.')) {
                const innerPath = w.split('.').slice(1).join('.');
                const value = node.getValue(isStatic);
                return value && value.getItem ? value.getItem(innerPath) : null;
            } else if (w === '#__v') {
                return node.getValue(true);  // Always static
            } else if (w.startsWith('#a')) {
                const attr = w.includes('.') ? w.split('.').slice(1).join('.') : null;
                return node.getAttr(attr);
            } else {
                const value = node.getValue(isStatic);
                return value && value.getItem ? value.getItem(w) : null;
            }
        };

        const _shouldInclude = (node) => {
            const isBranch = node.getValue(isStatic) instanceof Bag;
            if (isBranch && !branch) {
                return false;
            }
            if (!isBranch && !leaf) {
                return false;
            }
            return condition === null || condition(node);
        };

        function* _iterDigest() {
            let count = 0;
            if (deep) {
                // Use walk() for recursive traversal
                for (const [path, node] of obj.walk(isStatic)) {
                    if (_shouldInclude(node)) {
                        if (whatsplit.length === 1) {
                            yield _extractValue(node, whatsplit[0], path, true);
                        } else {
                            yield whatsplit.map(w => _extractValue(node, w, path, true));
                        }
                        count++;
                        if (limit !== null && count >= limit) {
                            return;
                        }
                    }
                }
            } else {
                // First level only
                for (const node of obj._nodes) {
                    if (_shouldInclude(node)) {
                        const path = node.label;
                        if (whatsplit.length === 1) {
                            yield _extractValue(node, whatsplit[0], path, false);
                        } else {
                            yield whatsplit.map(w => _extractValue(node, w, path, false));
                        }
                        count++;
                        if (limit !== null && count >= limit) {
                            return;
                        }
                    }
                }
            }
        }

        if (iter) {
            return _iterDigest();
        }

        return [..._iterDigest()];
    }

    /**
     * Return a list of tuples with keys/values/attributes (backward compatible).
     *
     * This is an alias for query() with iter=false, deep=false for backward
     * compatibility. Use query() for new code.
     *
     * @param {string|Array|null} [what=null] - String of special keys separated by comma, or array of keys.
     * @param {Function|null} [condition=null] - Optional callable filter (receives BagNode, returns bool).
     * @param {boolean} [asColumns=false] - If true, return array of arrays (transposed).
     * @returns {Array} Array of tuples (or array of arrays if asColumns=true).
     */
    digest(what = null, condition = null, asColumns = false) {
        const result = this.query(what, condition, false, false);

        if (asColumns) {
            if (!result || result.length === 0) {
                const whatStr = typeof what === 'string' ? what : '#k,#v,#a';
                const whatsplit = whatStr.split(',').map(x => x.trim());
                return whatsplit.map(() => []);
            }
            const resultList = [...result];
            if (resultList.length && Array.isArray(resultList[0])) {
                // Transpose: list of rows → list of columns
                const numCols = resultList[0].length;
                const columns = [];
                for (let i = 0; i < numCols; i++) {
                    columns.push(resultList.map(row => row[i]));
                }
                return columns;
            }
            return [resultList];
        }
        return [...result];
    }

    /**
     * Return digest result as columns.
     *
     * @param {string|Array} cols - Column names as comma-separated string or array.
     * @param {boolean} [attrMode=false] - If true, prefix columns with '#a.' for attribute access.
     * @returns {Array} Array of arrays (columns).
     */
    columns(cols, attrMode = false) {
        if (typeof cols === 'string') {
            cols = cols.split(',');
        }
        const mode = attrMode ? '#a.' : '';
        const what = cols.map(col => `${mode}${col}`).join(',');
        return this.digest(what, null, true);
    }

    /**
     * Sum values or attributes.
     *
     * @param {string} [what='#v'] - What to sum (same syntax as query).
     *     - '#v': sum values
     *     - '#a.attrname': sum attribute
     *     - '#v,#a.price': multiple sums (returns array)
     * @param {Function|null} [condition=null] - Optional callable filter (receives BagNode, returns bool).
     * @param {boolean} [deep=false] - If true, recursively sum through nested Bags.
     * @returns {number|number[]} Sum as number, or array of numbers if multiple what specs.
     *
     * @example
     * bag.sum()                    // sum all values
     * bag.sum('#a.price')          // sum 'price' attribute
     * bag.sum('#v,#a.qty')         // [sum_values, sum_qty]
     * bag.sum('#v', n => n.getAttr('active'))  // filtered sum
     * bag.sum('#a.qty', null, true)  // recursive sum
     */
    sum(what = '#v', condition = null, deep = false) {
        if (what.includes(',')) {
            return what.split(',').map(w => {
                let total = 0;
                for (const v of this.query(w.trim(), condition, false, deep)) {
                    total += (v || 0);
                }
                return total;
            });
        }
        let total = 0;
        for (const v of this.query(what, condition, false, deep)) {
            total += (v || 0);
        }
        return total;
    }

    /**
     * Sort nodes in place.
     *
     * @param {string|Function} [key='#k:a'] - Sort specification string or callable.
     *     If callable, used directly as key function for sort.
     *     If string, format is 'criterion:mode' or multiple 'c1:m1,c2:m2'.
     *
     *     Criteria:
     *     - '#k': sort by label
     *     - '#v': sort by value
     *     - '#a.attrname': sort by attribute
     *     - 'fieldname': sort by field in value (if value is dict/Bag)
     *
     *     Modes:
     *     - 'a': ascending, case-insensitive (default)
     *     - 'A': ascending, case-sensitive
     *     - 'd': descending, case-insensitive
     *     - 'D': descending, case-sensitive
     *
     * @returns {Bag} Self (for chaining).
     *
     * @example
     * bag.sort('#k')           // by label ascending
     * bag.sort('#k:d')         // by label descending
     * bag.sort('#v:A')         // by value ascending, case-sensitive
     * bag.sort('#a.name:a')    // by attribute 'name'
     * bag.sort('field:d')      // by field in value
     * bag.sort('#k:a,#v:d')    // multi-level sort
     * bag.sort(n => n.value)   // custom key function
     */
    sort(key = '#k:a') {
        /**
         * Create sort key handling null/undefined and case sensitivity.
         * @param {*} value - The value to create key for.
         * @param {boolean} caseInsensitive - Whether to ignore case for strings.
         * @returns {Array} Tuple [priority, value] where priority 1 means null (sort last).
         */
        const sortKey = (value, caseInsensitive) => {
            if (value === null || value === undefined) {
                return [1, ''];  // null/undefined values sort last
            }
            if (caseInsensitive && typeof value === 'string') {
                return [0, value.toLowerCase()];
            }
            return [0, value];
        };

        /**
         * Compare two sort keys.
         * @param {Array} a - First sort key [priority, value].
         * @param {Array} b - Second sort key [priority, value].
         * @returns {number} Comparison result for Array.sort.
         */
        const compareKeys = (a, b) => {
            // First compare by priority (nulls last)
            if (a[0] !== b[0]) {
                return a[0] - b[0];
            }
            // Then compare by value
            if (a[1] < b[1]) return -1;
            if (a[1] > b[1]) return 1;
            return 0;
        };

        if (typeof key === 'function') {
            this._nodes._list.sort((a, b) => {
                const ka = key(a);
                const kb = key(b);
                if (ka < kb) return -1;
                if (ka > kb) return 1;
                return 0;
            });
        } else {
            const levels = key.split(',');
            levels.reverse();  // process in reverse for stable multi-level sort
            for (const level of levels) {
                let what, mode;
                if (level.includes(':')) {
                    [what, mode] = level.split(':', 2);
                } else {
                    what = level;
                    mode = 'a';
                }
                what = what.trim();
                mode = mode.trim();

                const reverse = mode === 'd' || mode === 'D';
                const caseInsensitive = mode === 'a' || mode === 'd';

                let keyFn;
                if (what.toLowerCase() === '#k') {
                    keyFn = n => sortKey(n.label, caseInsensitive);
                } else if (what.toLowerCase() === '#v') {
                    keyFn = n => sortKey(n.value, caseInsensitive);
                } else if (what.toLowerCase().startsWith('#a.')) {
                    const attrname = what.slice(3);
                    keyFn = n => sortKey(n.getAttr(attrname), caseInsensitive);
                } else {
                    // Sort by field in value
                    keyFn = n => sortKey(
                        n.value ? n.value[what] : null,
                        caseInsensitive
                    );
                }

                this._nodes._list.sort((a, b) => {
                    const result = compareKeys(keyFn(a), keyFn(b));
                    return reverse ? -result : result;
                });
            }
        }
        return this;
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
     * Two modes of operation:
     *
     * 1. **Generator mode** (no callback or boolean first arg): Returns a generator yielding
     *    [path, node] tuples for all nodes in the tree. This is the
     *    recommended approach.
     *
     * 2. **Legacy callback mode** (function first arg): Calls callback(node, kwargs) for each
     *    node. Supports early exit (if callback returns truthy value),
     *    _pathlist and _indexlist kwargs for path tracking.
     *
     * @param {Function|boolean} [callbackOrStatic=true] - If function, use callback mode.
     *     If boolean or omitted, use generator mode with isStatic.
     * @param {boolean} [isStatic=true] - If true, don't trigger resolvers during traversal.
     *     Only used in callback mode (second argument).
     * @param {Object} [kwargs={}] - Passed to callback. Special keys:
     *     - _pathlist: array of labels from root (auto-updated by walk)
     *     - _indexlist: array of indices from root (auto-updated by walk)
     * @returns {Generator|*} Generator of [path, node] if generator mode.
     *     If callback provided: value returned by callback if truthy, else null.
     *
     * @example
     * // Generator mode (modern, recommended)
     * for (const [path, node] of bag.walk()) {
     *     console.log(`${path}: ${node.value}`);
     * }
     *
     * @example
     * // Generator mode with isStatic=false
     * for (const [path, node] of bag.walk(false)) {
     *     console.log(`${path}: ${node.value}`);
     * }
     *
     * @example
     * // Legacy callback mode with path tracking
     * bag.walk((node, kw) => {
     *     console.log(kw._pathlist.join('.'));
     * }, true, { _pathlist: [] });
     */
    walk(callbackOrStatic = true, isStatic = true, kwargs = {}) {
        if (typeof callbackOrStatic === 'function') {
            // Legacy callback mode
            return this._walkCallback(callbackOrStatic, isStatic, kwargs);
        }
        // Generator mode - first arg is isStatic (boolean or undefined)
        const staticMode = typeof callbackOrStatic === 'boolean' ? callbackOrStatic : true;
        return this._walkGenerator(staticMode);
    }

    /**
     * Internal generator walk helper.
     *
     * @param {boolean} isStatic - If true, don't trigger resolvers.
     * @yields {Array} [path, node] tuples.
     */
    *_walkGenerator(isStatic) {
        yield* this._walkInner('', isStatic);
    }

    /**
     * Internal recursive walk helper for generator mode.
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

    /**
     * Internal callback walk helper.
     *
     * @param {Function} callback - Callback function(node, kwargs).
     * @param {boolean} isStatic - If true, don't trigger resolvers.
     * @param {Object} kwargs - Kwargs passed to callback.
     * @returns {*} Value returned by callback if truthy, else null.
     */
    _walkCallback(callback, isStatic, kwargs) {
        for (let idx = 0; idx < this._nodes.length; idx++) {
            const node = this._nodes._list[idx];
            const kw = { ...kwargs };

            if ('_pathlist' in kwargs) {
                kw._pathlist = [...kwargs._pathlist, node.label];
            }
            if ('_indexlist' in kwargs) {
                kw._indexlist = [...kwargs._indexlist, idx];
            }

            const result = callback(node, kw);
            if (result) {
                return result;
            }

            const value = node.getValue(isStatic);
            if (value instanceof Bag) {
                const innerResult = value._walkCallback(callback, isStatic, kw);
                if (innerResult) {
                    return innerResult;
                }
            }
        }
        return null;
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
    // XML Serialization
    // -------------------------------------------------------------------------

    /**
     * Serialize Bag to XML format.
     *
     * All values are converted to strings without type information.
     * For type-preserving serialization, use toTytx() instead.
     *
     * @param {Object} [options={}] - Serialization options.
     * @param {boolean} [options.pretty=false] - If true, format with indentation.
     * @param {string} [options.encoding='UTF-8'] - XML encoding.
     * @param {boolean|string} [options.docHeader=null] - XML declaration.
     * @param {string[]} [options.selfClosedTags=null] - Tags to self-close when empty.
     * @returns {string} XML string.
     */
    toXml(options = {}) {
        const { pretty = false, encoding = 'UTF-8', docHeader = null, selfClosedTags = null } = options;

        let content = this._bagToXml(selfClosedTags);

        if (pretty) {
            content = this._prettifyXml(content);
        }

        if (docHeader === true) {
            content = `<?xml version='1.0' encoding='${encoding}'?>\n${content}`;
        } else if (typeof docHeader === 'string') {
            content = `${docHeader}\n${content}`;
        }

        return content;
    }

    /**
     * Convert Bag to XML string (internal).
     * @private
     */
    _bagToXml(selfClosedTags = null) {
        const parts = [];
        for (const node of this._nodes) {
            parts.push(this._nodeToXml(node, selfClosedTags));
        }
        return parts.join('');
    }

    /**
     * Convert a BagNode to XML string (internal).
     * @private
     */
    _nodeToXml(node, selfClosedTags = null) {
        // Use xml_tag, tag, or label
        const xmlTag = node.xmlTag || node.tag || node.label;
        const tag = this._sanitizeTag(xmlTag);

        // Build attributes string
        const attrsParts = [];
        if (node.attr) {
            for (const [k, v] of Object.entries(node.attr)) {
                if (v !== null && v !== false && v !== undefined) {
                    attrsParts.push(`${k}="${this._escapeAttr(String(v))}"`);
                }
            }
        }
        const attrsStr = attrsParts.length ? ' ' + attrsParts.join(' ') : '';

        // Handle value
        const value = node.getValue(true);  // static=true

        // Check if value is a Bag
        if (value && typeof value._bagToXml === 'function') {
            const inner = value._bagToXml(selfClosedTags);
            if (inner) {
                return `<${tag}${attrsStr}>${inner}</${tag}>`;
            }
            // Empty Bag
            if (selfClosedTags === null || selfClosedTags.includes(tag)) {
                return `<${tag}${attrsStr}/>`;
            }
            return `<${tag}${attrsStr}></${tag}>`;
        }

        // Scalar value
        if (value === null || value === undefined || value === '') {
            if (selfClosedTags === null || selfClosedTags.includes(tag)) {
                return `<${tag}${attrsStr}/>`;
            }
            return `<${tag}${attrsStr}></${tag}>`;
        }

        const text = this._escapeXml(String(value));
        return `<${tag}${attrsStr}>${text}</${tag}>`;
    }

    /**
     * Sanitize tag name for XML.
     * @private
     */
    _sanitizeTag(tag) {
        if (!tag) return '_none_';
        // Replace invalid characters with underscore
        return tag.replace(/[^a-zA-Z0-9_\-.:]/g, '_');
    }

    /**
     * Escape XML text content.
     * @private
     */
    _escapeXml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    /**
     * Escape XML attribute value.
     * @private
     */
    _escapeAttr(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    /**
     * Pretty-print XML with indentation.
     * @private
     */
    _prettifyXml(xml) {
        let formatted = '';
        let indent = '';
        const tab = '  ';

        xml.split(/>\s*</).forEach((node, index) => {
            if (index > 0) {
                if (node.match(/^\/\w/)) {
                    // Closing tag
                    indent = indent.substring(tab.length);
                }
                formatted += '\n' + indent;
            }
            formatted += (index > 0 ? '<' : '') + node + (index < xml.split(/>\s*</).length - 1 ? '>' : '');
            if (node.match(/^<?\w[^>]*[^/]$/) && !node.startsWith('/')) {
                // Opening tag (not self-closing)
                indent += tab;
            }
        });
        return formatted;
    }

    /**
     * Deserialize Bag from XML format.
     *
     * @param {string} source - XML string to parse.
     * @returns {Bag} Reconstructed Bag hierarchy.
     */
    static fromXml(source) {
        // Use DOMParser (browser) or @xmldom/xmldom (Node.js)
        let doc;
        if (typeof DOMParser !== 'undefined') {
            const parser = new DOMParser();
            doc = parser.parseFromString(source, 'application/xml');
            // Check for parse errors (browser-specific)
            const parseError = doc.querySelector('parsererror');
            if (parseError) {
                throw new Error(`XML parse error: ${parseError.textContent}`);
            }
        } else {
            // Node.js environment - use @xmldom/xmldom
            const parser = new XmlDOMParser();
            doc = parser.parseFromString(source, 'application/xml');
        }

        return Bag._xmlElementToBag(doc.documentElement);
    }

    /**
     * Convert XML element to Bag (recursive).
     * @private
     */
    static _xmlElementToBag(element) {
        const bag = new Bag();

        // Use childNodes and filter for element nodes (nodeType === 1)
        // This works both in browser and @xmldom/xmldom
        const childElements = Array.from(element.childNodes).filter(n => n.nodeType === 1);

        for (const child of childElements) {
            const label = child.tagName;
            const attr = {};

            // Collect attributes
            for (let i = 0; i < child.attributes.length; i++) {
                const attrNode = child.attributes[i];
                attr[attrNode.name] = attrNode.value;
            }

            // Check if has child elements (nested Bag)
            const childChildElements = Array.from(child.childNodes).filter(n => n.nodeType === 1);
            if (childChildElements.length > 0) {
                const childBag = Bag._xmlElementToBag(child);
                bag.setItem(label, childBag, Object.keys(attr).length > 0 ? attr : null);
            } else {
                // Text content
                const value = child.textContent || '';
                bag.setItem(label, value, Object.keys(attr).length > 0 ? attr : null);
            }
        }

        return bag;
    }

    // -------------------------------------------------------------------------
    // JSON Serialization
    // -------------------------------------------------------------------------

    /**
     * Serialize Bag to JSON string.
     *
     * Each node becomes {"label": ..., "value": ..., "attr": {...}}.
     * Nested Bags have value as a list of child nodes.
     *
     * @param {boolean} [typed=true] - If true, encode types for date/datetime/Decimal (TYTX).
     * @returns {string} JSON string representation.
     */
    toJson(typed = true) {
        const result = [];
        for (const node of this._nodes) {
            result.push(this._nodeToJsonDict(node, typed));
        }

        if (typed) {
            return tytxEncode(result);
        }
        return JSON.stringify(result);
    }

    /**
     * Convert a BagNode to JSON-serializable dict (internal).
     * @private
     */
    _nodeToJsonDict(node, typed) {
        let value = node.getValue(true);  // static=true

        // Check if value is a Bag
        if (value && typeof value._nodeToJsonDict === 'function') {
            const childResult = [];
            for (const childNode of value._nodes) {
                childResult.push(value._nodeToJsonDict(childNode, typed));
            }
            value = childResult;
        }

        return {
            label: node.label,
            value: value,
            attr: node.attr && Object.keys(node.attr).length > 0 ? { ...node.attr } : {}
        };
    }

    /**
     * Deserialize JSON to Bag.
     *
     * Accepts JSON string, dict, or list. Recursively converts nested
     * structures to Bag hierarchy.
     *
     * @param {string|Object|Array} source - JSON string, dict or list to parse.
     * @returns {Bag} Deserialized Bag.
     */
    static fromJson(source) {
        if (typeof source === 'string') {
            source = tytxDecode(source);
        }

        if (!Array.isArray(source) && typeof source !== 'object') {
            source = { value: source };
        }

        return Bag._fromJsonRecursive(source);
    }

    /**
     * Recursively convert JSON data to Bag (internal).
     * @private
     */
    static _fromJsonRecursive(data) {
        if (Array.isArray(data)) {
            if (data.length === 0) {
                return new Bag();
            }

            // Check if list items have 'label' key (Bag node format)
            if (typeof data[0] === 'object' && data[0] !== null && 'label' in data[0]) {
                const result = new Bag();
                for (const item of data) {
                    const label = item.label;
                    const value = Bag._fromJsonRecursive(item.value);
                    const attr = item.attr || {};
                    result.setItem(label, value, Object.keys(attr).length > 0 ? attr : null);
                }
                return result;
            }

            // Generic list -> Bag with r_N keys
            const result = new Bag();
            for (let n = 0; n < data.length; n++) {
                result.setItem(`r_${n}`, Bag._fromJsonRecursive(data[n]));
            }
            return result;
        }

        if (typeof data === 'object' && data !== null) {
            if (Object.keys(data).length === 0) {
                return new Bag();
            }
            const result = new Bag();
            for (const [k, v] of Object.entries(data)) {
                result.setItem(k, Bag._fromJsonRecursive(v));
            }
            return result;
        }

        // Scalar value
        return data;
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
