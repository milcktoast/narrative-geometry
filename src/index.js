const chroma = require('chroma-js')

const { PI, sin, cos, floor } = Math
const WORD_VEC_LENGTH = 300

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')
const state = {
  tick: 0,
  innerRadius: 0,
  clearColor: chroma('#1b1a22').brighten(0.1),
  strokeColor: chroma.random().set('hsl.l', 0.8),
  accumWordWeight: new Float32Array(WORD_VEC_LENGTH)
}

function animate () {
  state.tick++
  draw()
  window.requestAnimationFrame(animate)
}

// TODO: Fix end loop ... maybe something with WORD_VEC_LENGTH?
function draw () {
  const { width, height, tick, data, accumWordWeight, vecOffset } = state
  const { sentLengths, wordVectors } = data
  const sentLength = 1//sentLengths[state.sentIndex++]

  // if (sentLength == null) {
  if (++state.sentLength > wordVectors.length / WORD_VEC_LENGTH) {
    state.sentIndex = 0
    state.vecOffset = 0
    console.log('loop')
    return
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  // ctx.globalAlpha = 0.02
  // ctx.fillStyle = state.clearColor.hex()
  // ctx.fillRect(0, 0, width, height)
  // ctx.clearRect(0, 0, width, height)

  ctx.translate(width / 2, height / 2)
  ctx.globalCompositeOperation = 'overlay'
  ctx.globalAlpha = 0.1
  ctx.strokeStyle = state.strokeColor.set('hsl.h', tick * 0.1 % 360).hex()
  ctx.lineWidth = 1

  const innerRadius = state.innerRadius
  const fullSentLength = sentLength * WORD_VEC_LENGTH
  state.vecOffset += fullSentLength
  state.innerRadius += 0.5

  accumWordWeights(accumWordWeight, wordVectors,
    [vecOffset, vecOffset + fullSentLength],
    0.05, 0.99)
  drawVector(accumWordWeight,
    [0, WORD_VEC_LENGTH],
    [innerRadius, innerRadius + 240], 1)
}

function accumWordWeights (out, vec, valRange, weight=1, decay=1) {
  const start = valRange[0]
  const count = valRange[1] - start
  for (let i = 0; i < count; i++) {
    const index = start + i
    out[i] += vec[index] * weight
    out[i] *= decay
  }
}

function drawVector (vec, valRange, radRange, interval=1) {
  const start = valRange[0]
  const count = floor((valRange[1] - start) / interval)
  const angleEnd = PI * 2
  const radStart = radRange[0]
  const radLen = radRange[1] - radStart

  ctx.beginPath()
  for (let i = -1; i < count; i++) {
    const index = start + (i === -1 ? count - 1 : i) * interval
    const intensity = mapLinear(-2, 2, 0, 1, vec[index])
    const radius = intensity * radLen + radStart
    const angle = index / (count * interval) * angleEnd
    const x = sin(angle) * radius
    const y = cos(angle) * radius

    if (i === -1) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
}

// Linear mapping from range <a1, a2> to range <b1, b2>
function mapLinear (a1, a2, b1, b2, x) {
  return b1 + (x - a1) * (b2 - b1) / (a2 - a1)
}

function resize () {
  const width = window.innerWidth
  const height = window.innerHeight
  state.width = width
  state.height = height
  canvas.width = width
  canvas.height = height
  Object.assign(canvas.style, {
    position: 'absolute',
    top: 0,
    left: 0
  })
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

window.addEventListener('resize', resize, false)
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
