import * as THREE_REAL from 'three-real';

const BaseRenderer = THREE_REAL.WebGLRenderer;

class UltraWebGLRenderer extends BaseRenderer {
  constructor(parameters = {}) {
    const canvas = parameters.canvas || document.createElement('canvas');
    let context = parameters.context;
    if (!context) {
      context = canvas.getContext('webgl2', {
        alpha: false,
        antialias: true,
        depth: true,
        stencil: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false
      });
    }
    if (!context) {
      throw new Error('TREEO requires WebGL 2. Your browser/GPU does not expose WebGL 2.');
    }
    super({
      ...parameters,
      canvas,
      context,
      antialias: true,
      powerPreference: 'high-performance',
      precision: 'highp'
    });
    this.setPixelRatio(Math.min(Math.max(window.devicePixelRatio || 1, 1), 2.5));
    this.shadowMap.enabled = true;
    this.shadowMap.type = THREE_REAL.PCFSoftShadowMap;
    this.outputColorSpace = THREE_REAL.SRGBColorSpace;
    this.toneMapping = THREE_REAL.ACESFilmicToneMapping;
    this.toneMappingExposure = 1.08;
    this.physicallyCorrectLights = true;
  }
}

const THREE = { ...THREE_REAL, WebGLRenderer: UltraWebGLRenderer };

export * from 'three-real';
export { UltraWebGLRenderer as WebGLRenderer };
export default THREE;
