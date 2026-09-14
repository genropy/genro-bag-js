import {build} from 'esbuild';

const nodeModuleShim = {
    name: 'node-module-shim',
    setup(builder) {
        builder.onResolve({filter: /^module$/}, () => ({
            path: 'module',
            namespace: 'node-module-shim'
        }));
        builder.onLoad({filter: /.*/, namespace: 'node-module-shim'}, () => ({
            contents: `
                export function createRequire() {
                    return function browserRequire(id) {
                        throw new Error("Cannot require '" + id + "' in a browser");
                    };
                }
            `,
            loader: 'js'
        }));
    }
};

await build({
    entryPoints: ['src/browser.js'],
    bundle: true,
    outfile: 'dist/genro-bag.browser.js',
    format: 'iife',
    globalName: 'GenroBagJS',
    platform: 'browser',
    target: ['es2020'],
    minify: false,
    sourcemap: true,
    plugins: [nodeModuleShim]
});
