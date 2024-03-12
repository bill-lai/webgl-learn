import { vec2, vec3 } from "gl-matrix";
import { ShapeAttrib } from "..";

/**
 * 计算法线切线空间的切线和副切线
 * @param uvs 三角面的uv坐标
 * @param positions 三角面的坐标
 * @returns
 */
export const getTangentAndBi = (
  uvs: Float32Array[],
  positions: Float32Array[]
) => {
  const uv1 = vec2.sub(vec2.create(), uvs[0], uvs[1]);
  const uv2 = vec2.sub(vec2.create(), uvs[2], uvs[1]);
  const ed1 = vec3.sub(vec3.create(), positions[0], positions[1]);
  const ed2 = vec3.sub(vec3.create(), positions[2], positions[1]);

  const f = 1 / (uv1[0] * uv2[1] - uv1[1] * uv2[0]);
  const tangent = vec3.fromValues(
    f * (uv2[1] * ed1[0] - uv1[1] * ed2[0]),
    f * (uv2[1] * ed1[1] - uv1[1] * ed2[1]),
    f * (uv2[1] * ed1[2] - uv1[1] * ed2[2])
  );
  vec3.normalize(tangent, tangent);

  const biTangent = vec3.fromValues(
    f * (-uv2[0] * ed1[0] + uv1[0] * ed2[0]),
    f * (-uv2[0] * ed1[1] + uv1[0] * ed2[1]),
    f * (-uv2[0] * ed1[2] + uv1[0] * ed2[2])
  );
  vec3.normalize(biTangent, biTangent);
  return [tangent, biTangent];
};

export const genModalsTangentAndBi = (modal: ShapeAttrib) => {
  const tangents = new Float32Array(modal.positions.length);
  const bitangents = new Float32Array(modal.positions.length);

  for (let i = 0; i < modal.includes.length; i += 3) {
    const ndxs = modal.includes.slice(i, i + 3);
    const uvs = [
      modal.texCoords.slice(ndxs[0] * 2, ndxs[0] * 2 + 2),
      modal.texCoords.slice(ndxs[1] * 2, ndxs[1] * 2 + 2),
      modal.texCoords.slice(ndxs[2] * 2, ndxs[2] * 2 + 2),
    ];
    const positions = [
      modal.positions.slice(ndxs[0] * 3, ndxs[0] * 3 + 3),
      modal.positions.slice(ndxs[1] * 3, ndxs[1] * 3 + 3),
      modal.positions.slice(ndxs[2] * 3, ndxs[2] * 3 + 3),
    ];
    const [tangent, biTangent] = getTangentAndBi(uvs, positions);
    tangents.set(tangent, ndxs[0] * 3);
    tangents.set(tangent, ndxs[1] * 3);
    tangents.set(tangent, ndxs[2] * 3);
    bitangents.set(biTangent, ndxs[0] * 3);
    bitangents.set(biTangent, ndxs[1] * 3);
    bitangents.set(biTangent, ndxs[2] * 3);
  }
  // console.log

  return {
    ...modal,
    tangents,
    bitangents,
  };
};
