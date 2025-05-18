declare module 'roughjs' {
  export interface RoughCanvas {
    curve(
      points: [number, number][],
      options?: {
        stroke?: string;
        strokeWidth?: number;
        roughness?: number;
        bowing?: number;
      }
    ): void;
    rectangle(
      x: number,
      y: number,
      width: number,
      height: number,
      options?: {
        stroke?: string;
        strokeWidth?: number;
        roughness?: number;
        fillStyle?: string;
        fill?: string;
      }
    ): void;
  }

  interface RoughFactory {
    canvas(canvas: HTMLCanvasElement): RoughCanvas;
  }

  const rough: RoughFactory;
  export default rough;
} 