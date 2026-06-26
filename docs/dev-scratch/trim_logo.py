import os
from PIL import Image

def trim_image(path):
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return
    img = Image.open(path)
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    bbox = img.getbbox()
    if bbox:
        # Crop to the bounding box
        cropped_img = img.crop(bbox)
        
        # Save cropped image back
        cropped_img.save(path)
        print(f"Successfully trimmed {path} to size {cropped_img.size}")
    else:
        print(f"Could not trim {path} (empty bbox)")

workspace_path = "/Users/tripathialok/New Project (NeuronDash)"
trim_image(os.path.join(workspace_path, "client/public/logo-horizontal-light.png"))
trim_image(os.path.join(workspace_path, "client/public/logo-horizontal-dark.png"))
