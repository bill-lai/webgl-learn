import { NumArr, identity, multiply, normalTRSArgs, rotateX, rotateY, rotateZ, scale, translate } from ".";

export class MatrixStack {
  private stack: NumArr[] = [];

  save() {
    this.stack.push(this.getCurrentMatrix())
  }

  restore() {
    this.stack.pop()
    if (this.stack.length === 0) {
      this.stack.push(identity())
    }
  }

  getCurrentMatrix() {
    return this.stack[this.stack.length - 1].slice()
  }

  setCurrentMatrix(matrix: NumArr) {
    this.stack[this.stack.length - 1] = matrix;
  }

  incCurrentMatrix(matrix: NumArr) {
    this.setCurrentMatrix(multiply(this.getCurrentMatrix(), matrix))
    return this
  }

  translate(x: number, y?: number, z?: number) {
    this.incCurrentMatrix(translate(...normalTRSArgs(x, 0, false, y, z)))
    return this
  }

  scale(x: number, y?: number, z?: number) {
    this.incCurrentMatrix(scale(...normalTRSArgs(x, 1, false, y, z)))
    return this
  }

  rotate(x: number, y?: number, z?: number) {
    const [rx, ry, rz] = normalTRSArgs(x, 0,true, y, z)
    this.incCurrentMatrix(
      multiply(
        rotateZ(rz),
        rotateY(ry),
        rotateX(rx)
      )
    );
    return this
  }
}