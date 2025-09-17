export { };

declare global {
    interface Window {
        mouse?: { x: number; y: number };
        camera?: { x: number; y: number };
        boosting?: boolean;
    }
}
