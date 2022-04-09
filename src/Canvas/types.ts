export interface CanvasInstance {
    element: HTMLElement;
    options: CanvasOptions;

    state: CanvasState;
    data: CanvasData;

    getData(): CanvasData;

    getSVG(options?: Partial<CanvasOptions>): string;

    getPNG(options?: Partial<CanvasOptions>): string;

    setEditable(editable: boolean): void;

    undo(): void;

    clear(): void;
}

export interface CanvasOptions {
    width?: number;
    height?: number;
    thickness?: number;
    color?: string;
    editable?: boolean;
}

export enum CanvasState {
    IDLE = 0,
    DRAWING = 1,
}

export type CanvasData = Array<CanvasLine>;

export type CanvasLine = Array<CanvasPoint>;

export interface CanvasPoint {
    x: number;
    y: number
}