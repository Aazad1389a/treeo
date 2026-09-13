import * as THREE_REAL from 'three-real';

const BaseRenderer = THREE_REAL.WebGLRenderer;

function makeEnvironment(renderer) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, '#071323');
  g.addColorStop(0.28, '#315d86');
  g.addColorStop(0.52, '#9bb6c7');
  g.addColorStop(0.7, '#d7c39c');
  g.addColorStop(1, '#26301f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const sun = ctx.createRadialGradient(780, 150, 4, 780, 150, 100);
  sun.addColorStop(0, 'rgba(255,245,205,1)');
  sun.addColorStop(0.18, 'rgba(255,225,150,.55)');
  sun.addColorStop(1, 'rgba(255,225,150,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE_REAL.CanvasTexture(canvas);
  texture.mapping = THREE_REAL.EquirectangularReflectionMapping;
  texture.colorSpace = THREE_REAL.SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const pmrem = new THREE_REAL.PMREMGenerator(renderer);
  const env = pmrem.fromEquirectangular(texture).texture;
  texture.dispose();
  pmrem.dispose();
  return env;
}

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
    this.__treeoUltraPBR = true;
    this.__treeoEnvironment = null;
  }

  setPixelRatio(value) {
    return super.setPixelRatio(Math.min(Math.max(value || 1, 1), 2.5));
  }

  render(scene, camera) {
    if (!this.__treeoMaterialsUpgraded) {
      this.__treeoMaterialsUpgraded = true;
      this.__treeoEnvironment = makeEnvironment(this);

      if (!scene.environment) scene.environment = this.__treeoEnvironment;
      if (!scene.fog) scene.fog = new THREE_REAL.FogExp2(0x91a38a, 0.0027);

      scene.traverse(object => {
        if (!object.isMesh || !object.material) return;
        object.castShadow = true;
        object.receiveShadow = true;

        const upgrade = material => {
          if (!material || material.isMeshPhysicalMaterial) return material;
          if (!material.isMeshStandardMaterial) return material;
          const pbr = new THREE_REAL.MeshPhysicalMaterial();
          pbr.copy(material);
          pbr.clearcoat = 0.18;
          pbr.clearcoatRoughness = Math.max(0.08, Math.min(0.42, material.roughness ?? 0.5));
          pbr.specularIntensity = 1.0;
          pbr.envMapIntensity = 1.15;
          pbr.ior = 1.5;
          return pbr;
        };

        object.material = Array.isArray(object.material)
          ? object.material.map(upgrade)
          : upgrade(object.material);

        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          if (!material) continue;
          for (const key of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap']) {
            const texture = material[key];
            if (texture) texture.anisotropy = Math.min(8, this.capabilities.getMaxAnisotropy());
          }
        }
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

  dispose() {
    if (this.__treeoEnvironment) this.__treeoEnvironment.dispose();
    super.dispose();
  }
}

const THREE = { ...THREE_REAL, WebGLRenderer: UltraWebGLRenderer };

export * from 'three-real';
export { UltraWebGLRenderer as WebGLRenderer };
export default THREE;
