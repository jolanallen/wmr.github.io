import * as THREE from 'three';

export function initThreeJS() {
  const canvas = document.querySelector('#bg-canvas') as HTMLCanvasElement;
  if (!canvas) return;

  const scene = new THREE.Scene();
  
  // Camera setup
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 150;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Particles (Nodes)
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesCount = 300;
  
  const posArray = new Float32Array(particlesCount * 3);
  const velocities = [];

  for(let i = 0; i < particlesCount * 3; i+=3) {
    // Spread particles over a large area
    posArray[i] = (Math.random() - 0.5) * 400;     // x
    posArray[i+1] = (Math.random() - 0.5) * 400;   // y
    posArray[i+2] = (Math.random() - 0.5) * 200;   // z

    velocities.push({
      x: (Math.random() - 0.5) * 0.2,
      y: (Math.random() - 0.5) * 0.2,
      z: (Math.random() - 0.5) * 0.2
    });
  }

  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

  const particlesMaterial = new THREE.PointsMaterial({
    size: 1.5,
    color: 0x00ff9d, // Accent color
    transparent: true,
    opacity: 0.8,
  });

  const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particlesMesh);

  // Lines (Edges) connecting nearby particles
  const linesMaterial = new THREE.LineBasicMaterial({
    color: 0x00ff9d,
    transparent: true,
    opacity: 0.15
  });
  
  // We'll update the lines geometry dynamically in the render loop
  let linesMesh: THREE.LineSegments | null = null;

  // Mouse interaction
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;

  const windowHalfX = window.innerWidth / 2;
  const windowHalfY = window.innerHeight / 2;

  document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX);
    mouseY = (event.clientY - windowHalfY);
  });

  // Handle Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    targetX = mouseX * 0.05;
    targetY = mouseY * 0.05;

    // Smooth camera rotation based on mouse
    scene.rotation.x += 0.05 * (targetY * 0.01 - scene.rotation.x);
    scene.rotation.y += 0.05 * (targetX * 0.01 - scene.rotation.y);

    const positions = particlesGeometry.attributes.position.array as Float32Array;
    
    // Move particles
    for(let i = 0; i < particlesCount; i++) {
      const i3 = i * 3;
      positions[i3] += velocities[i].x;
      positions[i3+1] += velocities[i].y;
      positions[i3+2] += velocities[i].z;

      // Wrap around bounds
      if (positions[i3] > 200 || positions[i3] < -200) velocities[i].x *= -1;
      if (positions[i3+1] > 200 || positions[i3+1] < -200) velocities[i].y *= -1;
      if (positions[i3+2] > 100 || positions[i3+2] < -100) velocities[i].z *= -1;
    }
    particlesGeometry.attributes.position.needsUpdate = true;

    // Compute lines based on proximity
    const linePositions = [];
    const maxDistance = 35; // Distance threshold to connect nodes

    for (let i = 0; i < particlesCount; i++) {
      for (let j = i + 1; j < particlesCount; j++) {
        const dx = positions[i*3] - positions[j*3];
        const dy = positions[i*3+1] - positions[j*3+1];
        const dz = positions[i*3+2] - positions[j*3+2];
        const distSq = dx*dx + dy*dy + dz*dz;

        if (distSq < maxDistance * maxDistance) {
          linePositions.push(
            positions[i*3], positions[i*3+1], positions[i*3+2],
            positions[j*3], positions[j*3+1], positions[j*3+2]
          );
        }
      }
    }

    if (linesMesh) {
      scene.remove(linesMesh);
      linesMesh.geometry.dispose();
    }

    if (linePositions.length > 0) {
      const linesGeometry = new THREE.BufferGeometry();
      linesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      linesMesh = new THREE.LineSegments(linesGeometry, linesMaterial);
      scene.add(linesMesh);
    }

    renderer.render(scene, camera);
  }

  animate();
}
