import { createTex } from "./gl2/gl";

const NEWLINE = "\n";
const RGBE_VALID_PROGRAMTYPE = 1;
const RGBE_VALID_FORMAT = 2;
const RGBE_VALID_DIMENSIONS = 4;
const fgets = (
  pos: number,
  buffer: Uint8Array,
  lineLimit?: number,
  consume?: boolean
): { line: string | false; pos: number } => {
  const chunkSize = 128;

  lineLimit = !lineLimit ? 1024 : lineLimit;
  let p = pos,
    i = -1,
    len = 0,
    s = "",
    chunk = String.fromCharCode.apply(
      null,
      new Uint16Array(buffer.subarray(p, p + chunkSize)) as any
    );

  while (
    0 > (i = chunk.indexOf(NEWLINE)) &&
    len < lineLimit &&
    p < buffer.byteLength
  ) {
    s += chunk;
    len += chunk.length;
    p += chunkSize;
    chunk += String.fromCharCode.apply(
      null,
      new Uint16Array(buffer.subarray(p, p + chunkSize)) as any
    );
  }

  if (-1 < i) {
    /*for (i=l-1; i>=0; i--) {
      byteCode = m.charCodeAt(i);
      if (byteCode > 0x7f && byteCode <= 0x7ff) byteLen++;
      else if (byteCode > 0x7ff && byteCode <= 0xffff) byteLen += 2;
      if (byteCode >= 0xDC00 && byteCode <= 0xDFFF) i--; //trail surrogate
    }*/
    if (false !== consume) pos += len + i + 1;
  }

  return {
    line: s + chunk.slice(0, i),
    pos,
  };
};

const readHeader = function (buffer: Uint8Array) {
  // regexes to parse header info fields
  const magic_token_re = /^#\?(\S+)/,
    gamma_re = /^\s*GAMMA\s*=\s*(\d+(\.\d+)?)\s*$/,
    exposure_re = /^\s*EXPOSURE\s*=\s*(\d+(\.\d+)?)\s*$/,
    format_re = /^\s*FORMAT=(\S+)\s*$/,
    dimensions_re = /^\s*\-Y\s+(\d+)\s+\+X\s+(\d+)\s*$/,
    // RGBE format header struct
    header = {
      valid: 0 /* indicate which fields are valid */,

      string: "" /* the actual header string */,

      comments: "" /* comments found in header */,

      programtype:
        "RGBE" /* listed at beginning of file to identify it after "#?". defaults to "RGBE" */,

      format: "" /* RGBE format, default 32-bit_rle_rgbe */,

      gamma: 1.0 /* image has already been gamma corrected with given gamma. defaults to 1.0 (no correction) */,

      exposure: 1.0 /* a value of 1.0 in an image corresponds to <exposure> watts/steradian/m^2. defaults to 1.0 */,

      width: 0,
      height: 0 /* image dimensions, width/height */,

      pos: 0,
    };
  let pos = 0;

  let line, match;

  if (pos >= buffer.byteLength) {
    throw "no header found";
  } else {
    ({ line, pos } = fgets(pos, buffer));
    if (line === false) throw "no header found";
  }

  /* if you want to require the magic token then uncomment the next line */
  if (!(match = line.match(magic_token_re))) {
    throw "bad initial token";
  }

  header.valid |= RGBE_VALID_PROGRAMTYPE;
  header.programtype = match[1];
  header.string += line + "\n";

  while (true) {
    ({ line, pos } = fgets(pos, buffer));

    if (line === false) break;
    header.string += line + "\n";

    if ("#" === line.charAt(0)) {
      header.comments += line + "\n";
      continue; // comment line
    }

    if ((match = line.match(gamma_re))) {
      header.gamma = parseFloat(match[1]);
    }

    if ((match = line.match(exposure_re))) {
      header.exposure = parseFloat(match[1]);
    }

    if ((match = line.match(format_re))) {
      header.valid |= RGBE_VALID_FORMAT;
      header.format = match[1]; //'32-bit_rle_rgbe';
    }

    if ((match = line.match(dimensions_re))) {
      header.valid |= RGBE_VALID_DIMENSIONS;
      header.height = parseInt(match[1], 10);
      header.width = parseInt(match[2], 10);
    }

    if (
      header.valid & RGBE_VALID_FORMAT &&
      header.valid & RGBE_VALID_DIMENSIONS
    ) {
      // console.error("break2");
      break;
    }
  }

  if (!(header.valid & RGBE_VALID_FORMAT)) {
    throw "missing format specifier";
  }

  if (!(header.valid & RGBE_VALID_DIMENSIONS)) {
    throw "missing image size specifier";
  }

  header.pos = pos;
  return header;
};

const readPixelsView = function (buffer: Uint8Array, w: number, h: number) {
  const scanline_width = w;

  if (
    // run length encoding is not allowed so read flat
    scanline_width < 8 ||
    scanline_width > 0x7fff ||
    // this file is not run length encoded
    2 !== buffer[0] ||
    2 !== buffer[1] ||
    buffer[2] & 0x80
  ) {
    // return the flat buffer
    return new Uint8Array(buffer);
  }

  if (scanline_width !== ((buffer[2] << 8) | buffer[3])) {
    throw "wrong scanline width";
  }

  const data_rgba = new Uint8Array(4 * w * h);

  if (!data_rgba.length) {
    throw "unable to allocate buffer space";
  }

  let offset = 0,
    pos = 0;

  const ptr_end = 4 * scanline_width;
  const rgbeStart = new Uint8Array(4);
  const scanline_buffer = new Uint8Array(ptr_end);
  let num_scanlines = h;

  // read in each successive scanline
  while (num_scanlines > 0 && pos < buffer.byteLength) {
    if (pos + 4 > buffer.byteLength) {
      throw "rgbe_read_error";
    }

    rgbeStart[0] = buffer[pos++];
    rgbeStart[1] = buffer[pos++];
    rgbeStart[2] = buffer[pos++];
    rgbeStart[3] = buffer[pos++];

    if (
      2 != rgbeStart[0] ||
      2 != rgbeStart[1] ||
      ((rgbeStart[2] << 8) | rgbeStart[3]) != scanline_width
    ) {
      throw "rgbe_read_error bad rgbe scanline format";
    }

    // read each of the four channels for the scanline into the buffer
    // first red, then green, then blue, then exponent
    let ptr = 0,
      count;

    while (ptr < ptr_end && pos < buffer.byteLength) {
      count = buffer[pos++];
      const isEncodedRun = count > 128;
      if (isEncodedRun) count -= 128;

      if (0 === count || ptr + count > ptr_end) {
        throw "rgbe_read_error bad scanline data";
      }

      if (isEncodedRun) {
        // a (encoded) run of the same value
        const byteValue = buffer[pos++];
        for (let i = 0; i < count; i++) {
          scanline_buffer[ptr++] = byteValue;
        }
        //ptr += count;
      } else {
        // a literal-run
        scanline_buffer.set(buffer.subarray(pos, pos + count), ptr);
        ptr += count;
        pos += count;
      }
    }

    // now convert data from buffer into rgba
    // first red, then green, then blue, then exponent (alpha)
    const l = scanline_width; //scanline_buffer.byteLength;
    for (let i = 0; i < l; i++) {
      let off = 0;
      data_rgba[offset] = scanline_buffer[i + off];
      off += scanline_width; //1;
      data_rgba[offset + 1] = scanline_buffer[i + off];
      off += scanline_width; //1;
      data_rgba[offset + 2] = scanline_buffer[i + off];
      off += scanline_width; //1;
      data_rgba[offset + 3] = scanline_buffer[i + off];
      offset += 4;
    }

    num_scanlines--;
  }

  return data_rgba;
};

export const loadHDRData = async (uri: string) => {
  const data = await fetch(uri)
    .then((data) => data.arrayBuffer())
    .then((buffer) => new Uint8Array(buffer));

  const header = readHeader(data);
  const buffer = readPixelsView(
    data.subarray(header.pos),
    header.width,
    header.height
  );
  const result = new Float32Array(buffer.length);
  const numPixels = Math.floor(buffer.length / 4);

  for (let i = 0; i < numPixels; i++) {
    const start = i * 4;
    const e = buffer[start + 3];
    const scale = Math.pow(2.0, e - 128) / 255;
    result.set(
      [
        buffer[start + 0] * scale,
        buffer[start + 1] * scale,
        buffer[start + 2] * scale,
        1,
      ],
      start
    );
  }
  return {
    data: result,
    size: [header.width, header.height],
  };
};

export const generateHDRTex = (gl: WebGL2RenderingContext, uri: string) => {
  const tex = createTex(
    gl,
    {
      internalformat: gl.RGBA32F,
      size: [1, 1],
      type: gl.FLOAT,
      format: gl.RGBA,
    },
    new Float32Array([1, 1, 1, 1])
  );
  const loaded = loadHDRData(uri).then(({ data, size }) => {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    console.log(size);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA16F,
      size[0],
      size[1],
      0,
      gl.RGBA,
      gl.FLOAT,
      data
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.bindTexture(gl.TEXTURE_2D, null);
  });

  return {
    tex,
    loaded,
  };
};
