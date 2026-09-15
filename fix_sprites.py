from PIL import Image
import os

def remove_background(image_path, output_path):
    print(f"Processing {image_path}...")
    try:
        img = Image.open(image_path)
        img = img.convert("RGBA")
        datas = img.getdata()
        
        # Get background color from top-left pixel
        bg_color = datas[0]
        
        # Tolerance for JPEG artifacts
        tolerance = 45
        
        newData = []
        for item in datas:
            # Check if pixel is close to background color
            if (abs(item[0] - bg_color[0]) < tolerance and
                abs(item[1] - bg_color[1]) < tolerance and
                abs(item[2] - bg_color[2]) < tolerance):
                newData.append((255, 255, 255, 0)) # transparent
            else:
                newData.append(item)
                
        img.putdata(newData)
        img.save(output_path, "PNG")
        print(f"Saved {output_path}")
    except Exception as e:
        print(f"Failed: {e}")

remove_background('public/assets/nurse_sprite.jpg', 'public/assets/nurse_sprite.png')
remove_background('public/assets/doctor_sprite.jpg', 'public/assets/doctor_sprite.png')
