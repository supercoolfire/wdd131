
import json
import os

def minify_node(node):
    if isinstance(node, dict):
        processed = {k: minify_node(v) for k, v in node.items()}
        
        # Always minify if it's a simple object with no nested items arrays
        has_nested_items = False
        for v in processed.values():
            if isinstance(v, (dict, list)):
                if has_items_recursive(v):
                    has_nested_items = True
                    break
        
        if not has_nested_items:
            processed["_minify_me"] = True
        
        return processed
    
    elif isinstance(node, list):
        return [minify_node(item) for item in node]
    
    else:
        return node

def has_items_recursive(node):
    if isinstance(node, dict):
        if "items" in node:
            return True
        for v in node.values():
            if has_items_recursive(v):
                return True
    elif isinstance(node, list):
        for item in node:
            if has_items_recursive(item):
                return True
    return False

class CustomEncoder(json.JSONEncoder):
    def encode(self, obj):
        return self._format(obj, 0)
    
    def _format(self, obj, indent_level):
        indent = "  " * indent_level
        next_indent = "  " * (indent_level + 1)
        
        if isinstance(obj, dict):
            minify_me = obj.pop("_minify_me", False)
            items = list(obj.items())
            
            if minify_me:
                parts = []
                for k, v in items:
                    if isinstance(v, (dict, list)):
                        val_str = self._format(v, indent_level)  # Don't increase indent for minified children
                    else:
                        val_str = json.dumps(v)
                    parts.append(f'"{k}": {val_str}')
                return "{" + ", ".join(parts) + "}"
            else:
                parts = []
                for k, v in items:
                    if isinstance(v, (dict, list)):
                        val_str = self._format(v, indent_level + 1)
                    else:
                        val_str = json.dumps(v)
                    parts.append(f'{next_indent}"{k}": {val_str}')
                return "{\n" + ",\n".join(parts) + "\n" + indent + "}"
        
        elif isinstance(obj, list):
            if not obj:
                return "[]"
            
            parts = []
            for item in obj:
                if isinstance(item, (dict, list)):
                    parts.append(self._format(item, indent_level + 1))
                else:
                    parts.append(json.dumps(item))
            
            return "[\n" + ",\n".join([f"{next_indent}{p}" for p in parts]) + "\n" + indent + "]"
        
        else:
            return json.dumps(obj)

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    minified_data = minify_node(data)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(CustomEncoder().encode(minified_data))

def process_directory(directory):
    for filename in os.listdir(directory):
        if filename.endswith('.json'):
            file_path = os.path.join(directory, filename)
            print(f"Processing {filename}...")
            process_file(file_path)

if __name__ == "__main__":
    # Automatically find all JSON files in the project/data directory
    data_dir = os.path.join(os.path.dirname(__file__), 'project', 'data')
    process_directory(data_dir)
    print("Done!")
