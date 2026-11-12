import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

function requireAsset(condition, reason) {
  if (!condition) throw new Error(`Invalid GLB: ${reason}`);
}

const isSize = value => Number.isSafeInteger(value) && value >= 0;

// This project checks its Blender export contract. This is not a full glTF conformance validator.
export function validateGlb(bytes) {
  requireAsset(bytes.length >= 20 && bytes.toString('ascii', 0, 4) === 'glTF', 'missing header');
  requireAsset(bytes.readUInt32LE(4) === 2, 'expected container version 2');
  requireAsset(bytes.readUInt32LE(8) === bytes.length, 'file length differs from header');

  function chunk(offset, type) {
    requireAsset(offset + 8 <= bytes.length, `missing ${type} chunk`);
    const length = bytes.readUInt32LE(offset);
    const end = offset + 8 + length;
    requireAsset(length > 0 && length % 4 === 0 && end <= bytes.length, `invalid ${type} chunk length`);
    requireAsset(bytes.toString('ascii', offset + 4, offset + 8) === type, `expected ${type} chunk`);
    return bytes.subarray(offset + 8, end);
  }

  const json = chunk(12, 'JSON');
  const binary = chunk(20 + json.length, 'BIN\0');
  requireAsset(28 + json.length + binary.length === bytes.length, 'unexpected trailing chunks');
  const gltf = JSON.parse(json.toString('utf8'));
  requireAsset(gltf.asset?.version === '2.0', 'expected glTF 2.0 document');

  const buffer = gltf.buffers?.[0];
  requireAsset(gltf.buffers?.length === 1 && buffer && buffer.uri === undefined
    && isSize(buffer.byteLength) && buffer.byteLength > 0
    && buffer.byteLength <= binary.length && binary.length - buffer.byteLength <= 3,
  'expected one embedded buffer matching the binary chunk');

  const views = gltf.bufferViews ?? [];
  for (const view of views) {
    const start = view.byteOffset ?? 0;
    requireAsset(view.buffer === 0 && isSize(start) && isSize(view.byteLength)
      && view.byteLength > 0 && start + view.byteLength <= buffer.byteLength,
    'buffer view exceeds embedded buffer');
  }
  for (const image of gltf.images ?? []) {
    requireAsset(image.uri === undefined && isSize(image.bufferView) && views[image.bufferView],
      'textures must be embedded buffer views');
  }

  const scene = gltf.scenes?.[gltf.scene ?? 0];
  requireAsset(scene?.nodes?.length, 'default scene is empty');
  const nodes = gltf.nodes ?? [];
  const meshes = new Set();
  const visited = new Set();
  const pending = [...scene.nodes];
  while (pending.length) {
    const index = pending.pop();
    requireAsset(isSize(index) && nodes[index], 'scene references a missing node');
    if (visited.has(index)) continue;
    visited.add(index);
    const node = nodes[index];
    if (node.mesh !== undefined) {
      requireAsset(isSize(node.mesh) && gltf.meshes?.[node.mesh], 'scene references a missing mesh');
      meshes.add(node.mesh);
    }
    for (const child of node.children ?? []) pending.push(child);
  }
  requireAsset(meshes.size, 'default scene contains no meshes');

  for (const index of meshes) {
    const { primitives } = gltf.meshes[index];
    requireAsset(primitives?.length, 'mesh contains no primitives');
    for (const primitive of primitives) {
      const position = gltf.accessors?.[primitive.attributes?.POSITION];
      const view = views[position?.bufferView];
      const start = position?.byteOffset ?? 0;
      const stride = view?.byteStride ?? 12;
      requireAsset(position?.componentType === 5126 && position.type === 'VEC3'
        && view && isSize(start) && isSize(stride) && stride >= 12
        && isSize(position.count) && position.count >= 3
        && start + (position.count - 1) * stride + 12 <= view.byteLength,
      'mesh POSITION accessor does not fit its buffer view');
      if (primitive.material !== undefined) {
        requireAsset(isSize(primitive.material) && gltf.materials?.[primitive.material],
          'mesh references a missing material');
      }
    }
  }

  return {
    bytes: bytes.length,
    meshes: meshes.size,
    materials: gltf.materials?.length ?? 0,
    images: gltf.images?.length ?? 0,
    animations: gltf.animations?.length ?? 0,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length !== 3) throw new Error('Usage: node scripts/blender/validate-glb.mjs <file.glb>');
    console.log('GLB validation passed', validateGlb(readFileSync(process.argv[2])));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
