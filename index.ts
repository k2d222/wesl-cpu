import * as Wesl from "./wesl-web/wesl_web.js"

// The interface that exposes creation of the GPU, and optional interface to code coverage.
interface GPUProviderModule {
  // @returns a GPU with the given flags
  create(flags: string[]): GPU;
  // An optional interface to a CodeCoverageProvider
  coverage?: CodeCoverageProvider;
}

interface CodeCoverageProvider {
  // Starts collecting code coverage
  begin(): void;
  // Ends collecting of code coverage, returning the coverage data.
  // This data is opaque (implementation defined).
  end(): string;
}

function err(...msg: any[]) {
  console.error('\x1b[41m[ERROR]\x1b[0m', ...msg);
}

class Error {
  constructor(msg: string) {
    err(msg);
  }
}

const CPUSupportedLimits: GPUSupportedLimits = {
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
  maxComputeWorkgroupsPerDimension: 65535
}

class CPUQueue implements GPUQueue {
  __brand: "GPUQueue";
  label: string;

  _onWorkDone: Promise<undefined>

  constructor() {
    this.__brand = "GPUQueue"
    this.label = ""

    this._onWorkDone = Promise.resolve(undefined)
  }
  submit(commandBuffers: Iterable<GPUCommandBuffer>): undefined {
    // console.log('command buffers', commandBuffers)
    // throw new Error("Method not implemented: submit");
  }
  onSubmittedWorkDone(): Promise<undefined> {
    return this._onWorkDone
  }
  writeBuffer(buffer: GPUBuffer, bufferOffset: GPUSize64, data: BufferSource | SharedArrayBuffer, dataOffset?: GPUSize64, size?: GPUSize64): undefined {
    throw new Error("Method not implemented: writeBuffer");
  }
  writeTexture(destination: GPUTexelCopyTextureInfo, data: BufferSource | SharedArrayBuffer, dataLayout: GPUTexelCopyBufferLayout, size: GPUExtent3DStrict): undefined {
    throw new Error("Method not implemented: writeTexture");
  }
  copyExternalImageToTexture(source: GPUCopyExternalImageSourceInfo, destination: GPUCopyExternalImageDestInfo, copySize: GPUExtent3DStrict): undefined {
    throw new Error("Method not implemented: copyExternalImageToTexture");
  }
}

class CPUShaderModule implements GPUShaderModule {
  __brand: "GPUShaderModule";
  label: string;

  _descriptor: GPUShaderModuleDescriptor;
  _messages: GPUCompilationMessage[];

  constructor(descriptor: GPUShaderModuleDescriptor) {
    this.__brand = "GPUShaderModule";
    this.label = descriptor.label ?? "";

    this._descriptor = descriptor;
    this._messages = []

    try {
      let res = Wesl.compile({
        files: { "": descriptor.code },
        root: "",
        imports: false,
        condcomp: false,
        strip: false,
        features: {},
        eval: null
      })
    } catch (e) {
      const err = e as Wesl.Error;
      // TODO: diagnostic source location is incorrect
      const diagnostic = err.diagnostics[0]
      this._messages.push({
        __brand: "GPUCompilationMessage",
        message: err.message,
        type: "error",
        lineNum: 0,
        linePos: 0,
        offset: diagnostic.span.start,
        length: diagnostic.span.end - diagnostic.span.start
      })
    }
  }
  async getCompilationInfo(): Promise<GPUCompilationInfo> {
    return {
      __brand: "GPUCompilationInfo",
      messages: this._messages,
    }
  }
}

class CPUPipeline {
  label: string;

  _bindGroupLayouts: GPUBindGroupLayout[]

  constructor() {
    this.label = ""
    this._bindGroupLayouts = []
  }

  getBindGroupLayout(index: number): GPUBindGroupLayout {
    err('getBindGroupLayout ', index)
    return this._bindGroupLayouts[index]
  }
}

type CPUComputePipelineDescriptor = GPUComputePipelineDescriptor & { compute: { module: CPUShaderModule } }

class CPUComputePipeline extends CPUPipeline implements GPUComputePipeline {
  __brand: "GPUComputePipeline";

  _descriptor: CPUComputePipelineDescriptor

  constructor(descriptor: CPUComputePipelineDescriptor) {
    super()
    this.__brand = "GPUComputePipeline"
    this.label = descriptor.label ?? "";
    this._descriptor = descriptor
  }
}

class CPURenderPipeline extends CPUPipeline implements GPURenderPipeline {
  __brand: "GPURenderPipeline";

  _descriptor: GPURenderPipelineDescriptor

  constructor(descriptor: GPURenderPipelineDescriptor) {
    super()
    this.__brand = "GPURenderPipeline"
    this.label = descriptor.label ?? "";
    this._descriptor = descriptor
  }
}

class CPUBindGroup implements GPUBindGroup {
  __brand: "GPUBindGroup";
  label: string;

  _descriptor: GPUBindGroupDescriptor;

  constructor(descriptor: GPUBindGroupDescriptor) {
    this.__brand = "GPUBindGroup";
    this.label = descriptor.label ?? "";
    this._descriptor = descriptor;
  }
}

class CPUBindGroupLayout implements GPUBindGroupLayout {
  __brand: "GPUBindGroupLayout";
  label: string;

  _descriptor: GPUBindGroupLayoutDescriptor;

  constructor(descriptor: GPUBindGroupLayoutDescriptor) {
    this.__brand = "GPUBindGroupLayout";
    this.label = descriptor.label ?? "";
    this._descriptor = descriptor;
  }
}

class CPUPipelineLayout implements GPUPipelineLayout {
  __brand: "GPUPipelineLayout";
  label: string;

  _descriptor: GPUPipelineLayoutDescriptor;

  constructor(descriptor: GPUPipelineLayoutDescriptor) {
    this.__brand = "GPUPipelineLayout";
    this.label = descriptor.label ?? "";
    this._descriptor = descriptor;
  }
}

class CPUBuffer implements GPUBuffer {
  __brand: "GPUBuffer";
  label: string;
  size: number;
  usage: number;
  mapState: GPUBufferMapState;

  _descriptor: GPUBufferDescriptor;
  _buffer: ArrayBuffer;

  constructor(descriptor: GPUBufferDescriptor) {
    this.__brand = "GPUBuffer";
    this.label = descriptor.label ?? "";
    this.size = descriptor.size;
    this.usage = descriptor.usage;
    this.mapState = descriptor.mappedAtCreation ? "mapped" : "unmapped";
    this._buffer = new ArrayBuffer(this.size)

    this._descriptor = descriptor;
  }
  async mapAsync(mode: GPUMapModeFlags, offset?: GPUSize64, size?: GPUSize64): Promise<undefined> {
    this.mapState = "mapped";
    // console.log(mode, offset, size);
    // throw new Error("Method not implemented: mapAsync");
  }
  getMappedRange(offset?: GPUSize64, size?: GPUSize64): ArrayBuffer {
    const off = offset ?? 0
    const end = size ?? (this._buffer.byteLength - off)
    return this._buffer.slice(off, end)
  }
  unmap(): undefined {
  }
  destroy(): undefined {
  }
}

class CPUPassEncoder {
  label: string;

  _bindGroup?: {
    index: unknown,
    bindGroup: unknown,
    dynamicOffsetsData?: unknown,
    dynamicOffsetsDataStart?: unknown,
    dynamicOffsetsDataLength?: unknown
  }

  constructor() {
    this.label = ""
  }

  setBindGroup(index: unknown, bindGroup: unknown, dynamicOffsetsData?: unknown, dynamicOffsetsDataStart?: unknown, dynamicOffsetsDataLength?: unknown): undefined {
    this._bindGroup = {
      index,
      bindGroup,
      dynamicOffsetsData,
      dynamicOffsetsDataStart,
      dynamicOffsetsDataLength,
    }
  }
}

class CPUComputePassEncoder extends CPUPassEncoder implements GPUComputePassEncoder {
  __brand: "GPUComputePassEncoder";

  _descriptor?: GPUComputePassDescriptor;
  _pipeline?: CPUComputePipeline;

  constructor(descriptor?: GPUComputePassDescriptor) {
    super()
    this.__brand = "GPUComputePassEncoder";
    this.label = descriptor?.label ?? "";
    this._descriptor = descriptor;
  }
  setPipeline(pipeline: CPUComputePipeline): undefined {
    this._pipeline = pipeline;
  }
  dispatchWorkgroups(workgroupCountX: GPUSize32, workgroupCountY?: GPUSize32, workgroupCountZ?: GPUSize32): undefined {
    const entry = this._pipeline?._descriptor.compute.entryPoint;
    const code = this._pipeline?._descriptor.compute.module._descriptor.code;
    if (!entry || !code) {
      throw new Error("cannot dispatch with no entrypoint/code");
    }
    try {
      console.log('\x1b[42m[COMPUTE]\x1b[0m', code)
      Wesl.compile({
        files: { "": code },
        root: "",
        imports: false,
        condcomp: false,
        strip: false,
        features: {},
        eval: entry + '()',
      })
    } catch (e_) {
      const e = e_ as Wesl.Error;
      err(e);
      // console.log(e)
      // TODO: diagnostic source location is incorrect
      // const diagnostic = err.diagnostics[0]
      // this._messages.push({
      //   __brand: "GPUCompilationMessage",
      //   message: err.message,
      //   type: "error",
      //   lineNum: 0,
      //   linePos: 0,
      //   offset: diagnostic.span.start,
      //   length: diagnostic.span.end - diagnostic.span.start
      // })
    }
  }
  dispatchWorkgroupsIndirect(indirectBuffer: GPUBuffer, indirectOffset: GPUSize64): undefined {
    throw new Error("Method not implemented: dispatchWorkgroupsIndirect");
  }
  end(): undefined {
  }
  pushDebugGroup(groupLabel: string): undefined {
    throw new Error("Method not implemented: pushDebugGroup");
  }
  popDebugGroup(): undefined {
    throw new Error("Method not implemented: popDebugGroup");
  }
  insertDebugMarker(markerLabel: string): undefined {
    throw new Error("Method not implemented: insertDebugMarker");
  }
}

class CPURenderPassEncoder extends CPUPassEncoder implements GPURenderPassEncoder {
  __brand: "GPURenderPassEncoder";

  _descriptor: GPURenderPassDescriptor;
  _pipeline?: GPURenderPipeline;

  constructor(descriptor: GPURenderPassDescriptor) {
    super()
    this.__brand = "GPURenderPassEncoder";
    this.label = descriptor.label ?? "";
    this._descriptor = descriptor;
  }
  setViewport(x: number, y: number, width: number, height: number, minDepth: number, maxDepth: number): undefined {
    throw new Error("Method not implemented: setViewport");
  }
  setScissorRect(x: GPUIntegerCoordinate, y: GPUIntegerCoordinate, width: GPUIntegerCoordinate, height: GPUIntegerCoordinate): undefined {
    throw new Error("Method not implemented: setScissorRect");
  }
  setBlendConstant(color: GPUColor): undefined {
    throw new Error("Method not implemented: setBlendConstant");
  }
  setStencilReference(reference: GPUStencilValue): undefined {
    throw new Error("Method not implemented: setStencilReference");
  }
  beginOcclusionQuery(queryIndex: GPUSize32): undefined {
    throw new Error("Method not implemented: beginOcclusionQuery");
  }
  endOcclusionQuery(): undefined {
    throw new Error("Method not implemented: endOcclusionQuery");
  }
  executeBundles(bundles: Iterable<GPURenderBundle>): undefined {
    throw new Error("Method not implemented: executeBundles");
  }
  end(): undefined {
    throw new Error("Method not implemented: end");
  }
  pushDebugGroup(groupLabel: string): undefined {
    throw new Error("Method not implemented: pushDebugGroup");
  }
  popDebugGroup(): undefined {
    throw new Error("Method not implemented: popDebugGroup");
  }
  insertDebugMarker(markerLabel: string): undefined {
    throw new Error("Method not implemented: insertDebugMarker");
  }
  setPipeline(pipeline: GPURenderPipeline): undefined {
    this._pipeline = pipeline;
  }
  setIndexBuffer(buffer: GPUBuffer, indexFormat: GPUIndexFormat, offset?: GPUSize64, size?: GPUSize64): undefined {
    throw new Error("Method not implemented: setIndexBuffer");
  }
  setVertexBuffer(slot: GPUIndex32, buffer: GPUBuffer | null, offset?: GPUSize64, size?: GPUSize64): undefined {
    throw new Error("Method not implemented: setVertexBuffer");
  }
  draw(vertexCount: GPUSize32, instanceCount?: GPUSize32, firstVertex?: GPUSize32, firstInstance?: GPUSize32): undefined {
    throw new Error("Method not implemented: draw");
  }
  drawIndexed(indexCount: GPUSize32, instanceCount?: GPUSize32, firstIndex?: GPUSize32, baseVertex?: GPUSignedOffset32, firstInstance?: GPUSize32): undefined {
    throw new Error("Method not implemented: drawIndexed");
  }
  drawIndirect(indirectBuffer: GPUBuffer, indirectOffset: GPUSize64): undefined {
    throw new Error("Method not implemented: drawIndirect");
  }
  drawIndexedIndirect(indirectBuffer: GPUBuffer, indirectOffset: GPUSize64): undefined {
    throw new Error("Method not implemented: drawIndexedIndirect");
  }
}

class CPUCommandBuffer implements GPUCommandBuffer {
  __brand: "GPUCommandBuffer";
  label: string;

  _commands: any[];

  constructor() {
    this.__brand = "GPUCommandBuffer";
    this.label = "";

    this._commands = [];
  }
}

class CPUCommandEncoder implements GPUCommandEncoder {
  __brand: "GPUCommandEncoder";
  label: string;

  _descriptor?: GPUCommandEncoderDescriptor;
  _buffer: CPUCommandBuffer;

  constructor(descriptor?: GPUCommandEncoderDescriptor) {
    this.__brand = "GPUCommandEncoder";
    this.label = "";
    this._descriptor = descriptor;
    this._buffer = new CPUCommandBuffer();
  }
  beginRenderPass(descriptor: GPURenderPassDescriptor): GPURenderPassEncoder {
    const pass = new CPURenderPassEncoder(descriptor);
    this._buffer._commands.push(pass)
    return pass
  }
  beginComputePass(descriptor?: GPUComputePassDescriptor): GPUComputePassEncoder {
    const pass = new CPUComputePassEncoder(descriptor);
    this._buffer._commands.push(pass)
    return pass
  }
  copyBufferToBuffer(source: CPUBuffer, sourceOffset: GPUSize64, destination: CPUBuffer, destinationOffset: GPUSize64, size: GPUSize64): undefined {
    const src = new Uint8Array(source._buffer, sourceOffset, size);
    const dst = new Uint8Array(destination._buffer, destinationOffset);
    dst.set(src);
  }
  copyBufferToTexture(source: GPUTexelCopyBufferInfo, destination: GPUTexelCopyTextureInfo, copySize: GPUExtent3DStrict): undefined {
    throw new Error("Method not implemented: copyBufferToTexture");
  }
  copyTextureToBuffer(source: GPUTexelCopyTextureInfo, destination: GPUTexelCopyBufferInfo, copySize: GPUExtent3DStrict): undefined {
    throw new Error("Method not implemented: copyTextureToBuffer");
  }
  copyTextureToTexture(source: GPUTexelCopyTextureInfo, destination: GPUTexelCopyTextureInfo, copySize: GPUExtent3DStrict): undefined {
    throw new Error("Method not implemented: copyTextureToTexture");
  }
  clearBuffer(buffer: GPUBuffer, offset?: GPUSize64, size?: GPUSize64): undefined {
    throw new Error("Method not implemented: clearBuffer");
  }
  resolveQuerySet(querySet: GPUQuerySet, firstQuery: GPUSize32, queryCount: GPUSize32, destination: GPUBuffer, destinationOffset: GPUSize64): undefined {
    throw new Error("Method not implemented: resolveQuerySet");
  }
  finish(descriptor?: GPUCommandBufferDescriptor): GPUCommandBuffer {
    return this._buffer;
  }
  pushDebugGroup(groupLabel: string): undefined {
    throw new Error("Method not implemented: pushDebugGroup");
  }
  popDebugGroup(): undefined {
    throw new Error("Method not implemented: popDebugGroup");
  }
  insertDebugMarker(markerLabel: string): undefined {
    throw new Error("Method not implemented: insertDebugMarker");
  }
}

class CPUDevice implements GPUDevice {
  __brand: "GPUDevice";
  features: GPUSupportedFeatures;
  limits: GPUSupportedLimits;
  queue: GPUQueue;
  lost: Promise<GPUDeviceLostInfo>;
  onuncapturederror: ((this: GPUDevice, ev: GPUUncapturedErrorEvent) => any) | null;
  label: string;

  _errorScopes: { filter: GPUErrorFilter, error: GPUError | null }[]

  constructor() {
    this.__brand = "GPUDevice";
    this.features = new Set();
    this.limits = CPUSupportedLimits;
    this.queue = new CPUQueue();
    this.lost = new Promise(() => { });
    this.onuncapturederror = null
    this.label = ""

    this._errorScopes = []
  }
  destroy(): undefined {
  }
  createBuffer(descriptor: GPUBufferDescriptor): GPUBuffer {
    return new CPUBuffer(descriptor);
  }
  createTexture(descriptor: GPUTextureDescriptor): GPUTexture {
    throw new Error("Method not implemented: createTexture");
  }
  createSampler(descriptor?: GPUSamplerDescriptor): GPUSampler {
    throw new Error("Method not implemented: createSampler");
  }
  importExternalTexture(descriptor: GPUExternalTextureDescriptor): GPUExternalTexture {
    throw new Error("Method not implemented: importExternalTexture");
  }
  createBindGroupLayout(descriptor: GPUBindGroupLayoutDescriptor): GPUBindGroupLayout {
    return new CPUBindGroupLayout(descriptor)
  }
  createPipelineLayout(descriptor: GPUPipelineLayoutDescriptor): GPUPipelineLayout {
    return new CPUPipelineLayout(descriptor)
  }
  createBindGroup(descriptor: GPUBindGroupDescriptor): GPUBindGroup {
    return new CPUBindGroup(descriptor)
  }
  createShaderModule(descriptor: GPUShaderModuleDescriptor): GPUShaderModule {
    return new CPUShaderModule(descriptor);
  }
  createComputePipeline(descriptor: GPUComputePipelineDescriptor): GPUComputePipeline {
    return new CPUComputePipeline(descriptor)
  }
  createRenderPipeline(descriptor: GPURenderPipelineDescriptor): GPURenderPipeline {
    return new CPURenderPipeline(descriptor)
  }
  async createComputePipelineAsync(descriptor: GPUComputePipelineDescriptor): Promise<GPUComputePipeline> {
    return this.createComputePipeline(descriptor)
  }
  async createRenderPipelineAsync(descriptor: GPURenderPipelineDescriptor): Promise<GPURenderPipeline> {
    return this.createRenderPipeline(descriptor)
  }
  createCommandEncoder(descriptor?: GPUCommandEncoderDescriptor): GPUCommandEncoder {
    return new CPUCommandEncoder(descriptor)
  }
  createRenderBundleEncoder(descriptor: GPURenderBundleEncoderDescriptor): GPURenderBundleEncoder {
    throw new Error("Method not implemented: createRenderBundleEncoder");
  }
  createQuerySet(descriptor: GPUQuerySetDescriptor): GPUQuerySet {
    throw new Error("Method not implemented: createQuerySet");
  }
  pushErrorScope(filter: GPUErrorFilter): undefined {
    this._errorScopes.push({ filter, error: null })
  }
  async popErrorScope(): Promise<GPUError | null> {
    return this._errorScopes.pop()?.error ?? null
  }
  addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void {
    throw new Error("Method not implemented: addEventListener");
  }
  dispatchEvent(event: Event): boolean {
    throw new Error("Method not implemented: dispatchEvent");
  }
  removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean): void {
    throw new Error("Method not implemented: removeEventListener");
  }
}

const CPUAdapterInfo: GPUAdapterInfo = {
  __brand: "GPUAdapterInfo",
  vendor: "WESL",
  architecture: "",
  device: "CPU",
  description: "the WESL CPU executor",
}

class CPUAdapter implements GPUAdapter {
  __brand: "GPUAdapter";
  features: GPUSupportedFeatures;
  limits: GPUSupportedLimits;
  info: GPUAdapterInfo;
  isFallbackAdapter: boolean;

  constructor() {
    this.__brand = "GPUAdapter";
    this.features = new Set();
    this.limits = CPUSupportedLimits;
    this.info = CPUAdapterInfo;
    this.isFallbackAdapter = false;
  }

  async requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice> {
    return new CPUDevice();
  }
}

class CPU implements GPU {
  __brand: "GPU";
  wgslLanguageFeatures: WGSLLanguageFeatures;

  constructor() {
    this.__brand = "GPU";
    this.wgslLanguageFeatures = new Set();
  }
  async requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter | null> {
    return new CPUAdapter();
  }
  getPreferredCanvasFormat(): GPUTextureFormat {
    throw new Error("Method not implemented: getPreferredCanvasFormat");
  }
}

const mod: GPUProviderModule = {
  create: function(flags: string[]): GPU {
    return new CPU()
  }
}

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

// @ts-ignore
globalThis.GPUDevice = CPUDevice
export const create = mod.create;
