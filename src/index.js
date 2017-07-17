const { PI, sin, cos, floor } = Math

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')
const state = {}

function animate () {
  draw()
  window.requestAnimationFrame(animate)
}

// TODO: Fix end loop ... maybe something with wordVecLength?
function draw () {
  const wordVecLength = 300
  const { width, height, data, vecOffset } = state
  const { sentLengths, wordVectors } = data
  const sentLength = sentLengths[state.sentIndex++]

  if (sentLength == null) {
    state.sentIndex = 0
    state.vecOffset = 0
    console.log('loop')
    return
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalAlpha = 0.01
  ctx.fillStyle = '#1b1a22'
  ctx.fillRect(0, 0, width, height)
  // ctx.clearRect(0, 0, width, height)

  ctx.translate(width / 2, height / 2)
  ctx.globalAlpha = 0.4
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1

  const fullSentLength = sentLength * wordVecLength
  state.vecOffset += fullSentLength
  drawVector(wordVectors,
    [vecOffset, vecOffset + fullSentLength],
    [100, 300], 60)
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
    const intensity = mapLinear(-2, 1, 0, 1, vec[index])
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
