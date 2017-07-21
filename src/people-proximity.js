const chroma = require('chroma-js')
const glMatrix = require('gl-matrix')
const { vec2 } = glMatrix
const { PI, abs, sin, cos, floor, random } = Math

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')

const state = {
  loop: true,
  tick: -1,

  angle: 0,
  radius: 1,
  spacing: [60, 30],
  position: vec2.create(),
  positionPrev: vec2.create(),

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
  const { width, height, tick } = state

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  if (tick === 0) drawClearRect(width, height)

  ctx.translate(width / 2, height / 2)
  for (let i = 0; i < 12; i++) {
    stepNextSentence()
  }
}

function drawClearRect (width, height) {
  ctx.globalAlpha = 1
  ctx.fillStyle = state.clearColor.hex()
  ctx.clearRect(0, 0, width, height)
  ctx.fillRect(0, 0, width, height)
}

function stepNextSentence () {
  const {
    width, height, tick,
    spacing, position, positionPrev,
    sentLengths, people, peopleCoords, peoplePositions
  } = state
  const sentIndex = state.sentIndex++
  const sentLength = sentLengths[sentIndex]

  if (sentIndex >= sentLengths.length - 1) {
    state.loop = false
    console.log('stop')
    return
  }

  const { angle, radius } = state
  const px = sin(angle) * radius
  const py = cos(angle) * radius
  vec2.copy(positionPrev, position)
  vec2.set(position, px, py)

  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 0.2
  ctx.fillStyle = ctx.strokeStyle = '#fff'
  ctx.lineWidth = 1
  drawCircleFill(position, 0.5)

  ctx.globalAlpha = 0.01
  drawPath([positionPrev, position])

  ctx.globalCompositeOperation = 'overlay'
  ctx.globalAlpha = 0.3
  drawCircleStroke(position, 1)

  let drawnPeople = 0
  people.forEach((item) => {
    const { coords, coordIndex, color } = item
    const coord = coords[coordIndex]
    if (!coord || sentIndex !== coord[0]) return
    item.coordIndex++

    // Draw existence of entity
    ctx.globalCompositeOperation = 'overlay'
    ctx.globalAlpha = 0.9
    ctx.fillStyle = color.hex()
    ctx.lineWidth = 1
    drawCircleFill(position, 2 + drawnPeople * 2)
    drawCircleStroke(position, 3 + drawnPeople * 2)

    // Draw connections to close entities (text coordinates)
    let radOffset = 0
    peopleCoords.forEach((citem) => {
      const dist = coord[0] - citem.coord[0]
      // const dist = vec2.distance(position, pos)
      if (abs(dist) < 0.1 || dist > 20) return

      ctx.globalAlpha = 0.3
      ctx.strokeStyle = color.hex()
      ctx.lineWidth = 1
      drawPath([position, citem.position])

      ctx.globalAlpha = 0.5
      ctx.beginPath()
      ctx.arc(0, 0, radius + radOffset, citem.angle, angle, dist < 0)
      ctx.stroke()

      radOffset += 2
    })

    peopleCoords.push({
      coord,
      angle,
      radius,
      position: vec2.clone(position)
    })
    drawnPeople++
  })

  const circumference = 2 * PI * radius
  state.angle += spacing[0] / circumference
  state.radius += spacing[1] / circumference
}

// ..........

function drawPath (points) {
  ctx.beginPath()
  for (let i = 0; i < points.length; i++) {
    const point = points[i]
    if (i === 0) ctx.moveTo(point[0], point[1])
    else ctx.lineTo(point[0], point[1])
  }
  ctx.stroke()
}

function drawCircleStroke (pos, radius) {
  ctx.beginPath()
  ctx.arc(pos[0], pos[1], radius, 0, PI * 2)
  ctx.stroke()
}

function drawCircleFill (pos, radius) {
  ctx.beginPath()
  ctx.arc(pos[0], pos[1], radius, 0, PI * 2)
  ctx.fill()
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

// ..........

document.body.appendChild(canvas)
resize()
fetchData().then((data) => {
  const { peopleCoords, sentLengths } = data
  const people = Object.keys(peopleCoords)
    .map((name) => {
      const coords = peopleCoords[name]
      return {
        name,
        coords,
        coordIndex: 0,
        color: chroma.random().set('hsl.l', 0.8)
      }
    })
  Object.assign(state, {
    sentIndex: 0,
    sentLengths,
    people,
    peopleCoords: [],
    peoplePositions: []
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
