import {CanvasData, CanvasInstance, CanvasLine, CanvasOptions, CanvasState} from "./types";

const DEFAULT_CANVAS_OPTIONS: CanvasOptions = {
    width: 240,
    height: 192,
    thickness: 2,
    color: "black",
    editable: true,
};
const DEFAULT_CANVAS_UPDATE_INTERVAL = 1000 / 60;
const DEFAULT_SVG_NAMESPACE_URI = "http://www.w3.org/2000/svg";

export default (element: HTMLElement, options?: CanvasOptions): CanvasInstance => {

    const mergedOptions: CanvasOptions = {...DEFAULT_CANVAS_OPTIONS, ...options};
    const initialState = CanvasState.IDLE;
    const initialData: CanvasData = [];

    validateElement(element);
    validateOptions(mergedOptions);

    const instance: CanvasInstance = {
        element,
        options: mergedOptions,
        state: initialState,
        data: initialData,
        getData,
        getSVG,
        getPNG,
        setEditable,
        clear,
        undo,
    };

    let svgElement: SVGSVGElement = null;
    let renderLoopId: ReturnType<typeof setInterval> = null;

    initializeCanvasRender();
    bindCanvasEventListeners();
    updateCanvasDimensions();
    updateCanvasRender();

    function validateElement(element: HTMLElement): void {
        if (!element) {
            throw new Error("Element can't be null or undefined.");
        }
    }

    function validateOptions(options: CanvasOptions): void {
        if (typeof options.width !== "number" || typeof options.height !== "number") {
            throw new Error("The canvas width and height shall be valid numbers.");
        }

        if (options.width <= 0 || options.height <= 0) {
            throw new Error("The canvas width and height shall be greater than 0;");
        }
    }

    function getData(): CanvasData {
        return instance.data;
    }

    function getSVG(): string {
        return "";
    }

    function getPNG(): string {
        return "";
    }

    function setEditable(editable: boolean): void {
        instance.options.editable = editable;
    }

    function undo(): void {
        instance.data.pop();
    }

    function clear(): void {
        instance.data = [];
    }

    function initializeCanvasRender(): void {
        svgElement = document.createElementNS(DEFAULT_SVG_NAMESPACE_URI, "svg");
        element.appendChild(svgElement);
    }

    function bindCanvasEventListeners(): void {
        window.addEventListener("mousedown", handleDrawingStart);
        window.addEventListener("mousemove", handleDrawingMove);
        window.addEventListener("mouseup", handleDrawingEnd);
    }

    function updateCanvasDimensions(): void {
        element.style.width = instance.options.width + "px";
        element.style.height = instance.options.height + "px";
        svgElement.setAttribute("viewBox", `0 0 ${instance.options.width} ${instance.options.height}`);
    }

    function handleDrawingStart(event: MouseEvent): void {
        if (isEventWithinCanvas(event)) {
            instance.state = CanvasState.DRAWING;

            createCanvasLine();
            createCanvasPointFromEvent(event);
            startRenderLoop();
        }
    }

    function handleDrawingMove(event: MouseEvent): void {
        if (isEventWithinCanvas(event) && instance.state === CanvasState.DRAWING) {
            createCanvasPointFromEvent(event);
        }
    }

    function handleDrawingEnd(): void {
        instance.state = CanvasState.IDLE;
        stopRenderLoop();
    }

    function isEventWithinCanvas(event: MouseEvent): boolean {
        const {top, bottom, left, right} = element.getBoundingClientRect();
        return event.x > left && event.x < right && event.y > top && event.y < bottom;
    }

    function createCanvasLine(): void {
        instance.data.push([]);

        const lineElement = document.createElementNS(DEFAULT_SVG_NAMESPACE_URI, "path");
        lineElement.setAttribute("stroke", instance.options.color);
        lineElement.setAttribute("stroke-width", instance.options.thickness + "px");
        lineElement.setAttribute("stroke-linecap", "round");
        lineElement.setAttribute("stroke-linejoin", "round");
        lineElement.setAttribute("fill", "none");
        svgElement.appendChild(lineElement);
    }

    function createCanvasPointFromEvent(event: MouseEvent): void {
        const {top, left} = element.getBoundingClientRect();
        const newPoint = {
            x: event.x - left,
            y: event.y - top
        };

        const latestLine = instance.data[instance.data.length - 1];
        latestLine.push(newPoint);
    }

    function startRenderLoop() {
        renderLoopId = setInterval(() => {
            updateCanvasRender();
        }, DEFAULT_CANVAS_UPDATE_INTERVAL);
    }

    function stopRenderLoop() {
        clearInterval(renderLoopId);
    }

    function updateCanvasRender() {
        instance.data.forEach(updateCanvasLineRender);
    }

    function updateCanvasLineRender(canvasLine: CanvasLine, idx: number) {
        const lineElement = svgElement.querySelector(`path:nth-child(${idx + 1})`);

        if (lineElement) {
            const [head, ...tail] = canvasLine;
            const pathHead = `M ${head.x} ${head.y} L ${head.x} ${head.y}`;
            const pathTail = tail.map(({x, y}) => `L ${x} ${y}`).join(" ");
            const path = `${pathHead} ${pathTail}`;

            lineElement.setAttribute("d", path);
        }
    }

    return instance;
}