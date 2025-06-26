/* tslint:disable */
/* eslint-disable */
export function init_log(level: string): void;
export function run(args: Command): any;
export type ManglerKind = "escape" | "hash" | "none";

export type Command = ({ command: "Compile" } & CompileOptions) | ({ command: "Eval" } & EvalOptions) | ({ command: "Exec" } & ExecOptions) | ({ command: "Dump" } & DumpOptions);

export interface CompileOptions {
    files: { [name: string]: string };
    root: string;
    mangler?: ManglerKind;
    sourcemap: boolean;
    imports: boolean;
    condcomp: boolean;
    generics: boolean;
    strip: boolean;
    lower: boolean;
    validate: boolean;
    naga: boolean;
    lazy: boolean;
    keep?: string[] | undefined;
    mangle_root: boolean;
    features: { [name: string]: boolean };
}

export type BindingType = "uniform" | "storage" | "read-only-storage" | "filtering" | "non-filtering" | "comparison" | "float" | "unfilterable-float" | "sint" | "uint" | "depth" | "write-only" | "read-write" | "read-only";

export interface Binding {
    group: number;
    binding: number;
    kind: BindingType;
    data: Uint8Array;
}

export interface EvalOptions extends CompileOptions {
    expression: string;
}

export interface ExecOptions extends CompileOptions {
    entrypoint: string;
    resources?: Binding[];
    overrides?: { [name: string]: string };
}

export interface DumpOptions {
    source: string;
}

export interface Diagnostic {
    file: string;
    span: { start: number; end: number };
    title: string;
}

export interface Error {
    source: string | undefined;
    message: string;
    diagnostics: Diagnostic[];
}

