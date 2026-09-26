import os

base_dir = '/Users/krishnaarjunaddanki/Documents/IdeaKicks/Keyboard/anodisation options'
brain_dir = '/Users/krishnaarjunaddanki/.gemini/antigravity/brain/85231c69-b687-42dc-9789-1e9d5b5f3917'

v1_path = os.path.join(brain_dir, '.user_uploaded/media__1785262694271.jpg')
v2_path = os.path.join(brain_dir, '.user_uploaded/media__1785262694273.jpg')
v3_path = os.path.join(brain_dir, '.user_uploaded/media__1785262694292.png')

options = [
    ('05_Champagne_Anodised', 'Champagne Gold anodized aluminum'),
    ('06_CP_Silver_Finish', 'Polished chrome silver satin anodized aluminum'),
    ('07_Textured_Copper_Antique_CP_SS', 'Sandblasted textured copper anodized aluminum'),
    ('08_IP_Rosegold_Blush', 'IP Rosegold blush brushed anodized aluminum'),
    ('09_Textured_Gold_Grey_Cocacola', 'Sandblasted textured gold anodized aluminum'),
    ('10_Rosegold_Anodised', 'Classic Rosegold brushed anodized aluminum'),
    ('11_Antique_Anodised', 'Antique Bronze satin anodized aluminum'),
    ('12_Textured_Multi_ST', 'Dark textured gunmetal anodized aluminum'),
    ('13_Black_Anodised', 'Deep matte black anodized aluminum')
]

print("Batch schedule prepared for options 05 through 13.")
