import json
from pathlib import Path

CONFIG_PATH = Path(__file__).resolve().parent.parent / 'config' / 'fields_config.json'

def load_field_config():
    if not CONFIG_PATH.exists():
        return []
    with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_field_config(config):
    with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
