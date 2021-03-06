export const encode = (buffer: Buffer): Buffer => {
  const bufs = []

  let i = 0
  while (i < buffer.length) {
    const byte = buffer[i]
    // if last 1 byte remaining
    if (i + 1 >= buffer.length) {
      const length = 1
      const buf = Buffer.from([length - 1])
      bufs.push(buf)
      bufs.push(buffer.slice(i, buffer.length))
      break
    }

    const repeat = byte === buffer[i + 1]
    if (repeat) {
      // literal repeated
      let j = i + 1
      let length = 2
      while (++j < buffer.length && byte === buffer[j] && length < 128) {
        length++
      }
      const buf = Buffer.from([1 - length, byte])
      bufs.push(buf)
      i = j
    } else {
      // no literal repeated
      let j = i + 1
      let length = 2
      let prev = buffer[j]
      while (++j < buffer.length && prev !== buffer[j] && length < 128) {
        length++
        prev = buffer[j]
      }
      // rollback index if detect repeat
      if (prev === buffer[j]) {
        j--
        length--
      }
      const buf = Buffer.from([length - 1])
      bufs.push(buf)
      bufs.push(buffer.slice(i, j))
      i = j
    }
  }

  return Buffer.concat(bufs)
}

export const decode = (buffer: Buffer): Buffer => {
  const bufs = []

  let i = 0
  while (i < buffer.length) {
    const byte = buffer.readInt8(i)

    // -128 -> skip
    if (byte === -128) {
      i++
      continue
    }

    let buf
    if (byte < 0) {
      // -1 to -127 -> one byte of data repeated (1 - byte) times
      const length = 1 - byte
      buf = Buffer.alloc(length, buffer.slice(i + 1, i + 2))
      i += 2
    } else {
      // 0 to 127 -> (1 + byte) literal bytes
      const length = 1 + byte
      buf = buffer.slice(i + 1, i + 1 + length)
      i += 1 + length
    }
    bufs.push(buf)
  }

  return Buffer.concat(bufs)
}
