// Copyright 2026 Softwell S.r.l. - SPDX-License-Identifier: Apache-2.0
// Browser target for the #uuid conditional import; Node selects node-uuid.js.
export function randomUUID() {
    return globalThis.crypto.randomUUID();
}
