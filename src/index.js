const { PI, sin, cos } = Math

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')
const state = {}

function animate () {
  draw()
  window.requestAnimationFrame(animate)
}

function draw () {
  const { width, height, data, vecOffset } = state
  const { sentLengths, wordVectors } = data
  const sentLength = sentLengths[state.sentIndex++]

  if (sentLength == null) {
    state.sentIndex = 0
    state.vecOffset = 0
    return
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalAlpha = 0.1
  ctx.fillStyle = '#1b1a22'
  ctx.fillRect(0, 0, width, height)
  // ctx.clearRect(0, 0, width, height)

  ctx.translate(width / 2, height / 2)
  ctx.globalAlpha = 0.6
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1

  state.vecOffset += sentLength
  drawVector(wordVectors,
    [vecOffset, vecOffset + sentLength],
    [100, 300])
}

function drawVector (vec, valRange, radRange) {
  const start = valRange[0]
  const count = valRange[1] - start
  const angleEnd = PI * 2
  const radStart = radRange[0]
  const radLen = radRange[1] - radStart

  ctx.beginPath()
  for (let i = -1; i < count; i++) {
    const index = start + (i === -1 ? count - 1 : i)
    const radius = vec[index] * radLen + radStart
    const angle = i / count * angleEnd
    const x = sin(angle) * radius
    const y = cos(angle) * radius

    if (i === -1) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
}

function resize () {
  const width = window.innerWidth
  const height = window.innerHeight
  state.width = width
  state.height = height
  canvas.width = width
  canvas.height = height
}

function fetchData () {
  const sentLengths = fetch('./assets/data/sent-lengths.bin')
    .then((res) => res.arrayBuffer())
    .then((buffer) => new Uint16Array(buffer))
  const wordVectors = fetch('./assets/data/word-vectors.bin')
    .then((res) => res.arrayBuffer())
    .then((buffer) => new Float32Array(buffer))
  return Promise.all([sentLengths, wordVectors])
    .then(([sentLengths, wordVectors]) => ({
      sentLengths, wordVectors
    }))
}

document.body.appendChild(canvas)
resize()
fetchData().then((data) => {
  Object.assign(state, {
    sentIndex: 0,
    vecOffset: 0,
    data
  })
  animate()
})
