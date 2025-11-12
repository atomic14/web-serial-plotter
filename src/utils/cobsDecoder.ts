export class COBSDecoderError extends Error {
  constructor(message?: string) {
      super(message);
      this.name = "COBSDecoderError";
  }
}


export function decodeCOBS(data: Array<number>) {
  const output: Array<number> = []
  let i = 0

  while (i < data.length) {
    const code = data[i]
    if (code === 0 || i + code > data.length + 1) {
      throw new COBSDecoderError("Invalid COBS data")
    }

    const nextBlockEnd = i + code
    for (let j = i + 1; j < nextBlockEnd && j < data.length; j++) {
      output.push(data[j])
    }

    if (code < 0xFF && nextBlockEnd < data.length) {
      output.push(0x00)
    }

    i = nextBlockEnd
  }

  return Uint8Array.from(output)
}