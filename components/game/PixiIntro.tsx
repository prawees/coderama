"use client";

import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

interface PixiIntroProps {
  hue: number;
  showCharacter: boolean;
}

export function PixiIntro({ hue, showCharacter }: PixiIntroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);

  useEffect(() => {
    if (!containerRef.current || typeof window === "undefined") return;

    let isMounted = true;
    const initPixi = async () => {
      // 1. Initialize Pixi Application (v8 syntax)
      const app = new PIXI.Application();
      await app.init({
        resizeTo: window,
        backgroundColor: 0x000000,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      if (!isMounted) {
        app.destroy(true);
        return;
      }
      
      appRef.current = app;
      if (containerRef.current) {
        containerRef.current.appendChild(app.canvas);
      }

      // 2. Load Assets
      PIXI.Assets.add({ alias: 'bg', src: '/assets/hospital_bg_new.jpg' });
      PIXI.Assets.add({ alias: 'doctor', src: '/assets/doctor.jpg' });
      let textures;
      try {
        textures = await PIXI.Assets.load(['bg', 'doctor']);
      } catch (e) {
        console.error("Failed to load textures for intro", e);
        return; // gracefully fail, leaving the black screen
      }

      if (!isMounted) return;

      // 3. Setup Background
      const bgSprite = new PIXI.Sprite(textures.bg);
      // Make background scale to cover screen, plus extra for panning
      const scale = Math.max(app.screen.width / bgSprite.width, app.screen.height / bgSprite.height) * 1.5;
      bgSprite.scale.set(scale);
      bgSprite.anchor.set(0.5);
      bgSprite.x = app.screen.width / 2;
      bgSprite.y = app.screen.height / 2;
      
      // Add a slight dark/sepia filter to the background to match original CSS
      const colorMatrix = new PIXI.ColorMatrixFilter();
      colorMatrix.sepia(false);
      colorMatrix.contrast(1.2, false);
      bgSprite.filters = [colorMatrix];
      bgSprite.alpha = 0.4; // opacity-40 mix-blend-screen effect roughly
      app.stage.addChild(bgSprite);

      // 4. Setup Animated Character
      // The sprite is 3 columns (walk cycle) x 4 rows (directions)
      const frameWidth = Math.floor(textures.doctor.width / 3);
      const frameHeight = Math.floor(textures.doctor.height / 4);
      
      // Extract the 'walking forward' frames (Row 1, assuming row 0 is down or up depending on sprite)
      const frames = [];
      for (let i = 0; i < 3; i++) {
        const rect = new PIXI.Rectangle(i * frameWidth, 0, frameWidth, frameHeight);
        frames.push(new PIXI.Texture({ source: textures.doctor.source, frame: rect }));
      }
      
      // Create animated sprite sequence (Left foot, Stand, Right foot, Stand)
      const walkFrames = [frames[0], frames[1], frames[2], frames[1]];
      const charSprite = new PIXI.AnimatedSprite(walkFrames);
      
      charSprite.animationSpeed = 0.1; // 6 FPS
      charSprite.play();
      charSprite.anchor.set(0.5);
      charSprite.scale.set(6); // Scale up for visibility in the menu
      
      // Position character (we will update this in the ticker or via props later if needed)
      // We position it roughly where the preview box is in the SETUP panel.
      // Since SETUP panel is centered and max-h is 85vh, it sits somewhere in the middle.
      charSprite.x = app.screen.width / 2;
      charSprite.y = app.screen.height / 2 + 100; 
      
      // Add Hue Filter for customization
      const charHueFilter = new PIXI.ColorMatrixFilter();
      charSprite.filters = [charHueFilter];
      
      app.stage.addChild(charSprite);

      // 5. Ticker / Game Loop
      let time = 0;
      app.ticker.add((ticker) => {
        time += 0.005 * ticker.deltaTime;
        // Slow pan back and forth for the background
        bgSprite.x = (app.screen.width / 2) + Math.sin(time) * 100;
        bgSprite.y = (app.screen.height / 2) + Math.cos(time * 0.8) * 50;

        // Update Character Hue
        charHueFilter.hue(hue, false);
        
        // Toggle character visibility based on state
        charSprite.visible = showCharacter;
      });
    };

    initPixi();

    return () => {
      isMounted = false;
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 z-0 overflow-hidden"
    />
  );
}
