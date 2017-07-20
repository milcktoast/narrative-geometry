const chroma = require('chroma-js')
const { PI, sin, cos, floor, random } = Math

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')

const state = {
  loop: true,
  tick: -1,

  clearColor: chroma('#1b1a22'),
  strokeColor: chroma.random().set('hsl.l', 0.8)
}

function toggleLoop () {
  state.loop = !state.loop
  if (state.loop) animate()
}

function animate () {
  if (!state.loop) return
  state.tick++
  draw()
  window.requestAnimationFrame(animate)
}

function draw () {
  const { width, height, tick, data } = state
  const { sentLengths, peopleCoords } = data
  const sentIndex = state.sentIndex++

  if (sentIndex >= sentLengths.length - 1) {
    state.sentIndex = 0
    console.log('loop')
    return
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0)

  if (tick === 0) {
    ctx.globalAlpha = 1
    ctx.fillStyle = state.clearColor.hex()
    ctx.clearRect(0, 0, width, height)
    ctx.fillRect(0, 0, width, height)
  }

  ctx.translate(width / 2, height / 2)
  ctx.rotate(tick * 0.001 * PI * 2)

  ctx.globalCompositeOperation = 'overlay'
  ctx.globalAlpha = 0.1
  ctx.strokeStyle = state.strokeColor.hex()

  drawCircle(mapLinear(10, 100, 80, 320, sentLengths[sentIndex]), 7)
}

function drawCircle (radius, precision) {
  ctx.beginPath()
  for (let i = 0; i <= precision; i++) {
    const angle = i / precision * PI * 2
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
  const sentLengths = fetch('./assets/data/sent-lengths-chars.bin')
    .then((res) => res.arrayBuffer())
    .then((buffer) => new Uint16Array(buffer))
  const peopleCoords = fetch('./assets/data/people-coords.json')
    .then((res) => res.json())
  return Promise.all([sentLengths, peopleCoords])
    .then(([sentLengths, peopleCoords]) => ({
      sentLengths,
      peopleCoords
    }))
}

document.body.appendChild(canvas)
resize()
fetchData().then((data) => {
  console.log(data)
  Object.assign(state, {
    sentIndex: 0,
    data
  })
  animate()
})

window.addEventListener('resize', resize, false)
document.body.addEventListener('keyup', (event) => {
  if (event.code === 'Space') {
    toggleLoop()
  }
})
document.body.addEventListener('dblclick', (event) => {
  window.open(canvas.toDataURL('image/png'))
})
