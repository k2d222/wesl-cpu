let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
}


const lTextDecoder = typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder : TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

function _assertBoolean(n) {
    if (typeof(n) !== 'boolean') {
        throw new Error(`expected a boolean argument, found ${typeof(n)}`);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function _assertNum(n) {
    if (typeof(n) !== 'number') throw new Error(`expected a number argument, found ${typeof(n)}`);
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

let WASM_VECTOR_LEN = 0;

const lTextEncoder = typeof TextEncoder === 'undefined' ? (0, module.require)('util').TextEncoder : TextEncoder;

let cachedTextEncoder = new lTextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (typeof(arg) !== 'string') throw new Error(`expected a string argument, found ${typeof(arg)}`);

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);
        if (ret.read !== arg.length) throw new Error('failed to pass whole string');
        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function _assertBigInt(n) {
    if (typeof(n) !== 'bigint') throw new Error(`expected a bigint argument, found ${typeof(n)}`);
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_export_2.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}
/**
 * @param {any} cli
 * @returns {any}
 */
export function main(cli) {
    const ret = wasm.main(cli);
    if (ret[2]) {
        throw takeFromExternrefTable0(ret[1]);
    }
    return takeFromExternrefTable0(ret[0]);
}

function logError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        let error = (function () {
            try {
                return e instanceof Error ? `${e.message}\n\nStack:\n${e.stack}` : e.toString();
            } catch(_) {
                return "<failed to stringify thrown value>";
            }
        }());
        console.error("wasm-bindgen: imported JS function that was not marked as `catch` threw an error:", error);
        throw e;
    }
}

function notDefined(what) { return () => { throw new Error(`${what} is not defined`); }; }

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_export_2.set(idx, obj);
    return idx;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

export function __wbindgen_error_new(arg0, arg1) {
    const ret = new Error(getStringFromWasm0(arg0, arg1));
    return ret;
};

export function __wbindgen_in(arg0, arg1) {
    const ret = arg0 in arg1;
    _assertBoolean(ret);
    return ret;
};

export function __wbindgen_number_get(arg0, arg1) {
    const obj = arg1;
    const ret = typeof(obj) === 'number' ? obj : undefined;
    if (!isLikeNone(ret)) {
        _assertNum(ret);
    }
    getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
};

export function __wbindgen_boolean_get(arg0) {
    const v = arg0;
    const ret = typeof(v) === 'boolean' ? (v ? 1 : 0) : 2;
    _assertNum(ret);
    return ret;
};

export function __wbindgen_string_get(arg0, arg1) {
    const obj = arg1;
    const ret = typeof(obj) === 'string' ? obj : undefined;
    var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbindgen_is_bigint(arg0) {
    const ret = typeof(arg0) === 'bigint';
    _assertBoolean(ret);
    return ret;
};

export function __wbindgen_is_object(arg0) {
    const val = arg0;
    const ret = typeof(val) === 'object' && val !== null;
    _assertBoolean(ret);
    return ret;
};

export function __wbindgen_jsval_eq(arg0, arg1) {
    const ret = arg0 === arg1;
    _assertBoolean(ret);
    return ret;
};

export function __wbindgen_bigint_from_i64(arg0) {
    const ret = arg0;
    return ret;
};

export function __wbindgen_bigint_from_u64(arg0) {
    const ret = BigInt.asUintN(64, arg0);
    return ret;
};

export function __wbindgen_number_new(arg0) {
    const ret = arg0;
    return ret;
};

export function __wbindgen_string_new(arg0, arg1) {
    const ret = getStringFromWasm0(arg0, arg1);
    return ret;
};

export function __wbindgen_jsval_loose_eq(arg0, arg1) {
    const ret = arg0 == arg1;
    _assertBoolean(ret);
    return ret;
};

export function __wbg_set_f975102236d3c502() { return logError(function (arg0, arg1, arg2) {
    arg0[arg1] = arg2;
}, arguments) };

export const __wbg_debug_d7780810b3a93632 = typeof console.debug == 'function' ? console.debug : notDefined('console.debug');

export const __wbg_error_f02f3d66b42c6251 = typeof console.error == 'function' ? console.error : notDefined('console.error');

export const __wbg_info_123d8c35ec14384a = typeof console.info == 'function' ? console.info : notDefined('console.info');

export const __wbg_log_22aecf4cc2edc319 = typeof console.log == 'function' ? console.log : notDefined('console.log');

export const __wbg_warn_60924fcf321399f0 = typeof console.warn == 'function' ? console.warn : notDefined('console.warn');

export function __wbg_error_f851667af71bcfc6() { return logError(function (arg0, arg1) {
    let deferred0_0;
    let deferred0_1;
    try {
        deferred0_0 = arg0;
        deferred0_1 = arg1;
        console.error(getStringFromWasm0(arg0, arg1));
    } finally {
        wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
    }
}, arguments) };

export function __wbg_new_abda76e883ba8a5f() { return logError(function () {
    const ret = new Error();
    return ret;
}, arguments) };

export function __wbg_stack_658279fe44541cf6() { return logError(function (arg0, arg1) {
    const ret = arg1.stack;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
}, arguments) };

export function __wbg_new_a220cf903aa02ca2() { return logError(function () {
    const ret = new Array();
    return ret;
}, arguments) };

export function __wbg_get_3baa728f9d58d3f6() { return logError(function (arg0, arg1) {
    const ret = arg0[arg1 >>> 0];
    return ret;
}, arguments) };

export function __wbg_set_673dda6c73d19609() { return logError(function (arg0, arg1, arg2) {
    arg0[arg1 >>> 0] = arg2;
}, arguments) };

export function __wbg_from_0791d740a9d37830() { return logError(function (arg0) {
    const ret = Array.from(arg0);
    return ret;
}, arguments) };

export function __wbg_isArray_8364a5371e9737d8() { return logError(function (arg0) {
    const ret = Array.isArray(arg0);
    _assertBoolean(ret);
    return ret;
}, arguments) };

export function __wbg_length_ae22078168b726f5() { return logError(function (arg0) {
    const ret = arg0.length;
    _assertNum(ret);
    return ret;
}, arguments) };

export function __wbg_instanceof_ArrayBuffer_61dfc3198373c902() { return logError(function (arg0) {
    let result;
    try {
        result = arg0 instanceof ArrayBuffer;
    } catch (_) {
        result = false;
    }
    const ret = result;
    _assertBoolean(ret);
    return ret;
}, arguments) };

export function __wbg_call_1084a111329e68ce() { return handleError(function (arg0, arg1) {
    const ret = arg0.call(arg1);
    return ret;
}, arguments) };

export function __wbg_instanceof_Map_763ce0e95960d55e() { return logError(function (arg0) {
    let result;
    try {
        result = arg0 instanceof Map;
    } catch (_) {
        result = false;
    }
    const ret = result;
    _assertBoolean(ret);
    return ret;
}, arguments) };

export function __wbg_next_f9cb570345655b9a() { return handleError(function (arg0) {
    const ret = arg0.next();
    return ret;
}, arguments) };

export function __wbg_next_de3e9db4440638b2() { return logError(function (arg0) {
    const ret = arg0.next;
    return ret;
}, arguments) };

export function __wbg_done_bfda7aa8f252b39f() { return logError(function (arg0) {
    const ret = arg0.done;
    _assertBoolean(ret);
    return ret;
}, arguments) };

export function __wbg_value_6d39332ab4788d86() { return logError(function (arg0) {
    const ret = arg0.value;
    return ret;
}, arguments) };

export function __wbg_isSafeInteger_7f1ed56200d90674() { return logError(function (arg0) {
    const ret = Number.isSafeInteger(arg0);
    _assertBoolean(ret);
    return ret;
}, arguments) };

export function __wbg_entries_7a0e06255456ebcd() { return logError(function (arg0) {
    const ret = Object.entries(arg0);
    return ret;
}, arguments) };

export function __wbg_new_525245e2b9901204() { return logError(function () {
    const ret = new Object();
    return ret;
}, arguments) };

export function __wbg_iterator_888179a48810a9fe() { return logError(function () {
    const ret = Symbol.iterator;
    return ret;
}, arguments) };

export function __wbg_instanceof_Uint8Array_247a91427532499e() { return logError(function (arg0) {
    let result;
    try {
        result = arg0 instanceof Uint8Array;
    } catch (_) {
        result = false;
    }
    const ret = result;
    _assertBoolean(ret);
    return ret;
}, arguments) };

export function __wbg_new_ea1883e1e5e86686() { return logError(function (arg0) {
    const ret = new Uint8Array(arg0);
    return ret;
}, arguments) };

export function __wbg_newwithbyteoffsetandlength_8a2cb9ca96b27ec9() { return logError(function (arg0, arg1, arg2) {
    const ret = new Uint8Array(arg0, arg1 >>> 0, arg2 >>> 0);
    return ret;
}, arguments) };

export function __wbg_length_8339fcf5d8ecd12e() { return logError(function (arg0) {
    const ret = arg0.length;
    _assertNum(ret);
    return ret;
}, arguments) };

export function __wbg_set_d1e79e2388520f18() { return logError(function (arg0, arg1, arg2) {
    arg0.set(arg1, arg2 >>> 0);
}, arguments) };

export function __wbindgen_is_function(arg0) {
    const ret = typeof(arg0) === 'function';
    _assertBoolean(ret);
    return ret;
};

export function __wbg_get_224d16597dbbfd96() { return handleError(function (arg0, arg1) {
    const ret = Reflect.get(arg0, arg1);
    return ret;
}, arguments) };

export function __wbg_buffer_b7b08af79b0b0974() { return logError(function (arg0) {
    const ret = arg0.buffer;
    return ret;
}, arguments) };

export function __wbindgen_debug_string(arg0, arg1) {
    const ret = debugString(arg1);
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
};

export function __wbindgen_bigint_get_as_i64(arg0, arg1) {
    const v = arg1;
    const ret = typeof(v) === 'bigint' ? v : undefined;
    if (!isLikeNone(ret)) {
        _assertBigInt(ret);
    }
    getDataViewMemory0().setBigInt64(arg0 + 8 * 1, isLikeNone(ret) ? BigInt(0) : ret, true);
    getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
};

export function __wbindgen_throw(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

export function __wbindgen_memory() {
    const ret = wasm.memory;
    return ret;
};

export function __wbindgen_init_externref_table() {
    const table = wasm.__wbindgen_export_2;
    const offset = table.grow(4);
    table.set(0, undefined);
    table.set(offset + 0, undefined);
    table.set(offset + 1, null);
    table.set(offset + 2, true);
    table.set(offset + 3, false);
    ;
};

