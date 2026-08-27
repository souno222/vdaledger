"use client";

import { useEffect, useRef } from "react";

const vertexShader = `
attribute vec2 position;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShader = `
precision mediump float;

uniform vec2 resolution;
uniform vec2 pointer;
uniform float time;

float hash(vec2 value) {
  return fract(sin(dot(value, vec2(127.1, 311.7))) * 43758.5453123);
}

float softBand(float value, float center, float width) {
  float distanceValue = (value - center) / width;
  return exp(-distanceValue * distanceValue);
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  float aspect = resolution.x / max(resolution.y, 1.0);
  vec2 field = uv - 0.5;
  field.x *= aspect;

  vec2 pointerOffset = (pointer - 0.5) * vec2(aspect, 1.0) * 0.055;
  field += pointerOffset;

  float breath = 0.5 + 0.5 * sin(time * 0.28);
  float primaryRay = softBand(
    field.y + field.x * 0.34,
    0.07 + breath * 0.018,
    0.16
  );
  float secondaryRay = softBand(
    field.y - field.x * 0.18,
    -0.26 - breath * 0.012,
    0.22
  );
  float horizon = softBand(field.y, 0.03, 0.42);
  float bloom = exp(-dot(
    field - vec2(0.22, 0.02),
    field - vec2(0.22, 0.02)
  ) * (2.7 - breath * 0.25));
  float sparseGrain = (hash(floor(gl_FragCoord.xy * 0.5)) - 0.5) * 0.008;

  vec3 base = vec3(0.018, 0.060, 0.028);
  vec3 deepGreen = vec3(0.025, 0.205, 0.074);
  vec3 lime = vec3(0.784, 0.961, 0.259);
  vec3 color = base;
  color += deepGreen * secondaryRay * 0.34;
  color += lime * primaryRay * horizon * (0.11 + breath * 0.035);
  color += lime * bloom * (0.045 + breath * 0.018);
  color += sparseGrain;

  float vignette = 1.0 - smoothstep(0.34, 1.05, length(field));
  color *= 0.72 + vignette * 0.28;

  gl_FragColor = vec4(color, 1.0);
}
`;

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

export function WebglBackdrop() {
  const canvasReference = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasReference.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      powerPreference: "low-power",
      preserveDrawingBuffer: false,
    });
    if (!gl) return;

    const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexShader);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
    if (!vertex || !fragment) {
      if (vertex) gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      return;
    }

    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      return;
    }

    const buffer = gl.createBuffer();
    if (!buffer) {
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      return;
    }

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const position = gl.getAttribLocation(program, "position");
    const resolution = gl.getUniformLocation(program, "resolution");
    const pointer = gl.getUniformLocation(program, "pointer");
    const time = gl.getUniformLocation(program, "time");
    if (position < 0 || !resolution || !pointer || !time) {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      return;
    }

    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const targetPointer = { x: 0.5, y: 0.5 };
    const renderedPointer = { x: 0.5, y: 0.5 };
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduceMotion = motionPreference.matches;
    let animationFrame = 0;
    let start = performance.now();

    const resize = () => {
      const deviceScale = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.floor(canvas.clientWidth * deviceScale));
      const height = Math.max(1, Math.floor(canvas.clientHeight * deviceScale));
      if (canvas.width === width && canvas.height === height) return;

      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    };

    const draw = (now: number) => {
      resize();
      renderedPointer.x += (targetPointer.x - renderedPointer.x) * 0.025;
      renderedPointer.y += (targetPointer.y - renderedPointer.y) * 0.025;

      gl.uniform2f(resolution, canvas.width, canvas.height);
      gl.uniform2f(pointer, renderedPointer.x, renderedPointer.y);
      gl.uniform1f(time, reduceMotion ? 0 : (now - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      if (!reduceMotion && !document.hidden) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    const restart = () => {
      window.cancelAnimationFrame(animationFrame);
      if (document.hidden) return;

      if (reduceMotion) {
        draw(performance.now());
        return;
      }

      start = performance.now();
      animationFrame = window.requestAnimationFrame(draw);
    };

    const handlePointer = (event: PointerEvent) => {
      if (reduceMotion) return;
      targetPointer.x = Math.min(1, Math.max(0, event.clientX / window.innerWidth));
      targetPointer.y = Math.min(
        1,
        Math.max(0, 1 - event.clientY / window.innerHeight),
      );
    };

    const handleMotionPreference = (event: MediaQueryListEvent) => {
      reduceMotion = event.matches;
      if (reduceMotion) {
        targetPointer.x = 0.5;
        targetPointer.y = 0.5;
        renderedPointer.x = 0.5;
        renderedPointer.y = 0.5;
      }
      restart();
    };

    const handleVisibility = () => restart();
    const handleResize = () => {
      resize();
      if (reduceMotion) draw(performance.now());
    };

    window.addEventListener("pointermove", handlePointer, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);
    motionPreference.addEventListener("change", handleMotionPreference);
    restart();

    return () => {
      window.removeEventListener("pointermove", handlePointer);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      motionPreference.removeEventListener("change", handleMotionPreference);
      window.cancelAnimationFrame(animationFrame);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, []);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-[radial-gradient(circle_at_74%_22%,rgba(200,245,66,0.14),transparent_34%),linear-gradient(160deg,#06130a,#0a2a12_48%,#06130a)]">
      <canvas
        ref={canvasReference}
        className="pointer-events-none absolute inset-0 h-full w-full opacity-95"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(115deg,rgba(255,255,255,0.022)_0px,rgba(255,255,255,0.022)_1px,transparent_1px,transparent_56px)]"
        aria-hidden="true"
      />
    </div>
  );
}
