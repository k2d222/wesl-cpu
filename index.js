"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = void 0;
const Wesl = require("./wesl-web/wesl_web.js");
// @ts-ignore
const DEBUG = process.env.DEBUG === "0" ? false : !!process.env.DEBUG;
if (DEBUG) {
    Wesl.init_log("Debug");
    console.log("wesl-cpu initializing");
}
else {
    Wesl.init_log("Info");
}
function displayError(kind, ...msg) {
    if (DEBUG) {
        console.error(`\x1b[41m[${kind}]\x1b[0m`, ...msg);
        debugger;
    }
}
function displayDebug(kind, ...msg) {
    if (DEBUG) {
        console.debug(`\x1b[42m[${kind}]\x1b[0m`, ...msg);
        debugger;
    }
}
class CPUPipelineError extends DOMException {
    __brand;
    reason;
    constructor(message, options = { reason: "internal" }) {
        super();
        this.__brand = "GPUPipelineError";
        this.reason = options.reason;
        displayError("GPUPipelineError", message);
    }
}
const Error = CPUPipelineError;
const CPUSupportedLimits = {
    __brand: "GPUSupportedLimits",
    maxTextureDimension1D: 8192,
    maxTextureDimension2D: 8292,
    maxTextureDimension3D: 2048,
    maxTextureArrayLayers: 256,
    maxBindGroups: 4,
    maxBindGroupsPlusVertexBuffers: 24,
    maxBindingsPerBindGroup: 640,
    maxDynamicUniformBuffersPerPipelineLayout: 8,
    maxDynamicStorageBuffersPerPipelineLayout: 4,
    maxSampledTexturesPerShaderStage: 16,
    maxSamplersPerShaderStage: 16,
    maxStorageBuffersPerShaderStage: 8,
    maxStorageTexturesPerShaderStage: 4,
    maxUniformBuffersPerShaderStage: 12,
    maxUniformBufferBindingSize: 65536,
    maxStorageBufferBindingSize: 134217728,
    minUniformBufferOffsetAlignment: 256,
    minStorageBufferOffsetAlignment: 256,
    maxVertexBuffers: 8,
    maxBufferSize: 268435456,
    maxVertexAttributes: 16,
    maxVertexBufferArrayStride: 2048,
    maxInterStageShaderVariables: 60,
    maxColorAttachments: 8,
    maxColorAttachmentBytesPerSample: 32,
    maxComputeWorkgroupStorageSize: 16384,
    maxComputeInvocationsPerWorkgroup: 256,
    maxComputeWorkgroupSizeX: 256,
    maxComputeWorkgroupSizeY: 256,
    maxComputeWorkgroupSizeZ: 64,
    maxComputeWorkgroupsPerDimension: 65535,
};
class CPUValidationError {
    __brand;
    message;
    constructor(message) {
        this.__brand = "GPUValidationError";
        this.message = message;
    }
}
class CPUInternalError {
    __brand;
    message;
    constructor(message) {
        this.__brand = "GPUInternalError";
        this.message = message;
    }
}
class CPUQueue {
    __brand;
    label;
    _onWorkDone;
    constructor() {
        this.__brand = "GPUQueue";
        this.label = "";
        this._onWorkDone = Promise.resolve(undefined);
    }
    submit(commandBuffers) {
        // console.log('command buffers', commandBuffers)
        // throw new Error("Method not implemented: submit")
    }
    onSubmittedWorkDone() {
        return this._onWorkDone;
    }
    writeBuffer(buffer, bufferOffset, data, dataOffset, size) {
        throw new Error("Method not implemented: writeBuffer");
    }
    writeTexture(destination, data, dataLayout, size) {
        throw new Error("Method not implemented: writeTexture");
    }
    copyExternalImageToTexture(source, destination, copySize) {
        throw new Error("Method not implemented: copyExternalImageToTexture");
    }
}
class CPUShaderModule {
    __brand;
    label;
    _descriptor;
    _messages;
    _device;
    constructor(descriptor, device) {
        this.__brand = "GPUShaderModule";
        this.label = descriptor.label ?? "";
        this._descriptor = descriptor;
        this._messages = [];
        this._device = device;
        try {
            let res = Wesl.run({
                command: "Compile",
                files: { "package::main": descriptor.code },
                root: "package::main",
                mangler: "none",
                sourcemap: true,
                imports: false,
                condcomp: false,
                generics: false,
                strip: false,
                lower: false,
                validate: false,
                naga: false,
                lazy: false,
                keep: undefined,
                mangle_root: false,
                features: {},
            });
            displayDebug("COMPILE", res);
        }
        catch (e) {
            const err = e;
            displayError("COMPILE", err.message, "\n", err.source);
            // TODO: diagnostic source location is incorrect
            // const diagnostic = err.diagnostics[0]
            this._messages.push({
                __brand: "GPUCompilationMessage",
                message: err.message,
                type: "error",
                lineNum: 0,
                linePos: 0,
                offset: 0,
                length: 0,
                // offset: diagnostic.span.start,
                // length: diagnostic.span.end - diagnostic.span.start
            });
            const scope = this._device._errorScopes.at(this._device._errorScopes.length - 1);
            if (scope && scope.filter === "validation") {
                scope.error = new GPUValidationError(err.message);
            }
        }
    }
    async getCompilationInfo() {
        return {
            __brand: "GPUCompilationInfo",
            messages: this._messages,
        };
    }
}
function getEntryPoint(wesl, stage) {
    for (const decl of wesl.global_declarations) {
        if (decl.node.Function) {
            const entryAttr = decl.node.Function.attributes.find((attr) => attr.node === stage);
            if (entryAttr) {
                return decl.node.Function;
            }
        }
    }
    return null;
}
function getStaticUsages(wesl, entryPoint) {
    const res = [];
    for (const decl of wesl.global_declarations) {
        if (decl.node.Declaration) {
            const entryAttr = decl.node.Declaration.attributes.find((attr) => attr.node.Group);
            if (entryAttr) {
                res.push(decl.node.Declaration);
            }
        }
    }
    return res;
    // TODO
    // const entry = wesl.global_declarations.find((decl: any) => decl.Function?.name === entryPoint)
    // for (const stat of entry.Function.body.statements) {
    // }
}
// algorithm reference: https://gpuweb.github.io/gpuweb/#default-pipeline-layout
function createDefaultPipelineLayout(device, code) {
    let groupCount = 0;
    let wesl;
    try {
        wesl = Wesl.run({
            command: "Dump",
            source: code,
        });
        displayDebug("DUMP", wesl);
    }
    catch (e) {
        let err = e;
        displayError("DUMP", err.message, "\n", err.source);
        throw new Error(err.message);
    }
    let groupDescs = Array.from({ length: device.limits.maxBindGroups }).map(() => ({ entries: [] }));
    const shaderStage = GPUShaderStage.COMPUTE;
    const entryPoint = getEntryPoint(wesl, "Compute");
    if (!entryPoint)
        throw new Error("entryPoint is null");
    const staticUsages = getStaticUsages(wesl, entryPoint);
    for (const resource of staticUsages) {
        const group = Number(resource.attributes.find((attr) => attr.node.Group).node.Group.node
            .Literal.AbstractInt);
        const binding = Number(resource.attributes.find((attr) => attr.node.Binding).node.Binding
            .node.Literal.AbstractInt);
        const entry = {
            binding: binding,
            visibility: shaderStage,
            // TODO steps 6-10
        };
        if (typeof resource.kind.Var === "object" &&
            "Storage" in resource.kind.Var) {
            const storage = resource.kind.Var.Storage;
            const bufferLayout = {
                minBindingSize: 0, // TODO
                type: !storage || storage === "Read" ? "read-only-storage" : "storage",
            };
            entry.buffer = bufferLayout;
        }
        groupCount = Math.max(groupCount, group + 1);
        if (false) {
            // TODO step 12
        }
        else {
            groupDescs[group].entries.push(entry);
        }
    }
    const groupLayouts = [];
    for (let i = 0; i < groupCount; ++i) {
        const groupDesc = groupDescs[i];
        const bindGroupLayout = device.createBindGroupLayout(groupDesc);
        // TODO step 6.2
        groupLayouts.push(bindGroupLayout);
    }
    const desc = { bindGroupLayouts: groupLayouts };
    return [device.createPipelineLayout(desc), wesl];
}
class CPUComputePipeline {
    __brand;
    label;
    _descriptor;
    constructor(descriptor) {
        this.__brand = "GPUComputePipeline";
        this.label = descriptor.label ?? "";
        this._descriptor = descriptor;
        if (descriptor.layout === "auto") {
            const device = descriptor.compute.module._device;
            const code = descriptor.compute.module._descriptor.code;
            const [layout, wesl] = createDefaultPipelineLayout(device, code);
            descriptor.layout = layout;
            if (!descriptor.compute.entryPoint) {
                const entry = getEntryPoint(wesl, "Compute");
                if (!entry)
                    throw new Error("no compute entry point in shader");
                descriptor.compute.entryPoint = entry.ident;
            }
        }
        else {
            throw new Error("todo");
        }
    }
    getBindGroupLayout(index) {
        const layout = this._descriptor.layout;
        const bg = layout._descriptor.bindGroupLayouts[index];
        if (!bg)
            throw new Error("no bind group layout " + index);
        return bg;
    }
}
class CPURenderPipeline {
    __brand;
    label;
    _descriptor;
    constructor(descriptor) {
        this.__brand = "GPURenderPipeline";
        this.label = descriptor.label ?? "";
        this._descriptor = descriptor;
    }
    getBindGroupLayout(index) {
        const layout = this._descriptor.layout;
        const bg = layout._descriptor.bindGroupLayouts[index];
        if (bg === null)
            throw new Error("no bind group layout " + index);
        return bg;
    }
}
class CPUBindGroup {
    __brand;
    label;
    _descriptor;
    constructor(descriptor) {
        this.__brand = "GPUBindGroup";
        this.label = descriptor.label ?? "";
        this._descriptor = descriptor;
    }
}
class CPUBindGroupLayout {
    __brand;
    label;
    _descriptor;
    constructor(descriptor) {
        this.__brand = "GPUBindGroupLayout";
        this.label = descriptor.label ?? "";
        this._descriptor = descriptor;
    }
}
class CPUPipelineLayout {
    __brand;
    label;
    _descriptor;
    constructor(descriptor) {
        this.__brand = "GPUPipelineLayout";
        this.label = descriptor.label ?? "";
        this._descriptor = descriptor;
    }
}
class CPUBuffer {
    __brand;
    label;
    size;
    usage;
    mapState;
    _descriptor;
    _buffer;
    _mappedRange;
    constructor(descriptor) {
        this.__brand = "GPUBuffer";
        this.label = descriptor.label ?? "";
        this.size = descriptor.size;
        this.usage = descriptor.usage;
        this.mapState = descriptor.mappedAtCreation ? "mapped" : "unmapped";
        this._buffer = new ArrayBuffer(this.size);
        this._descriptor = descriptor;
    }
    async mapAsync(mode, offset, size) {
        this.mapState = "mapped";
        // console.log(mode, offset, size)
        // throw new Error("Method not implemented: mapAsync")
    }
    getMappedRange(offset, size) {
        const off = offset ?? 0;
        const siz = size ?? this._buffer.byteLength - off;
        const buf = this._buffer.slice(off, off + siz);
        this._mappedRange = [buf, off];
        return buf;
    }
    unmap() {
        if (!this._mappedRange)
            throw new Error("unmap() called but GPUBuffer was not mapped");
        const [arr, off] = this._mappedRange;
        new Uint8Array(this._buffer).set(new Uint8Array(arr), off);
    }
    destroy() { }
}
class CPUPassEncoder {
    label;
    _bindGroups;
    constructor() {
        this.label = "";
        this._bindGroups = [];
    }
    setBindGroup(index, bindGroup, dynamicOffsetsData, dynamicOffsetsDataStart, dynamicOffsetsDataLength) {
        this._bindGroups[index] = {
            index,
            bindGroup,
            dynamicOffsetsData,
            dynamicOffsetsDataStart,
            dynamicOffsetsDataLength,
        };
    }
}
class CPUComputePassEncoder extends CPUPassEncoder {
    __brand;
    _descriptor;
    _pipeline;
    constructor(descriptor) {
        super();
        this.__brand = "GPUComputePassEncoder";
        this.label = descriptor?.label ?? "";
        this._descriptor = descriptor;
    }
    setPipeline(pipeline) {
        this._pipeline = pipeline;
    }
    dispatchWorkgroups(workgroupCountX, workgroupCountY, workgroupCountZ) {
        if (!this._pipeline)
            throw new Error("no pipeline set");
        const entry = this._pipeline._descriptor.compute.entryPoint;
        const code = this._pipeline._descriptor.compute.module._descriptor.code;
        if (!entry || !code) {
            console.error("compute GpuProgrammableStage:", this._pipeline._descriptor.compute);
            debugger;
            throw new Error("cannot dispatch with no entrypoint/code");
        }
        let bindings = [];
        for (const g of this._bindGroups) {
            // TODO dynamic offsets (g.dynamic*)
            if (g.bindGroup) {
                for (const e of g.bindGroup._descriptor.entries) {
                    if ("buffer" in e.resource) {
                        const buf = e.resource.buffer;
                        const off = e.resource.offset ?? 0;
                        const end = e.resource.size ?? buf._buffer.byteLength - off;
                        const data = new Uint8Array(buf._buffer, off, end);
                        const usage = e.resource.buffer.usage;
                        const groupLayout = this._pipeline.getBindGroupLayout(g.index);
                        const layout = groupLayout._descriptor.entries.find((b) => b.binding === e.binding);
                        if (!layout)
                            throw new Error("no binding layout " + e.binding);
                        let kind;
                        if (layout.buffer) {
                            if (!layout.buffer.type)
                                throw new Error("no buffer type");
                            kind = layout.buffer.type;
                        }
                        else if (layout.externalTexture ||
                            layout.sampler ||
                            layout.storageTexture ||
                            layout.texture) {
                            throw new Error("TODO binding type");
                        }
                        else {
                            kind = "uniform";
                        }
                        bindings.push({
                            group: g.index,
                            binding: e.binding,
                            kind: kind,
                            data: data, // TODO why is the uint8array not supported?
                        });
                    }
                }
            }
        }
        try {
            let newBindings = Wesl.run({
                command: "Exec",
                files: { "package::main": code },
                root: "package::main",
                mangler: "none",
                sourcemap: true,
                imports: false,
                condcomp: false,
                generics: false,
                strip: false,
                lower: false,
                validate: false,
                naga: false,
                lazy: false,
                keep: undefined,
                mangle_root: false,
                features: {},
                entrypoint: entry,
                resources: bindings,
                overrides: {},
            });
            displayDebug("EXEC", newBindings);
            for (const g of this._bindGroups) {
                // TODO dynamic offsets (g.dynamic*)
                if (g.bindGroup) {
                    for (const e of g.bindGroup._descriptor.entries) {
                        if ("buffer" in e.resource) {
                            const buf = e.resource.buffer;
                            const newBuf = newBindings.find((b) => b.group === g.index && b.binding === e.binding)?.data;
                            if (!newBuf) {
                                throw new Error(`wesl did not return binding g=${g.index} b=${e.binding}`);
                            }
                            const off = e.resource.offset ?? 0;
                            const end = e.resource.size ?? buf._buffer.byteLength - off;
                            if (end !== newBuf.byteLength) {
                                console.error("binding changed size, size: ", end, "offset: ", off, ", old binding:", buf._buffer, "new binding:", newBuf.buffer);
                                // throw new Error("binding changed size");
                            }
                            new Uint8Array(buf._buffer, off, end).set(newBuf);
                        }
                    }
                }
            }
        }
        catch (e) {
            const err = e;
            displayError("EXEC", err.message, "\n", err.source);
            const device = this._pipeline._descriptor.compute.module._device;
            const scope = device._errorScopes.at(device._errorScopes.length - 1);
            if (scope && scope.filter === "internal") {
                scope.error = new GPUInternalError(err.message);
            }
        }
    }
    dispatchWorkgroupsIndirect(indirectBuffer, indirectOffset) {
        throw new Error("Method not implemented: dispatchWorkgroupsIndirect");
    }
    end() { }
    pushDebugGroup(groupLabel) {
        throw new Error("Method not implemented: pushDebugGroup");
    }
    popDebugGroup() {
        throw new Error("Method not implemented: popDebugGroup");
    }
    insertDebugMarker(markerLabel) {
        throw new Error("Method not implemented: insertDebugMarker");
    }
}
class CPURenderPassEncoder extends CPUPassEncoder {
    __brand;
    _descriptor;
    _pipeline;
    constructor(descriptor) {
        super();
        this.__brand = "GPURenderPassEncoder";
        this.label = descriptor.label ?? "";
        this._descriptor = descriptor;
    }
    setViewport(x, y, width, height, minDepth, maxDepth) {
        throw new Error("Method not implemented: setViewport");
    }
    setScissorRect(x, y, width, height) {
        throw new Error("Method not implemented: setScissorRect");
    }
    setBlendConstant(color) {
        throw new Error("Method not implemented: setBlendConstant");
    }
    setStencilReference(reference) {
        throw new Error("Method not implemented: setStencilReference");
    }
    beginOcclusionQuery(queryIndex) {
        throw new Error("Method not implemented: beginOcclusionQuery");
    }
    endOcclusionQuery() {
        throw new Error("Method not implemented: endOcclusionQuery");
    }
    executeBundles(bundles) {
        throw new Error("Method not implemented: executeBundles");
    }
    end() {
        throw new Error("Method not implemented: end");
    }
    pushDebugGroup(groupLabel) {
        throw new Error("Method not implemented: pushDebugGroup");
    }
    popDebugGroup() {
        throw new Error("Method not implemented: popDebugGroup");
    }
    insertDebugMarker(markerLabel) {
        throw new Error("Method not implemented: insertDebugMarker");
    }
    setPipeline(pipeline) {
        this._pipeline = pipeline;
    }
    setIndexBuffer(buffer, indexFormat, offset, size) {
        throw new Error("Method not implemented: setIndexBuffer");
    }
    setVertexBuffer(slot, buffer, offset, size) {
        throw new Error("Method not implemented: setVertexBuffer");
    }
    draw(vertexCount, instanceCount, firstVertex, firstInstance) {
        throw new Error("Method not implemented: draw");
    }
    drawIndexed(indexCount, instanceCount, firstIndex, baseVertex, firstInstance) {
        throw new Error("Method not implemented: drawIndexed");
    }
    drawIndirect(indirectBuffer, indirectOffset) {
        throw new Error("Method not implemented: drawIndirect");
    }
    drawIndexedIndirect(indirectBuffer, indirectOffset) {
        throw new Error("Method not implemented: drawIndexedIndirect");
    }
}
class CPUCommandBuffer {
    __brand;
    label;
    _commands;
    constructor() {
        this.__brand = "GPUCommandBuffer";
        this.label = "";
        this._commands = [];
    }
}
class CPUCommandEncoder {
    __brand;
    label;
    _descriptor;
    _buffer;
    constructor(descriptor) {
        this.__brand = "GPUCommandEncoder";
        this.label = "";
        this._descriptor = descriptor;
        this._buffer = new CPUCommandBuffer();
    }
    beginRenderPass(descriptor) {
        const pass = new CPURenderPassEncoder(descriptor);
        this._buffer._commands.push(pass);
        return pass;
    }
    beginComputePass(descriptor) {
        const pass = new CPUComputePassEncoder(descriptor);
        this._buffer._commands.push(pass);
        return pass;
    }
    copyBufferToBuffer(source, sourceOffset, destination, destinationOffset, size) {
        const src = new Uint8Array(source._buffer, sourceOffset, size);
        const dst = new Uint8Array(destination._buffer, destinationOffset);
        dst.set(src);
    }
    copyBufferToTexture(source, destination, copySize) {
        throw new Error("Method not implemented: copyBufferToTexture");
    }
    copyTextureToBuffer(source, destination, copySize) {
        throw new Error("Method not implemented: copyTextureToBuffer");
    }
    copyTextureToTexture(source, destination, copySize) {
        throw new Error("Method not implemented: copyTextureToTexture");
    }
    clearBuffer(buffer, offset, size) {
        throw new Error("Method not implemented: clearBuffer");
    }
    resolveQuerySet(querySet, firstQuery, queryCount, destination, destinationOffset) {
        throw new Error("Method not implemented: resolveQuerySet");
    }
    finish(descriptor) {
        return this._buffer;
    }
    pushDebugGroup(groupLabel) {
        throw new Error("Method not implemented: pushDebugGroup");
    }
    popDebugGroup() {
        throw new Error("Method not implemented: popDebugGroup");
    }
    insertDebugMarker(markerLabel) {
        throw new Error("Method not implemented: insertDebugMarker");
    }
}
class CPUDevice {
    __brand;
    features;
    limits;
    queue;
    lost;
    onuncapturederror;
    label;
    _errorScopes;
    constructor() {
        this.__brand = "GPUDevice";
        this.features = new Set([
            "depth-clip-control",
            "depth32float-stencil8",
            "texture-compression-bc",
            "texture-compression-bc-sliced-3d",
            "texture-compression-etc2",
            "texture-compression-astc",
            "texture-compression-astc-sliced-3d",
            "timestamp-query",
            "indirect-first-instance",
            "shader-f16",
            "rg11b10ufloat-renderable",
            "bgra8unorm-storage",
            "float32-filterable",
            "float32-blendable",
            "clip-distances",
            "dual-source-blending",
        ]);
        this.limits = CPUSupportedLimits;
        this.queue = new CPUQueue();
        this.lost = new Promise(() => { });
        this.onuncapturederror = null;
        this.label = "";
        this._errorScopes = [];
    }
    destroy() { }
    createBuffer(descriptor) {
        return new CPUBuffer(descriptor);
    }
    createTexture(descriptor) {
        throw new Error("Method not implemented: createTexture");
    }
    createSampler(descriptor) {
        throw new Error("Method not implemented: createSampler");
    }
    importExternalTexture(descriptor) {
        throw new Error("Method not implemented: importExternalTexture");
    }
    createBindGroupLayout(descriptor) {
        return new CPUBindGroupLayout(descriptor);
    }
    createPipelineLayout(descriptor) {
        return new CPUPipelineLayout(descriptor);
    }
    createBindGroup(descriptor) {
        return new CPUBindGroup(descriptor);
    }
    createShaderModule(descriptor) {
        return new CPUShaderModule(descriptor, this);
    }
    createComputePipeline(descriptor) {
        return new CPUComputePipeline(descriptor);
    }
    createRenderPipeline(descriptor) {
        return new CPURenderPipeline(descriptor);
    }
    async createComputePipelineAsync(descriptor) {
        return this.createComputePipeline(descriptor);
    }
    async createRenderPipelineAsync(descriptor) {
        return this.createRenderPipeline(descriptor);
    }
    createCommandEncoder(descriptor) {
        return new CPUCommandEncoder(descriptor);
    }
    createRenderBundleEncoder(descriptor) {
        throw new Error("Method not implemented: createRenderBundleEncoder");
    }
    createQuerySet(descriptor) {
        throw new Error("Method not implemented: createQuerySet");
    }
    pushErrorScope(filter) {
        this._errorScopes.push({ filter, error: null });
    }
    async popErrorScope() {
        const scope = this._errorScopes.pop();
        return scope?.error ?? null;
    }
    addEventListener(type, callback, options) {
        throw new Error("Method not implemented: addEventListener");
    }
    dispatchEvent(event) {
        throw new Error("Method not implemented: dispatchEvent");
    }
    removeEventListener(type, callback, options) {
        throw new Error("Method not implemented: removeEventListener");
    }
}
const CPUAdapterInfo = {
    __brand: "GPUAdapterInfo",
    vendor: "WESL",
    architecture: "",
    device: "CPU",
    description: "the WESL CPU executor",
};
class CPUAdapter {
    __brand;
    features;
    limits;
    info;
    isFallbackAdapter;
    constructor() {
        this.__brand = "GPUAdapter";
        this.features = new Set([
            "depth-clip-control",
            "depth32float-stencil8",
            "texture-compression-bc",
            "texture-compression-bc-sliced-3d",
            "texture-compression-etc2",
            "texture-compression-astc",
            "texture-compression-astc-sliced-3d",
            "timestamp-query",
            "indirect-first-instance",
            "shader-f16",
            "rg11b10ufloat-renderable",
            "bgra8unorm-storage",
            "float32-filterable",
            "float32-blendable",
            "clip-distances",
            "dual-source-blending",
        ]);
        this.limits = CPUSupportedLimits;
        this.info = CPUAdapterInfo;
        this.isFallbackAdapter = false;
    }
    async requestDevice(descriptor) {
        return new CPUDevice();
    }
}
class CPU {
    __brand;
    wgslLanguageFeatures;
    constructor() {
        this.__brand = "GPU";
        this.wgslLanguageFeatures = new Set([
            "shader-f16",
            "clip-distances",
            "dual-source-blending",
        ]);
    }
    async requestAdapter(options) {
        return new CPUAdapter();
    }
    getPreferredCanvasFormat() {
        throw new Error("Method not implemented: getPreferredCanvasFormat");
    }
}
const mod = {
    create: function (flags) {
        return new CPU();
    },
};
globalThis.GPUBufferUsage = {
    MAP_READ: 1,
    MAP_WRITE: 2,
    COPY_SRC: 4,
    COPY_DST: 8,
    INDEX: 16,
    VERTEX: 32,
    UNIFORM: 64,
    STORAGE: 128,
    INDIRECT: 256,
    QUERY_RESOLVE: 512,
};
globalThis.GPUColorWrite = {
    RED: 1,
    GREEN: 2,
    BLUE: 4,
    ALPHA: 8,
    ALL: 15,
};
globalThis.GPUMapMode = {
    READ: 1,
    WRITE: 2,
};
globalThis.GPUShaderStage = {
    VERTEX: 1,
    FRAGMENT: 2,
    COMPUTE: 4,
};
globalThis.GPUTextureUsage = {
    COPY_SRC: 1,
    COPY_DST: 2,
    TEXTURE_BINDING: 4,
    STORAGE_BINDING: 8,
    RENDER_ATTACHMENT: 16,
};
globalThis.GPUShaderStage = {
    VERTEX: 1,
    FRAGMENT: 2,
    COMPUTE: 4,
};
globalThis.GPUPipelineError = CPUPipelineError;
// @ts-ignore
globalThis.GPUDevice = CPUDevice;
globalThis.GPUValidationError = CPUValidationError;
globalThis.GPUInternalError = CPUInternalError;
exports.create = mod.create;
