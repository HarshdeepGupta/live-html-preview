const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

// Prints [watch] build started/finished so the $esbuild-watch problem matcher
// (from the connor4312.esbuild-problem-matchers extension) can track status.
const watchPlugin = {
    name: 'watch-plugin',
    setup(build) {
        build.onStart(() => console.log('[watch] build started'));
        build.onEnd((result) => {
            result.errors.forEach(({ text, location }) => {
                console.error(`✘ [ERROR] ${text}`);
                if (location) { console.error(`    ${location.file}:${location.line}:${location.column}:`); }
            });
            console.log('[watch] build finished');
        });
    }
};

async function main() {
    const ctx = await esbuild.context({
        entryPoints: ['src/extension.ts'],
        bundle: true,
        format: 'cjs',
        platform: 'node',
        outfile: 'dist/extension.js',
        external: ['vscode'],
        minify: production,
        sourcemap: !production,
        sourcesContent: false,
        logLevel: 'silent',
        plugins: [watchPlugin]
    });

    if (watch) {
        await ctx.watch();
    } else {
        await ctx.rebuild();
        await ctx.dispose();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
