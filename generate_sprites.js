const fs = require('fs');
const PImage = require('pureimage');
const path = require('path');

const FRAME_W = 32;
const FRAME_H = 32;
const COLS = 3;
const ROWS = 4;
const IMG_W = FRAME_W * COLS;
const IMG_H = FRAME_H * ROWS;

const DIR = path.join(__dirname, 'public/assets/layers');
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

async function createLayer(name, drawFunc) {
    const img = PImage.make(IMG_W, IMG_H);
    const ctx = img.getContext('2d');
    
    // Clear transparent
    ctx.clearRect(0, 0, IMG_W, IMG_H);
    
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const xOffset = c * FRAME_W;
            const yOffset = r * FRAME_H;
            
            // Bobbing: frame 0 and 2 dip by 1 pixel
            const isStepping = (c === 0 || c === 2);
            const bob = isStepping ? 1 : 0;
            
            drawFunc(ctx, xOffset, yOffset, r, c, bob);
        }
    }
    
    await PImage.encodePNGToStream(img, fs.createWriteStream(path.join(DIR, `${name}.png`)));
    console.log(`Generated ${name}.png`);
}

// Draw Helpers
const drawRect = (ctx, x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
};

// Row definitions:
// 0: Down (Facing Camera)
// 1: Left
// 2: Right
// 3: Up (Facing Away)

const drawBody = (ctx, x, y, row, col, bob) => {
    const cx = x + FRAME_W/2;
    const cy = y + FRAME_H/2 + bob;
    
    // Base Skin Color (pure white so tinting works)
    const skin = '#FFFFFF';
    const shade = '#CCCCCC'; // for depth

    // Legs
    let leftLegY = cy + 10;
    let rightLegY = cy + 10;
    if (col === 0) leftLegY -= 2;
    if (col === 2) rightLegY -= 2;
    
    if (row === 1) { // Left
        drawRect(ctx, cx - 2, leftLegY, 4, 6, shade); // Back leg
        drawRect(ctx, cx - 2, rightLegY, 4, 6, skin); // Front leg
    } else if (row === 2) { // Right
        drawRect(ctx, cx - 2, rightLegY, 4, 6, shade);
        drawRect(ctx, cx - 2, leftLegY, 4, 6, skin);
    } else {
        drawRect(ctx, cx - 5, leftLegY, 4, 6, skin);
        drawRect(ctx, cx + 1, rightLegY, 4, 6, skin);
    }

    // Torso
    if (row === 1 || row === 2) {
        drawRect(ctx, cx - 3, cy - 2, 6, 12, skin);
    } else {
        drawRect(ctx, cx - 5, cy - 2, 10, 12, skin);
    }
    
    // Arms
    let leftArmY = cy;
    let rightArmY = cy;
    if (col === 0) { leftArmY += 2; rightArmY -= 2; }
    if (col === 2) { leftArmY -= 2; rightArmY += 2; }
    
    if (row === 1) {
        drawRect(ctx, cx - 1, leftArmY, 4, 10, skin);
    } else if (row === 2) {
        drawRect(ctx, cx - 3, rightArmY, 4, 10, skin);
    } else {
        drawRect(ctx, cx - 9, leftArmY, 4, 10, skin);
        drawRect(ctx, cx + 5, rightArmY, 4, 10, skin);
    }

    // Head
    if (row === 1 || row === 2) {
        drawRect(ctx, cx - 5, cy - 14, 10, 12, skin);
        if (row === 1) drawRect(ctx, cx - 6, cy - 9, 2, 2, shade); // nose left
        if (row === 2) drawRect(ctx, cx + 4, cy - 9, 2, 2, shade); // nose right
    } else {
        drawRect(ctx, cx - 6, cy - 14, 12, 12, skin);
    }
};

const drawHair1 = (ctx, x, y, row, col, bob) => {
    // Short spiky hair
    const cx = x + FRAME_W/2;
    const cy = y + FRAME_H/2 + bob;
    const hair = '#FFFFFF';
    
    if (row === 1) {
        drawRect(ctx, cx - 6, cy - 16, 12, 6, hair);
        drawRect(ctx, cx, cy - 18, 4, 4, hair);
    } else if (row === 2) {
        drawRect(ctx, cx - 6, cy - 16, 12, 6, hair);
        drawRect(ctx, cx - 4, cy - 18, 4, 4, hair);
    } else if (row === 3) {
        drawRect(ctx, cx - 7, cy - 16, 14, 8, hair);
        drawRect(ctx, cx - 4, cy - 18, 8, 4, hair);
    } else {
        drawRect(ctx, cx - 7, cy - 16, 14, 6, hair);
        drawRect(ctx, cx - 4, cy - 18, 8, 4, hair);
    }
};

const drawHair2 = (ctx, x, y, row, col, bob) => {
    // Long hair
    const cx = x + FRAME_W/2;
    const cy = y + FRAME_H/2 + bob;
    const hair = '#FFFFFF';
    
    drawRect(ctx, cx - 7, cy - 15, 14, 4, hair); // Top
    if (row === 1 || row === 2) {
        drawRect(ctx, cx - 6, cy - 11, 10, 12, hair); // back flow
    } else if (row === 3) {
        drawRect(ctx, cx - 7, cy - 11, 14, 14, hair); // full back
    } else {
        drawRect(ctx, cx - 7, cy - 11, 4, 12, hair); // front left side
        drawRect(ctx, cx + 3, cy - 11, 4, 12, hair); // front right side
    }
};

const drawTop1 = (ctx, x, y, row, col, bob) => {
    // Short-sleeve scrub top
    const cx = x + FRAME_W/2;
    const cy = y + FRAME_H/2 + bob;
    const top = '#FFFFFF';
    const detail = '#DDDDDD';
    
    // Torso
    if (row === 1 || row === 2) {
        drawRect(ctx, cx - 3, cy - 2, 7, 9, top);
    } else {
        drawRect(ctx, cx - 5, cy - 2, 10, 9, top);
        if (row === 0) drawRect(ctx, cx - 1, cy - 2, 2, 4, detail); // v-neck
    }
    
    // Sleeves
    let leftArmY = cy;
    let rightArmY = cy;
    if (col === 0) { leftArmY += 2; rightArmY -= 2; }
    if (col === 2) { leftArmY -= 2; rightArmY += 2; }
    
    if (row === 1) {
        drawRect(ctx, cx - 1, leftArmY, 5, 4, top);
    } else if (row === 2) {
        drawRect(ctx, cx - 4, rightArmY, 5, 4, top);
    } else {
        drawRect(ctx, cx - 10, leftArmY, 5, 4, top);
        drawRect(ctx, cx + 5, rightArmY, 5, 4, top);
    }
};

const drawTop2 = (ctx, x, y, row, col, bob) => {
    // Lab coat (Long sleeve, goes past waist)
    const cx = x + FRAME_W/2;
    const cy = y + FRAME_H/2 + bob;
    const top = '#FFFFFF';
    
    if (row === 1 || row === 2) {
        drawRect(ctx, cx - 4, cy - 2, 8, 14, top); // Long coat
    } else {
        drawRect(ctx, cx - 6, cy - 2, 12, 14, top);
    }
    
    // Long Sleeves
    let leftArmY = cy;
    let rightArmY = cy;
    if (col === 0) { leftArmY += 2; rightArmY -= 2; }
    if (col === 2) { leftArmY -= 2; rightArmY += 2; }
    
    if (row === 1) {
        drawRect(ctx, cx - 2, leftArmY, 6, 10, top);
    } else if (row === 2) {
        drawRect(ctx, cx - 4, rightArmY, 6, 10, top);
    } else {
        drawRect(ctx, cx - 10, leftArmY, 5, 10, top);
        drawRect(ctx, cx + 5, rightArmY, 5, 10, top);
    }
};

const drawBottom1 = (ctx, x, y, row, col, bob) => {
    // Basic pants
    const cx = x + FRAME_W/2;
    const cy = y + FRAME_H/2 + bob;
    const bottom = '#FFFFFF';
    
    let leftLegY = cy + 7;
    let rightLegY = cy + 7;
    if (col === 0) leftLegY -= 2;
    if (col === 2) rightLegY -= 2;
    
    if (row === 1) {
        drawRect(ctx, cx - 2, rightLegY, 4, 7, bottom); // front
    } else if (row === 2) {
        drawRect(ctx, cx - 2, leftLegY, 4, 7, bottom); // front
    } else {
        drawRect(ctx, cx - 5, leftLegY, 4, 7, bottom);
        drawRect(ctx, cx + 1, rightLegY, 4, 7, bottom);
    }
};

const drawShoes1 = (ctx, x, y, row, col, bob) => {
    // Basic shoes
    const cx = x + FRAME_W/2;
    const cy = y + FRAME_H/2 + bob;
    const shoe = '#FFFFFF';
    
    let leftLegY = cy + 14;
    let rightLegY = cy + 14;
    if (col === 0) leftLegY -= 2;
    if (col === 2) rightLegY -= 2;
    
    if (row === 1) {
        drawRect(ctx, cx - 3, rightLegY, 5, 2, shoe); 
    } else if (row === 2) {
        drawRect(ctx, cx - 2, leftLegY, 5, 2, shoe); 
    } else {
        drawRect(ctx, cx - 5, leftLegY, 4, 2, shoe);
        drawRect(ctx, cx + 1, rightLegY, 4, 2, shoe);
    }
};

async function generateAll() {
    console.log("Generating procedural sprites...");
    await createLayer('body', drawBody);
    await createLayer('hair_1', drawHair1);
    await createLayer('hair_2', drawHair2);
    await createLayer('top_1', drawTop1);
    await createLayer('top_2', drawTop2);
    await createLayer('bottom_1', drawBottom1);
    await createLayer('shoes_1', drawShoes1);
    console.log("Done!");
}

generateAll();
