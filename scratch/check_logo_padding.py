import os
from PIL import Image

def analyze_image(path):
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return
    img = Image.open(path)
    print(f"Analyzing {path}:")
    print(f"  Format: {img.format}, Size: {img.size}, Mode: {img.mode}")
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # Get bounding box of non-zero alpha pixels
    bbox = img.getbbox()
    if bbox:
        left, upper, right, lower = bbox
        width, height = img.size
        print(f"  Bounding box: left={left}, top={upper}, right={right}, bottom={lower}")
        print(f"  Content size: {right - left}x{lower - upper}")
        print(f"  Left padding: {left}px, Right padding: {width - right}px")
        print(f"  Top padding: {upper}px, Bottom padding: {height - lower}px")
    else:
        print("  Image is completely transparent!")

workspace_path = "/Users/tripathialok/New Project (NeuronDash)"
analyze_image(os.path.join(workspace_path, "client/public/logo-horizontal-light.png"))
analyze_image(os.path.join(workspace_path, "client/public/logo-horizontal-dark.png"))
analyze_image(os.path.join(workspace_path, "client/public/logo-stacked.svg"))
