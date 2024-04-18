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
const fs = require('fs');

const argv = require('minimist')(process.argv.slice(2), {
    alias: {
        'platform': 'p',
        'format': 'f'
    },
    default: {
        'platform': ['web', 'node'],
        'format': ['esm', 'cjs', 'cjs_min', 'umd', 'umd_min'],
        'config': 'build.config.js'}});

const defaultWebVersion = '8.0.9';
const defaultWebBuild = '1811';
const defaultNodeVersion = '8.0.5';
const defaultNodeBuild = '1791';

const config = require(path.resolve(argv.config));
config.webVersion = argv.version ? argv.version : defaultWebVersion;
config.webBuild = argv.build ? argv.build : defaultWebBuild;
config.nodeVersion = argv.version ? argv.version : defaultNodeVersion;
config.nodeBuild = argv.build ? argv.build : defaultNodeBuild;

const defaultWebCid = 'pcYgxn8m8%20feOojyA1U661o3g2.pz47Ag73nBwCvsf'
const defaultNodeCid = 'tqGko0tg4pkpW3DAK3R4hwLri8LBV84eXyyz3w'
const webCid = argv.LS_web_cid ? argv.LS_web_cid : defaultWebCid
const nodeCid = argv.LS_node_cid ? argv.LS_node_cid : defaultNodeCid

const platforms = [].concat(argv.platform);
const formats = [].concat(argv.format);
const options = []
    .concat(...platforms.map(p => formats.map(f => ({platform: p, format: f}))))
    .filter(o => ({ web: ['esm', 'cjs', 'umd', 'umd_min'], node: ['cjs', 'cjs_min']})[o.platform].includes(o.format));

console.log('Formats:', options.map(o => o.platform + '+' + o.format));
console.log('Web - Version:', config.webVersion, "build", config.webBuild);
console.log('Node.js - Version:', config.nodeVersion, "build", config.nodeBuild);

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
                extractLogsPlugin(config.web.esm),
                replace({
                    include: fullpath('source/Constants'),
                    delimiters: ['$', '$'],
                    version: config.webVersion,
                    build: config.webBuild,
                    library_name: 'javascript',
                    library_tag: 'javascript_client',
                    LS_cid: webCid
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
                extractLogsPlugin(config.web.cjs),
                replace({
                    include: fullpath('source/Constants'),
                    delimiters: ['$', '$'],
                    version: config.webVersion,
                    build: config.webBuild,
                    library_name: 'javascript',
                    library_tag: 'javascript_client',
                    LS_cid: webCid
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
                extractLogsPlugin(config.web.umd),
                replace({
                    include: fullpath('source/Constants'),
                    delimiters: ['$', '$'],
                    version: config.webVersion,
                    build: config.webBuild,
                    library_name: 'javascript',
                    library_tag: 'javascript_client',
                    LS_cid: webCid
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
                extractLogsPlugin(config.web.umd_min),
                replace({
                    include: fullpath('source/Constants'),
                    delimiters: ['$', '$'],
                    version: config.webVersion,
                    build: config.webBuild,
                    library_name: 'javascript',
                    library_tag: 'javascript_client',
                    LS_cid: webCid
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
                extractLogsPlugin(config.node.cjs),
                replace({
                    include: fullpath('source/Constants'),
                    delimiters: ['$', '$'],
                    version: config.nodeVersion,
                    build: config.nodeBuild,
                    library_name: 'nodejs',
                    library_tag: 'nodejs_client',
                    LS_cid: nodeCid
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
                extractLogsPlugin(config.node.cjs_min),
                replace({
                    include: fullpath('source/Constants'),
                    delimiters: ['$', '$'],
                    version: config.nodeVersion,
                    build: config.nodeBuild,
                    library_name: 'nodejs',
                    library_tag: 'nodejs_client',
                    LS_cid: nodeCid
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

function extractLogsPlugin(outFilePath) {
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
            } else {
                fs.writeFileSync(outFilePath + ".logmap", `
var ls_messageStrings=[${extractedLogs.join(',\n')}];
if (typeof module === 'object' && module.exports) {
    module.exports = ls_messageStrings;
}`);
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
        var namespace = createNs(extractNs(), lsGlobalObject());
        ${modules.map(m => `namespace['${m}'] = ${exportVar}['${m}'];`).join('\n')}
    }

    function lsIsBrowser() {
        return typeof(window) !== 'undefined' && typeof(window.document) !== 'undefined';
    }

    function lsGlobalObject() {
        return lsIsBrowser() ? window : self;
    }
    
    function extractNs() {
        if (!lsIsBrowser()) {
            return null;
        }
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
 * Version ${tag == 'Web' ? config.webVersion: config.nodeVersion} build ${tag == 'Web' ? config.webBuild: config.nodeBuild}
 * Copyright (c) Lightstreamer Srl. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0
 *   See http://www.apache.org/licenses/LICENSE-2.0
 * Contains: ${classes}
 */`;
}
