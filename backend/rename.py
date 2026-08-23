import os
import glob

def replace_in_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    new_content = content.replace('categoryId', 'category_id')
    new_content = new_content.replace('cardId', 'card_id')
    new_content = new_content.replace('userId', 'user_id')

    if content != new_content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.ts'):
            replace_in_file(os.path.join(root, file))
