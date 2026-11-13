import { describe, expect, it } from 'vitest';
import { validateGlb } from '../scripts/blender/validate-glb.mjs';

function fixture(overrides = {}) {
  const document = {
    asset: { version: '2.0' },
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
    materials: [{}],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' }],
    bufferViews: [{ buffer: 0, byteLength: 36 }],
    buffers: [{ byteLength: 36 }],
    ...overrides,
  };
  const json = Buffer.from(JSON.stringify(document));
  const jsonLength = Math.ceil(json.length / 4) * 4;
  const bytes = Buffer.alloc(28 + jsonLength + 36);
  bytes.write('glTF');
  bytes.writeUInt32LE(2, 4);
  bytes.writeUInt32LE(bytes.length, 8);
  bytes.writeUInt32LE(jsonLength, 12);
  bytes.write('JSON', 16);
  bytes.fill(0x20, 20, 20 + jsonLength);
  json.copy(bytes, 20);
  bytes.writeUInt32LE(36, 20 + jsonLength);
  bytes.write('BIN\0', 24 + jsonLength);
  return bytes;
}

describe('Blender GLB asset validation', () => {
  it('accepts a self-contained scene with a material and embedded geometry', () => {
    expect(validateGlb(fixture())).toMatchObject({ meshes: 1, materials: 1 });
  });

  it('rejects a truncated binary chunk', () => {
    const truncated = fixture().subarray(0, -4);
    truncated.writeUInt32LE(truncated.length, 8);
    expect(() => validateGlb(truncated)).toThrow(/chunk/i);
  });

  it('rejects an external texture', () => {
    expect(() => validateGlb(fixture({ images: [{ uri: 'missing.png' }] }))).toThrow(/embedded/i);
  });

  it('rejects a buffer view outside the embedded buffer', () => {
    expect(() => validateGlb(fixture({ bufferViews: [{ buffer: 0, byteLength: 40 }] }))).toThrow(/buffer view/i);
  });

  it('rejects an empty scene even when the file has a mesh', () => {
    expect(() => validateGlb(fixture({ scenes: [{ nodes: [] }] }))).toThrow(/scene/i);
  });

  it('rejects an accessor that reads past its buffer view', () => {
    expect(() => validateGlb(fixture({
      accessors: [{ bufferView: 0, componentType: 5126, count: 4, type: 'VEC3' }],
    }))).toThrow(/position/i);
  });
});
