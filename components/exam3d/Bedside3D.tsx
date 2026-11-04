"use client";
import { Component, ReactNode, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import "./Materials";
import { BedsideScene, BedsideProps } from "./BedsideScene";

/** If WebGL or the models fail, the case stays fully playable without the 3D view. */
class Guard extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export default function Bedside3D(props: BedsideProps) {
  const fallback = <div className="w-full h-full flex items-center justify-center text-[15px] text-[#fff3df] px-3 text-center" data-testid="bedside-fallback">เครื่องนี้เปิดมุมมอง 3D ไม่ได้ ตรวจจากปุ่มด้านล่างได้เลย</div>;
  return (
    <Guard fallback={fallback}>
      <Canvas dpr={[0.75, 1]} camera={{ position: [2.75, 1.75, -0.2], fov: 42, near: 0.1, far: 30 }}
        gl={{ antialias: false, powerPreference: "high-performance", toneMapping: THREE.NoToneMapping }}
        style={{ imageRendering: "pixelated" }}
        onCreated={({ gl }) => { gl.setClearColor(new THREE.Color("#f3e3c3")); }}>
        <Suspense fallback={null}><BedsideScene {...props} /></Suspense>
      </Canvas>
    </Guard>
  );
}
