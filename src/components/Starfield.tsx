import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

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

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
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

    camera.position.z = 500;

    // =========================
    // SOL
    // =========================
    const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sunMesh);

    const sunLight = new THREE.PointLight(0xffd700, 2, 1000);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // =========================
    // POST-PROCESSING BLOOM
    // =========================
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      4, // intensidad
      1, // radius
      0.3 // threshold
    );
    composer.addPass(bloomPass);

    

    // =========================
    // PARALLAX MOUSE
    // =========================
    let mouseX = 0, mouseY = 0;
    window.addEventListener("mousemove", (e) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -((e.clientY / window.innerHeight) * 2 - 1);
    });

    // =========================
    // ANIMACIÓN
    // =========================
    let time = 0;
    const animate = () => {
      requestAnimationFrame(animate);

      // estrellas
      stars.rotation.y += 0.0005;

      // parallax cámara
      const targetX = mouseX * 50;
      const targetY = mouseY * 50;
      camera.position.x += (targetX - camera.position.x) * 0.05;
      camera.position.y += (targetY - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      // mover sol
      sunMesh.position.x += (mouseX * 400 - sunMesh.position.x) * 0.1;
      sunMesh.position.y += (mouseY * 300 - sunMesh.position.y) * 0.1;
      sunLight.position.copy(sunMesh.position);

      // color animado
      time += 0.01;
      const colorOffset = Math.sin(time) * 0.1;
      const sunColor = new THREE.Color(1, 0.84 + colorOffset, 0);
      sunMaterial.color = sunColor;
      sunLight.color = sunColor;

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
