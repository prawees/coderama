import { useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';

interface PixiPreviewProps {
  skinColor: string;
  hairColor: string;
  topColor: string;
  bottomColor: string;
  shoeColor: string;
  hairStyle: string;
  topStyle: string;
}

export const PixiPreview = ({ skinColor, hairColor, topColor, bottomColor, shoeColor, hairStyle, topStyle }: PixiPreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const spritesRef = useRef<Record<string, PIXI.Sprite>>({});

  useEffect(() => {
    if (!containerRef.current) return;
    let isMounted = true;

    const initPixi = async () => {
      if (appRef.current) return; // Already initialized

      const app = new PIXI.Application();
      await app.init({
        width: 64,
        height: 64,
        backgroundAlpha: 0,
        resolution: window.devicePixelRatio || 1,
      });

      if (!isMounted) {
        app.destroy(true, { children: true });
        return;
      }
      
      appRef.current = app;
      if (containerRef.current) {
        if (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
        containerRef.current.appendChild(app.canvas);
      }

      const safeHair = hairStyle === 'hair_short' ? 'hair_1' : (hairStyle || 'hair_1');
      const safeTop = topStyle === 'top_scrubs' ? 'top_1' : (topStyle || 'top_1');

      try {
        const textures = await Promise.all([
          PIXI.Assets.load({ alias: 'body', src: '/assets/layers/body.png' }),
          PIXI.Assets.load({ alias: `hair_${safeHair}`, src: `/assets/layers/${safeHair}.png` }),
          PIXI.Assets.load({ alias: `top_${safeTop}`, src: `/assets/layers/${safeTop}.png` }),
          PIXI.Assets.load({ alias: 'bottom', src: '/assets/layers/bottom_1.png' }),
          PIXI.Assets.load({ alias: 'shoes', src: '/assets/layers/shoes_1.png' })
        ]);

        if (!isMounted) return;

        const createLayer = (texture: PIXI.Texture, key: string) => {
          const frameWidth = Math.floor(texture.width / 3);
          const frameHeight = Math.floor(texture.height / 4);
          const frame = new PIXI.Texture({
            source: texture.source,
            frame: new PIXI.Rectangle(frameWidth, 0, frameWidth, frameHeight)
          });

          const sprite = new PIXI.Sprite(frame);
          sprite.anchor.set(0.5, 0.5);
          sprite.x = 32;
          sprite.y = 32;
          sprite.scale.set(1.5);
          
          spritesRef.current[key] = sprite;
          return sprite;
        };

        const container = new PIXI.Container();
        
        container.addChild(createLayer(textures[0], 'body'));
        container.addChild(createLayer(textures[3], 'bottom'));
        container.addChild(createLayer(textures[4], 'shoes'));
        container.addChild(createLayer(textures[2], 'top'));
        container.addChild(createLayer(textures[1], 'hair'));

        app.stage.addChild(container);

        // Apply initial tints
        spritesRef.current['body'].tint = parseInt(skinColor.replace('#', ''), 16);
        spritesRef.current['hair'].tint = parseInt(hairColor.replace('#', ''), 16);
        spritesRef.current['top'].tint = parseInt(topColor.replace('#', ''), 16);
        spritesRef.current['bottom'].tint = parseInt(bottomColor.replace('#', ''), 16);
        spritesRef.current['shoes'].tint = parseInt(shoeColor.replace('#', ''), 16);

      } catch (e) {
        console.error("Failed to load textures", e);
      }
    };

    initPixi();

    return () => {
      isMounted = false;
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
        spritesRef.current = {};
      }
    };
  }, []); // Empty deps, only init once!

  // Effect to update tints when props change
  useEffect(() => {
    if (!spritesRef.current['body']) return;
    
    spritesRef.current['body'].tint = parseInt(skinColor.replace('#', ''), 16);
    spritesRef.current['hair'].tint = parseInt(hairColor.replace('#', ''), 16);
    spritesRef.current['top'].tint = parseInt(topColor.replace('#', ''), 16);
    spritesRef.current['bottom'].tint = parseInt(bottomColor.replace('#', ''), 16);
    spritesRef.current['shoes'].tint = parseInt(shoeColor.replace('#', ''), 16);
  }, [skinColor, hairColor, topColor, bottomColor, shoeColor]);

  // Effect to handle style changes (which require reloading textures)
  useEffect(() => {
    const updateStyle = async () => {
      if (!appRef.current || !spritesRef.current['hair'] || !spritesRef.current['top']) return;
      
      const safeHair = hairStyle === 'hair_short' ? 'hair_1' : (hairStyle || 'hair_1');
      const safeTop = topStyle === 'top_scrubs' ? 'top_1' : (topStyle || 'top_1');

      try {
        const [hairTex, topTex] = await Promise.all([
          PIXI.Assets.load({ alias: `hair_${safeHair}`, src: `/assets/layers/${safeHair}.png` }),
          PIXI.Assets.load({ alias: `top_${safeTop}`, src: `/assets/layers/${safeTop}.png` })
        ]);

        const getFrame = (tex: PIXI.Texture) => {
          const frameWidth = Math.floor(tex.width / 3);
          const frameHeight = Math.floor(tex.height / 4);
          return new PIXI.Texture({
            source: tex.source,
            frame: new PIXI.Rectangle(frameWidth, 0, frameWidth, frameHeight)
          });
        };

        spritesRef.current['hair'].texture = getFrame(hairTex);
        spritesRef.current['top'].texture = getFrame(topTex);
      } catch (e) {
        console.error(e);
      }
    };

    updateStyle();
  }, [hairStyle, topStyle]);

  return <div ref={containerRef} className="w-16 h-16 flex items-center justify-center" />;
};
