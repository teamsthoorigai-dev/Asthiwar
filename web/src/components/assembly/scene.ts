/**
 * Fixed-camera, scroll-driven architectural assembly.
 *
 * The supplied elevation is a single rendered view rather than a volumetric
 * model, so the scene uses the colour-accurate cut-outs as real Three.js
 * planes. A small structural frame sits behind them during the second stage,
 * and the untouched reference is blended in for the final landing. That keeps
 * the movement spatial while making the completed building visually exact.
 */
import {
  BoxGeometry,
  Group,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  NoToneMapping,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  WebGLRenderer,
  type BufferGeometry,
  type Material,
} from 'three';

const ARTBOARD = { width: 1024, height: 750 } as const;
const CAMERA_BOUNDS = { width: 1100, height: 820 } as const;

type LayerDefinition = {
  source: string;
  x: number;
  y: number;
  width: number;
  height: number;
  explodedY: number;
  stage: number;
  delay: number;
  tilt: number;
};

const LAYERS: ReadonlyArray<LayerDefinition> = [
  {
    source: '/assembly-layers/01-ground-foundations.webp',
    x: 0,
    y: 520,
    width: 1024,
    height: 229,
    explodedY: 520,
    stage: 0,
    delay: 0,
    tilt: 0,
  },
  {
    source: '/assembly-layers/02-structure.webp',
    x: 65,
    y: 435,
    width: 911,
    height: 161,
    explodedY: 304,
    stage: 1,
    delay: 0.34,
    tilt: -0.012,
  },
  {
    source: '/assembly-layers/03-envelope.webp',
    x: 55,
    y: 165,
    width: 916,
    height: 301,
    explodedY: -62,
    stage: 2,
    delay: 0,
    tilt: 0.014,
  },
  {
    source: '/assembly-layers/04-interior-services.webp',
    x: 172,
    y: 200,
    width: 761,
    height: 342,
    explodedY: -112,
    stage: 2,
    delay: 0.34,
    tilt: -0.016,
  },
  {
    source: '/assembly-layers/05-roof-landscape.webp',
    x: 55,
    y: 101,
    width: 911,
    height: 405,
    explodedY: -196,
    stage: 3,
    delay: 0.08,
    tilt: 0.012,
  },
] as const;

// Motion occupies most of each quarter, leaving a short pause after each
// section lands. The pause is important: it makes the scroll read as a build
// sequence instead of one continuous image translation.
export const STAGE_WINDOWS: ReadonlyArray<readonly [number, number]> = [
  [0, 0.12],
  [0.18, 0.39],
  [0.43, 0.68],
  [0.72, 0.9],
];

type TexturedLayer = {
  mesh: Mesh<PlaneGeometry, MeshBasicMaterial>;
  material: MeshBasicMaterial;
  definition: LayerDefinition;
  dockedWorldY: number;
  explodedWorldY: number;
  restZ: number;
};

type Pillar = {
  mesh: Mesh<BoxGeometry, MeshBasicMaterial>;
  baseY: number;
  height: number;
  delay: number;
};

export type AssemblyScene = {
  ready: Promise<void>;
  render: (progress: number) => void;
  resize: (width: number, height: number) => void;
  dispose: () => void;
};

const clamp = (value: number, minimum = 0, maximum = 1) =>
  value < minimum ? minimum : value > maximum ? maximum : value;

const span = (progress: number, start: number, end: number) =>
  clamp((progress - start) / Math.max(end - start, Number.EPSILON));

const outQuint = (progress: number) => 1 - Math.pow(1 - progress, 5);
const mix = (from: number, to: number, amount: number) => from + (to - from) * amount;

function worldX(screenX: number) {
  return screenX - ARTBOARD.width / 2;
}

function worldY(screenY: number) {
  return ARTBOARD.height / 2 - screenY;
}

function configureTexture(texture: Texture) {
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
}

export function createAssemblyScene(canvas: HTMLCanvasElement): AssemblyScene {
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
    premultipliedAlpha: true,
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NoToneMapping;

  const scene = new Scene();
  const camera = new OrthographicCamera(-550, 550, 410, -410, 0.1, 2000);
  camera.position.set(0, 0, 1000);
  camera.lookAt(0, 0, 0);

  const root = new Group();
  scene.add(root);

  const geometries: BufferGeometry[] = [];
  const materials: Material[] = [];
  const textures: Texture[] = [];
  const texturedLayers: TexturedLayer[] = [];
  const pillars: Pillar[] = [];
  let finalMaterial: MeshBasicMaterial | null = null;
  let disposed = false;

  const structuralMaterial = new MeshBasicMaterial({
    color: 0xd7d4cc,
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  materials.push(structuralMaterial);

  // A temporary exposed frame gives the second chapter an actual column/slab
  // build before the finished ground-floor texture settles over it.
  const pillarGeometry = new BoxGeometry(13, 176, 8);
  const slabGeometry = new BoxGeometry(892, 12, 8);
  geometries.push(pillarGeometry, slabGeometry);

  [118, 252, 397, 543, 690, 837, 947].forEach((screenX, index) => {
    const height = index % 2 === 0 ? 176 : 162;
    const baseY = worldY(index % 3 === 0 ? 602 : 594);
    const mesh = new Mesh(pillarGeometry, structuralMaterial);
    mesh.position.set(worldX(screenX), baseY, 3);
    mesh.scale.y = 0.001;
    mesh.renderOrder = 2;
    root.add(mesh);
    pillars.push({ mesh, baseY, height, delay: index * 0.07 });
  });

  const slab = new Mesh(slabGeometry, structuralMaterial);
  slab.position.set(6, worldY(425), 3);
  slab.scale.x = 0.001;
  slab.renderOrder = 2;
  root.add(slab);

  const loader = new TextureLoader();
  const ready = (async () => {
    const loaded = await Promise.all([
      ...LAYERS.map((layer) => loader.loadAsync(layer.source)),
      loader.loadAsync('/assembly-layers/test_grabcut.png'),
    ]);

    if (disposed) {
      loaded.forEach((texture) => texture.dispose());
      return;
    }

    loaded.forEach((texture) => {
      configureTexture(texture);
      textures.push(texture);
    });

    LAYERS.forEach((definition, index) => {
      const geometry = new PlaneGeometry(definition.width, definition.height);
      const material = new MeshBasicMaterial({
        map: loaded[index],
        transparent: true,
        opacity: definition.stage === 0 ? 1 : 0,
        alphaTest: 0.01,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      });
      const mesh = new Mesh(geometry, material);
      const centerX = definition.x + definition.width / 2;
      const dockedCenterY = definition.y + definition.height / 2;
      const explodedCenterY = definition.explodedY + definition.height / 2;
      const restZ = 8 + index * 2;

      mesh.position.set(worldX(centerX), worldY(explodedCenterY), restZ + 22);
      mesh.renderOrder = 10 + index;
      root.add(mesh);
      geometries.push(geometry);
      materials.push(material);
      texturedLayers.push({
        mesh,
        material,
        definition,
        dockedWorldY: worldY(dockedCenterY),
        explodedWorldY: worldY(explodedCenterY),
        restZ,
      });
    });

    const finalGeometry = new PlaneGeometry(1024, 724);
    finalMaterial = new MeshBasicMaterial({
      map: loaded.at(-1),
      transparent: true,
      opacity: 0,
      alphaTest: 0.01,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    });
    const finalMesh = new Mesh(finalGeometry, finalMaterial);
    // The original image is 724px high. A 26px top inset aligns its building
    // footprint with the 750px layer artboard used by the supplied cut-outs.
    finalMesh.position.set(0, worldY(26 + 724 / 2), 24);
    finalMesh.renderOrder = 30;
    root.add(finalMesh);
    geometries.push(finalGeometry);
    materials.push(finalMaterial);
  })();

  const render = (progress: number) => {
    const p = clamp(progress);
    const finalMix = outQuint(span(p, 0.9, 0.985));
    const pieceOpacity = 1 - finalMix;

    texturedLayers.forEach((layer) => {
      const [start, end] = STAGE_WINDOWS[layer.definition.stage] ?? [0, 1];
      const duration = end - start;
      const localStart = start + duration * layer.definition.delay * 0.45;
      const local = layer.definition.stage === 0 ? 1 : span(p, localStart, end);
      const eased = outQuint(local);

      layer.mesh.position.y = mix(layer.explodedWorldY, layer.dockedWorldY, eased);
      layer.mesh.position.z = mix(layer.restZ + 22, layer.restZ, eased);
      layer.mesh.rotation.z = layer.definition.tilt * (1 - eased);
      layer.mesh.rotation.x = -0.018 * (1 - eased);
      const scale = 0.986 + eased * 0.014;
      layer.mesh.scale.set(scale, scale, 1);
      layer.material.opacity = (layer.definition.stage === 0 ? 1 : eased) * pieceOpacity;
      layer.mesh.visible = layer.material.opacity > 0.002;
    });

    const structureIn = outQuint(span(p, STAGE_WINDOWS[1]![0], STAGE_WINDOWS[1]![1]));
    const structureOut = 1 - outQuint(span(p, 0.56, 0.75));
    structuralMaterial.opacity = structureIn * structureOut * pieceOpacity * 0.92;

    pillars.forEach((pillar) => {
      const start = STAGE_WINDOWS[1]![0] + pillar.delay * 0.1;
      const growth = outQuint(span(p, start, STAGE_WINDOWS[1]![1]));
      pillar.mesh.scale.y = Math.max(0.001, growth * (pillar.height / 176));
      // BoxGeometry grows from its centre, so move it by half the live height
      // to keep the footing locked to the plinth.
      pillar.mesh.position.y = pillar.baseY + (176 * pillar.mesh.scale.y) / 2;
      pillar.mesh.visible = structuralMaterial.opacity > 0.002;
    });

    const slabGrowth = outQuint(span(p, 0.27, STAGE_WINDOWS[1]![1]));
    slab.scale.x = Math.max(0.001, slabGrowth);
    slab.visible = structuralMaterial.opacity > 0.002;

    if (finalMaterial) finalMaterial.opacity = finalMix;
    renderer.render(scene, camera);
  };

  const resize = (width: number, height: number) => {
    if (width <= 0 || height <= 0) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 700 ? 1.4 : 1.75));
    renderer.setSize(width, height, false);

    const viewportAspect = width / height;
    const contentAspect = CAMERA_BOUNDS.width / CAMERA_BOUNDS.height;
    let frustumWidth: number;
    let frustumHeight: number;

    if (viewportAspect > contentAspect) {
      frustumHeight = CAMERA_BOUNDS.height;
      frustumWidth = frustumHeight * viewportAspect;
    } else {
      frustumWidth = CAMERA_BOUNDS.width;
      frustumHeight = frustumWidth / viewportAspect;
    }

    camera.left = -frustumWidth / 2;
    camera.right = frustumWidth / 2;
    camera.top = frustumHeight / 2;
    camera.bottom = -frustumHeight / 2;
    camera.updateProjectionMatrix();
  };

  const dispose = () => {
    disposed = true;
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    textures.forEach((texture) => texture.dispose());
    renderer.dispose();
    renderer.forceContextLoss();
  };

  return { ready, render, resize, dispose };
}
