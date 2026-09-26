import cv2
import numpy as np
import os

def transfer_color_and_texture(source_path, ref_path, out_path):
    print(f"Processing {source_path}")
    source = cv2.imread(source_path)
    ref = cv2.imread(ref_path)
    
    if source is None or ref is None:
        print("Error loading images")
        return

    # Resize reference to match source size
    ref = cv2.resize(ref, (source.shape[1], source.shape[0]))
    
    # 1. Create a soft mask for the metallic base
    # The base is gray-ish in the original image. We can detect pixels where R, G, B are close to each other
    # and not too dark (background) and not too bright (highlights).
    hsv = cv2.cvtColor(source, cv2.COLOR_BGR2HSV)
    # Saturation should be low for gray
    # Value should be in a mid-range
    lower_gray = np.array([0, 0, 40])
    upper_gray = np.array([180, 50, 220])
    mask = cv2.inRange(hsv, lower_gray, upper_gray)
    
    # Refine mask to avoid chopped edges
    kernel = np.ones((5,5), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    
    # Soften the mask heavily
    mask = cv2.GaussianBlur(mask, (21, 21), 0)
    mask_float = mask.astype(float) / 255.0
    mask_3d = np.dstack([mask_float, mask_float, mask_float])

    # 2. LAB color transfer
    source_lab = cv2.cvtColor(source, cv2.COLOR_BGR2LAB).astype(np.float32)
    ref_lab = cv2.cvtColor(ref, cv2.COLOR_BGR2LAB).astype(np.float32)
    
    # Get mean and std for the masked region of source
    mask_bool = mask > 127
    if not np.any(mask_bool):
        print("No base detected")
        return
        
    s_mean, s_std = cv2.meanStdDev(source_lab, mask=mask)
    r_mean, r_std = cv2.meanStdDev(ref_lab)
    
    s_mean = s_mean.flatten()
    s_std = s_std.flatten()
    r_mean = r_mean.flatten()
    r_std = r_std.flatten()
    
    # Avoid division by zero
    s_std[s_std == 0] = 1.0
    
    # Transfer color
    transfer_lab = np.copy(source_lab)
    for i in range(3):
        # We only transfer a and b channels strongly, L channel partially to preserve original lighting
        if i == 0:
            # For Luminance (L), blend it a bit to match the brightness but keep original contrast
            transfer_lab[:,:,i] = ((source_lab[:,:,i] - s_mean[i]) * (r_std[i] / s_std[i]) * 0.5) + (source_lab[:,:,i] * 0.5) + (r_mean[i] - s_mean[i]) * 0.5
        else:
            # For color channels (a, b), fully transfer
            transfer_lab[:,:,i] = ((source_lab[:,:,i] - s_mean[i]) * (r_std[i] / s_std[i])) + r_mean[i]
            
    transfer_lab = np.clip(transfer_lab, 0, 255).astype(np.uint8)
    transfer_bgr = cv2.cvtColor(transfer_lab, cv2.COLOR_LAB2BGR)
    
    # 3. Add grain/texture from reference
    # Extract high-frequency details from reference
    ref_blur = cv2.GaussianBlur(ref, (15, 15), 0)
    texture_detail = cv2.subtract(ref, ref_blur)
    
    # Add texture to transfer
    transfer_bgr = cv2.add(transfer_bgr, texture_detail)
    
    # 4. Blend using the soft mask
    result = (source * (1 - mask_3d) + transfer_bgr * mask_3d).astype(np.uint8)
    
    cv2.imwrite(out_path, result)
    print(f"Saved result to {out_path}")

os.makedirs('05_Champagne_Anodised_Test', exist_ok=True)
transfer_color_and_texture(
    '/Users/krishnaarjunaddanki/.gemini/antigravity/brain/85231c69-b687-42dc-9789-1e9d5b5f3917/.user_uploaded/media__1785262694271.jpg',
    '/Users/krishnaarjunaddanki/Documents/IdeaKicks/Keyboard/anodisation options/05_Champagne_Anodised/material_reference.jpeg',
    '05_Champagne_Anodised_Test/view1.jpg'
)
transfer_color_and_texture(
    '/Users/krishnaarjunaddanki/.gemini/antigravity/brain/85231c69-b687-42dc-9789-1e9d5b5f3917/.user_uploaded/media__1785262694273.jpg',
    '/Users/krishnaarjunaddanki/Documents/IdeaKicks/Keyboard/anodisation options/05_Champagne_Anodised/material_reference.jpeg',
    '05_Champagne_Anodised_Test/view2.jpg'
)
transfer_color_and_texture(
    '/Users/krishnaarjunaddanki/.gemini/antigravity/brain/85231c69-b687-42dc-9789-1e9d5b5f3917/.user_uploaded/media__1785262694292.png',
    '/Users/krishnaarjunaddanki/Documents/IdeaKicks/Keyboard/anodisation options/05_Champagne_Anodised/material_reference.jpeg',
    '05_Champagne_Anodised_Test/view3.jpg'
)
