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
    this.toneMappingExposure = 1.12;
    this.physicallyCorrectLights = true;
    this.__treeoUltraPBR = true;
  }

  setPixelRatio(value) {
    return super.setPixelRatio(Math.min(Math.max(value || 1, 1), 2.5));
  }

  render(scene, camera) {
    if (!this.__treeoMaterialsUpgraded) {
      this.__treeoMaterialsUpgraded = true;
      scene.traverse(object => {
        if (!object.isMesh || !object.material) return;
        object.castShadow = true;
        object.receiveShadow = true;

        const upgrade = material => {
          if (!material || material.isMeshPhysicalMaterial) return material;
          if (!material.isMeshStandardMaterial) return material;
          const pbr = new THREE_REAL.MeshPhysicalMaterial();
          pbr.copy(material);
          pbr.clearcoat = 0.2;
          pbr.clearcoatRoughness = Math.max(0.08, Math.min(0.4, material.roughness ?? 0.5));
          pbr.specularIntensity = 1.0;
          pbr.envMapIntensity = 1.0;
          return pbr;
        };

        object.material = Array.isArray(object.material)
          ? object.material.map(upgrade)
          : upgrade(object.material);
      });

      scene.traverse(object => {
        if (!object.isDirectionalLight && !object.isSpotLight) return;
        object.castShadow = true;
        if (object.shadow?.mapSize) object.shadow.mapSize.set(4096, 4096);
        if (object.shadow?.camera) {
          object.shadow.camera.near = 0.1;
          object.shadow.camera.far = 350;
          object.shadow.camera.updateProjectionMatrix();
        }
      });
    }
    return super.render(scene, camera);
  }
}

const THREE = { ...THREE_REAL, WebGLRenderer: UltraWebGLRenderer };

export * from 'three-real';
export { UltraWebGLRenderer as WebGLRenderer };
export default THREE;
