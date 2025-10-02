import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export default function Starfield() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    camera.position.z = 500;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    if (mountRef.current) mountRef.current.appendChild(renderer.domElement);

    // =========================
    // ESTRELLAS
    // =========================
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1000;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
      starPositions[i] = (Math.random() - 0.5) * 2000;
    }
    starGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(starPositions, 3)
    );

    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // =========================
    // DETECTAR MÓVIL
    // =========================
    const isMobile = window.innerWidth <= 768;

    // =========================
    // MODELO DEL SOL (solo desktop)
    // =========================
    let sun: THREE.Object3D | null = null;
    if (!isMobile) {
      const loader = new GLTFLoader();
      loader.load("/sun.glb", (gltf) => {
        sun = gltf.scene;
        sun.scale.set(10, 10, 10); // más pequeño
        sun.position.set(0, 0, -300); // más alejado
        scene.add(sun);
      });
    }

    // =========================
    // POST-PROCESSING BLOOM
    // =========================
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.8,
      0.1
    );
    composer.addPass(bloomPass);

    // =========================
    // PARALLAX MOUSE (solo desktop)
    // =========================
    let mouseX = 0,
      mouseY = 0;
    if (!isMobile) {
      window.addEventListener("mousemove", (e) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -((e.clientY / window.innerHeight) * 2 - 1);
      });
    }

    // =========================
    // ANIMACIÓN
    // =========================
    const animate = () => {
      requestAnimationFrame(animate);

      // rotación de las estrellas
      stars.rotation.y += 0.0005;

      if (!isMobile) {
        // parallax de cámara
        const targetX = mouseX * 50;
        const targetY = mouseY * 50;
        camera.position.x += (targetX - camera.position.x) * 0.05;
        camera.position.y += (targetY - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);

        // movimiento del sol siguiendo al mouse
        if (sun) {
          const sunTargetX = mouseX * 500;
          const sunTargetY = mouseY * 500;
          sun.position.x += (sunTargetX - sun.position.x) * 0.05;
          sun.position.y += (sunTargetY - sun.position.y) * 0.05;
          sun.rotation.y += 0.002;
        }
      }

      composer.render();
    };
    animate();

    // =========================
    // RESIZE
    // =========================
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: "100vw",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: -1,
      }}
    />
  );
}
