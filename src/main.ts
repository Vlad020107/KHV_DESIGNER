import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <div id="ui">
        <button id="add-cabinet-btn">Add cabinet</button>
        <select id="mode-select">
            <option value="translate">Move</option>
            <option value="scale">Scale</option>
            <option value="rotate">Rotate</option>
        </select>
        <input id="color-input" type="color" value="#c8a27a" />
    </div>
    <div id="scene-root"></div>
`

const root = document.getElementById('scene-root') as HTMLDivElement
const addCabinetBtn = document.getElementById('add-cabinet-btn') as HTMLButtonElement
const modeSelect = document.getElementById('mode-select') as HTMLSelectElement
const colorInput = document.getElementById('color-input') as HTMLInputElement

const scene = new THREE.Scene()
scene.background = new THREE.Color('#f2f2f2')

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    10000
)
camera.position.set(2200, 1600, 2200)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
root.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.target.set(0, 360, 0)
controls.update()

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x888888, 1.8)
scene.add(hemiLight)

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2)
dirLight.position.set(2000, 3000, 1000)
scene.add(dirLight)

const grid = new THREE.GridHelper(6000, 60, 0x888888, 0xcccccc)
scene.add(grid)

const floorGeometry = new THREE.PlaneGeometry(6000, 6000)
const floorMaterial = new THREE.MeshStandardMaterial({
    color: '#e8e8e8',
    side: THREE.DoubleSide,
})
const floor = new THREE.Mesh(floorGeometry, floorMaterial)
floor.rotation.x = Math.PI / 2
scene.add(floor)

const axes = new THREE.AxesHelper(1000)
scene.add(axes)

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()
const cabinets: THREE.Mesh[] = []

let selectedCabinet: THREE.Mesh | null = null
const DEFAULT_CABINET_COLOR = '#c8a27a'
const SELECTED_CABINET_COLOR = '#4f8df7'
let cabinetCount = 0

const transformControls = new TransformControls(camera, renderer.domElement)
transformControls.size = 0.8
transformControls.visible = false
scene.add(transformControls)

transformControls.addEventListener('mouseDown', () => {
    controls.enabled = false
})

transformControls.addEventListener('mouseUp', () => {
    controls.enabled = true
})

function createCabinet(x: number, z: number) {
    const cabinetGeometry = new THREE.BoxGeometry(600, 720, 560)
    const cabinetMaterial = new THREE.MeshStandardMaterial({ 
        color: DEFAULT_CABINET_COLOR, 
    })

    const cabinet = new THREE.Mesh(cabinetGeometry, cabinetMaterial)
    cabinet.position.set(x, 360, z)
    cabinet.name = `cabinet-${cabinetCount}`

    scene.add(cabinet)
    cabinets.push(cabinet)
    cabinetCount++


    return cabinet
}

function clearSelection() {
    cabinets.forEach((cabinet) => {
        const material = cabinet.material as THREE.MeshStandardMaterial
        material.color.set(DEFAULT_CABINET_COLOR)
    })

    selectedCabinet = null
    transformControls.visible = false
    transformControls.detach()
}

function selectCabinet(cabinet: THREE.Mesh) {
    clearSelection()
    selectedCabinet = cabinet
    const material = cabinet.material as THREE.MeshStandardMaterial
    material.color.set(SELECTED_CABINET_COLOR)
    transformControls.attach(cabinet)
    transformControls.visible = true
    colorInput.value = `#${material.color.getHexString()}`
}

createCabinet(0, 0)

addCabinetBtn.addEventListener('click', () => {
    const x = cabinetCount * 700
    const z = 0
    const cabinet = createCabinet(x, z)
    selectCabinet(cabinet)
})

renderer.domElement.addEventListener('pointerdown', (event) => {
    const rect = renderer.domElement.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(cabinets, false)

    if (intersects.length > 0) {
        const clickedCabinet = intersects[0].object as THREE.Mesh
        selectCabinet(clickedCabinet)
    } else {
        clearSelection()
    }
})

modeSelect.addEventListener('change', () => {
    transformControls.setMode(modeSelect.value as 'translate' | 'scale' | 'rotate')
})

colorInput.addEventListener('input', () => {
    if (!selectedCabinet) return 
    const material = selectedCabinet.material as THREE.MeshStandardMaterial
    material.color.set(colorInput.value)
})

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

window.addEventListener('resize', onResize)

function animate() {
    requestAnimationFrame(animate)
    controls.update()
    renderer.render(scene, camera)
}

animate()
