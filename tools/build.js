/*
 * SYNTAX: build [--platform <platform>] [--format <format>] [--config <file>] [--version <version>] [--build <build>]
 * 
 * OPTIONS:
 * -p, --platform: 'web' or 'node'. Default: all
 * -f, --format: 'esm', 'cjs', 'cjs_min', 'umd' or 'umd_min'. Default: all
 * --config: configuration file. Default: 'build.config.js'
 * --version: version number. Default: '0.1.0'
 * --build: build number. Default: '1'
 */
const rollup = require('rollup');
const compiler = require('@ampproject/rollup-plugin-closure-compiler');
const virtual = require('rollup-plugin-virtual');
const replace = require('rollup-plugin-replace');
const alias = require('rollup-plugin-alias');
const path = require('path');
const MagicString = require('magic-string');

const argv = require('minimist')(process.argv.slice(2), {
    alias: {
        'platform': 'p',
        'format': 'f'
    },
    default: {
        'platform': ['web', 'node'],
        'format': ['esm', 'cjs', 'cjs_min', 'umd', 'umd_min'],
        'version': '0.1.0',
        'build': '1',
        'config': 'build.config.js'}});

const config = require(path.resolve(argv.config));
config.version = argv.version;
config.build = argv.build;

const platforms = [].concat(argv.platform);
const formats = [].concat(argv.format);
const options = []
    .concat(...platforms.map(p => formats.map(f => ({platform: p, format: f}))))
    .filter(o => ({ web: ['esm', 'cjs', 'umd', 'umd_min'], node: ['cjs', 'cjs_min']})[o.platform].includes(o.format));

console.log('Formats:', options.map(o => o.platform + '+' + o.format));
console.log('Version:', config.version, "build", config.build);

build(...options);

async function build(...options) {
    const confOptions = configurations(...options);
    for (const {inputOptions, outputOptions} of confOptions) {        
        console.log('\n\nBuilding', outputOptions.file);
        inputOptions.onwarn = ({ loc, frame, message }) => {
            if (loc) {
                console.warn('WARNING', `${loc.file} (${loc.line}:${loc.column}) ${message}`);
                if (frame) console.warn(frame);
            } else {
                console.warn('WARNING', message);
            }
        };
        const bundle = await rollup.rollup(inputOptions);
        await bundle.generate(outputOptions);
        await bundle.write(outputOptions);
    }
}

function configurations(...options) {
    return options
    .filter(o => o.platform in config && o.format in config[o.platform])
    .map(o => {
        switch (o.platform) {
        case 'web':
            switch (o.format) {
            case 'esm':
                return web_esm();
            case 'cjs':
                return web_cjs();
            case 'umd':
                return web_umd();
            case 'umd_min':
                return web_umd_min();
            }
            break;
        case 'node':
            switch (o.format) {
            case 'cjs':
                return node_cjs();
            case 'cjs_min':
                return node_cjs_min();
            }
            break;
        }
    });
}

function sbcModulePath() {
    return fullpath(config.web.modules.includes('source/ConnectionSharing') ? 'source/ls_sbc' : 'source/alt/dummy_ls_sbc');
}

function mpnModulePath() {
    return fullpath(config.web.modules.includes('source/MpnDevice') ? 'source/mpn/MpnManager' : 'source/alt/DummyMpnManager');
}

function fullpath(p) {
    return path.resolve(config.sourceDir, p) + '.js';
}

function web_esm() {
    return {
        inputOptions: {
            input: 'virtual-entrypoint',
            plugins: [
                extractLogsPlugin(),
                replace({
                    include: fullpath('source/Constants'),
                    delimiters: ['$', '$'],
                    version: config.version,
                    build: config.build,
                    library_name: 'javascript',
                    library_tag: 'javascript_client',
                    LS_cid: encrypt('javascript_client ' + config.version + ' build ' + config.build)
                }),
                virtual({ 
                    'virtual-entrypoint': namedExports(config.web.modules, config.web.polyfills) }),
                alias({ 
                    'node-utils': fullpath('source/platform/DummyNodeUtils'),
                    './ls_sbc': sbcModulePath(),
                    './mpn/MpnManager': mpnModulePath() })]
        },
        outputOptions: {
            file: config.web.esm,
            banner: copyright('Web'),
            format: 'esm'
        }
    };
}

function web_cjs() {
    return {
        inputOptions: {
            input: 'virtual-entrypoint',
            plugins: [
                extractLogsPlugin(),
                replace({
                    include: fullpath('source/Constants'),
                    delimiters: ['$', '$'],
                    version: config.version,
                    build: config.build,
                    library_name: 'javascript',
                    library_tag: 'javascript_client',
                    LS_cid: encrypt('javascript_client ' + config.version + ' build ' + config.build)
                }),
                virtual({ 
                    'virtual-entrypoint': namedExports(config.web.modules, config.web.polyfills) }),
                alias({ 
                    'node-utils': fullpath('source/platform/DummyNodeUtils'),
                    './ls_sbc': sbcModulePath(),
                    './mpn/MpnManager': mpnModulePath() })]
        },
        outputOptions: {
            file: config.web.cjs,
            banner: copyright('Web'),
            format: 'cjs'
        }
    };
}

function web_umd() {
    return {
        inputOptions: {
            input: 'virtual-entrypoint',
            plugins: [
                extractLogsPlugin(),
                replace({
                    include: fullpath('source/Constants'),
                    delimiters: ['$', '$'],
                    version: config.version,
                    build: config.build,
                    library_name: 'javascript',
                    library_tag: 'javascript_client',
                    LS_cid: encrypt('javascript_client ' + config.version + ' build ' + config.build)
                }),
                virtual({ 
                    'virtual-entrypoint': defaultExports(config.web.modules, config.web.polyfills) }),
                alias({ 
                    'node-utils': fullpath('source/platform/DummyNodeUtils'),
                    './ls_sbc': sbcModulePath(),
                    './mpn/MpnManager': mpnModulePath() })]
        },
        outputOptions: {
            file: config.web.umd,
            name: 'lightstreamerExports',
            format: 'iife',
            banner: copyright('Web') + '\n' + umdHeader(),
            footer: umdFooter('lightstreamerExports')
        }
    };
}

function web_umd_min() {
    return {
        inputOptions: {
            input: 'virtual-entrypoint',
            plugins: [
                extractLogsPlugin(),
                replace({
                    include: fullpath('source/Constants'),
                    delimiters: ['$', '$'],
                    version: config.version,
                    build: config.build,
                    library_name: 'javascript',
                    library_tag: 'javascript_client',
                    LS_cid: encrypt('javascript_client ' + config.version + ' build ' + config.build)
                }),
                virtual({ 
                    'virtual-entrypoint': defaultExports(config.web.modules, config.web.polyfills) }),
                alias({ 
                    'node-utils': fullpath('source/platform/DummyNodeUtils'),
                    './ls_sbc': sbcModulePath(),
                    './mpn/MpnManager': mpnModulePath() }),
                compiler({
                    compilation_level: 'ADVANCED',
                    //warning_level: 'QUIET',
                    language_in: 'ECMASCRIPT5',
                    language_out: 'ECMASCRIPT5',
                    externs: path.resolve(__dirname, 'externs.js')})]
        },
        outputOptions: {
            file: config.web.umd_min,
            name: 'lightstreamerExports',
            format: 'iife',
            banner: copyright('Web') + '\n' + umdHeader(),
            footer: umdFooter('lightstreamerExports'),
            sourcemap: true
        }
    };
}

function node_cjs() {
    return {
        inputOptions: {
            input: 'virtual-entrypoint',
            external: ['faye-websocket', 'xmlhttprequest-cookie', 'url'],
            plugins: [
                extractLogsPlugin(),
                replace({
                    include: fullpath('source/Constants'),
                    delimiters: ['$', '$'],
                    version: config.version,
                    build: config.build,
                    library_name: 'nodejs',
                    library_tag: 'nodejs_client',
                    LS_cid: encrypt('nodejs_client ' + config.version + ' build ' + config.build)
                }),
                virtual({ 
                    'virtual-entrypoint': defaultExports(config.node.modules) }),
                alias({ 
                    'node-utils': fullpath('source/platform/NodeUtils'),
                    './ls_sbc': fullpath('source/alt/dummy_ls_sbc'),
                    './mpn/MpnManager': fullpath('source/alt/DummyMpnManager')})]
        },
        outputOptions: {
            file: config.node.cjs,
            banner: copyright('Node.js'),
            format: 'cjs'
        }
    };
}

function node_cjs_min() {
    return {
        inputOptions: {
            input: 'virtual-entrypoint',
            external: ['faye-websocket', 'xmlhttprequest-cookie', 'url'],
            plugins: [
                extractLogsPlugin(),
                replace({
                    include: fullpath('source/Constants'),
                    delimiters: ['$', '$'],
                    version: config.version,
                    build: config.build,
                    library_name: 'nodejs',
                    library_tag: 'nodejs_client',
                    LS_cid: encrypt('nodejs_client ' + config.version + ' build ' + config.build)
                }),
                virtual({ 
                    'virtual-entrypoint': defaultExports(config.node.modules) }),
                alias({ 
                    'node-utils': fullpath('source/platform/NodeUtils'),
                    './ls_sbc': fullpath('source/alt/dummy_ls_sbc'),
                    './mpn/MpnManager': fullpath('source/alt/DummyMpnManager') }),
                compiler({
                    compilation_level: 'ADVANCED',
                    //warning_level: 'QUIET',
                    language_in: 'ECMASCRIPT5',
                    language_out: 'ECMASCRIPT5',
                    externs: path.resolve(__dirname, 'externs.js')
                })]
        },
        outputOptions: {
            file: config.node.cjs_min,
            name: 'lightstreamerExports',
            format: 'iife',
            banner: copyright('Node.js'),
            footer: 'module.exports = lightstreamerExports;',
            sourcemap: true
        }
    };
}

function namedExports(modules, polyfills = []) {
    return `
${polyfills.map(m => `import ${JSON.stringify(fullpath(m))};`).join('\n')}
${modules.map(m => `import ${path.basename(m)} from ${JSON.stringify(fullpath(m))};`).join('\n')}
export {
${modules.map(m => path.basename(m)).join(',\n')}
};`
}

function defaultExports(modules, polyfills = []) {
    return `
${polyfills.map(m => `import ${JSON.stringify(fullpath(m))};`).join('\n')}
${modules.map(m => `import ${path.basename(m)} from ${JSON.stringify(fullpath(m))};`).join('\n')}
export default {
${modules.map(m => `'${path.basename(m)}': ${path.basename(m)}`).join(',\n')}
};`
}

function extractLogsPlugin() {
    const extractedLogs = [];
    return {
        name: 'rollup-plugin-log-extractor',
        renderChunk(code, chunck, options) {
            /* replaces logged strings with numeric codes */
            const newCode = new MagicString(code);
            const regex = /(logFatal\(|logError\(|logWarn\(|logInfo\(|logDebug\(|logErrorExc\([0-9a-zA-Z_]*,)(".*?")/g;
            for (let match; match = regex.exec(code);) {
                extractedLogs.push(match[2]);
                newCode.overwrite(
                        match.index, 
                        match.index + match[0].length, 
                        `${match[1]}LoggerManager.resolve(${extractedLogs.length - 1})`);
            }
            /* prepares an array to resolve numeric codes but only if module LogMessages is included in the bundle */
            if (Object.keys(chunck.modules).some(m => m.endsWith('LogMessages.js'))) {                
                const placeholder = "//ARRAY_IMPLEMENTATION_PLACEHOLDER";
                const i = code.indexOf(placeholder);
                newCode.overwrite(
                        i, 
                        i + placeholder.length, 
                        `messageStrings = [${extractedLogs.join()}];`);
            }
            /* */
            const result = { code: newCode.toString() };
            if (options.sourcemap) {
                result.map = newCode.generateMap({ hires: true });                
            }
            return result;
        }
    };
}

function encrypt(version) {
    var key = [6,2,42,6,5,11,20,4,22,7];
    var intervals = [
        [32,32,45-32-1,32-122-1],
        [45,46,48-46-1,45-32-1],
        [48,57,65-57-1,48-46-1],
        [65,90,95-90-1,65-57-1],
        [95,95,97-95-1,95-90-1],
        [97,122,32-122-1,97-95-1]
        ];
    if (version == null || version.length < 1) {
        throw "Unexpected empty string";
    }
    var k = 0;
    var result = [];
    var checksum = 0;
    for(var i=0; i<version.length; i++) {
        var character = version.charCodeAt(i);
        checksum += character;
        var simple = character+key[k];
        k++;
        if (k >= key.length) {
            k=0;
        }
        for (var n=0; n<intervals.length; n++) {
            if (character > intervals[n][1]) {
                continue;
            } else if (character < intervals[n][0]) {
                throw "Unexpected character in string";
            }
            while (simple > intervals[n][1]) {
                simple+= intervals[n][2];
                n++;
                if (n >= intervals.length) {
                    n=0;
                }
            }
            result.push(simple);
            break;
        }
    }
    checksum = (checksum%25) + 97;
    result.push(checksum);

    return String.fromCharCode.apply(String,result);
}

function umdHeader() {
    return `
;(function() {
`;
}

function umdFooter(exportVar) {
    const modules = config.web.modules.map(m => path.basename(m));
    return `
    if (typeof define === 'function' && define.amd) {
        define("lightstreamer", ["module"], function(module) {
            var namespace = (module.config()['ns'] ? module.config()['ns'] + '/' : '');
            ${modules.map(m => `define(namespace + '${m}', function() { return ${exportVar}['${m}'] });`).join('\n')}
        });
        require(["lightstreamer"]);
    }
    else if (typeof module === 'object' && module.exports) {
        ${modules.map(m => `exports['${m}'] = ${exportVar}['${m}'];`).join('\n')}
    }
    else {
        var namespace = createNs(extractNs(), window);
        ${modules.map(m => `namespace['${m}'] = ${exportVar}['${m}'];`).join('\n')}
    }
    
    function extractNs() {
        var scripts = window.document.getElementsByTagName("script");
        for (var i = 0, len = scripts.length; i < len; i++) {
            if ('data-lightstreamer-ns' in scripts[i].attributes) {        
                return scripts[i].attributes['data-lightstreamer-ns'].value;
            }
        }
        return null;
    }
    
    function createNs(ns, root) {
        if (! ns) {
            return root;
        }
        var pieces = ns.split('.');
        var parent = root || window;
        for (var j = 0; j < pieces.length; j++) {
            var qualifier = pieces[j];
            var obj = parent[qualifier];
            if (! (obj && typeof obj == 'object')) {
                obj = parent[qualifier] = {};
            }
            parent = obj;
        }
        return parent;
    }
}());
`;
}

function copyright(tag) {
    const modules = (tag == 'Web' ? 
        [].concat(config.web.modules, config.web.polyfills) : 
        config.node.modules);
    let classes = "";
    for (var i = 0, len = modules.length; i < len; i++) {
        classes += path.basename(modules[i]);
        if (i < len - 1) {
            classes += ', ';
        } 
        if ((i + 1) % 4 == 0) {
            classes += '\n *   ';
        }
    }
    return `/**
 * @preserve
 * LIGHTSTREAMER - www.lightstreamer.com
 * Lightstreamer ${tag} Client
 * Version ${config.version} build ${config.build}
 * Copyright (c) Lightstreamer Srl. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0
 *   See http://www.apache.org/licenses/LICENSE-2.0
 * Contains: ${classes}
 */`;
}
