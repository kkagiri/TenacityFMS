import os

def print_tree_structure(folder_path, output_file):
    skip_folders = {'.git', '.github', '.vs', '.vscode', 'node_modules', 'packages', 'bin', 'obj'}
    allowed_extensions = {'.cs', '.js'}
    
    def get_tree_prefix(depth, is_last):
        if depth == 0:
            return ""
        prefix = "    " * (depth - 1)
        prefix += "└── " if is_last else "├── "
        return prefix
    
    with open(output_file, 'w', encoding='utf-8') as outfile:
        # Write root folder name
        root_name = os.path.basename(folder_path.rstrip('/\\'))
        outfile.write(f"{root_name}/\n")
        
        for root, dirs, files in os.walk(folder_path, topdown=True):
            # Filter directories
            dirs[:] = [d for d in dirs if d not in skip_folders and os.path.join(root, d) not in skip_folders]
            # Sort directories and files for consistent output
            dirs.sort()
            files.sort()
            
            # Calculate depth for indentation
            depth = root[len(folder_path):].count(os.sep)
            
            # Filter relevant files
            relevant_files = [f for f in files if os.path.splitext(f)[1].lower() in allowed_extensions]
            
            # Get path relative to root
            rel_path = os.path.relpath(root, folder_path)
            if rel_path != '.':
                is_last_dir = root.split(os.sep)[-1] == dirs[-1] if dirs else True
                prefix = get_tree_prefix(depth, is_last_dir)
                outfile.write(f"{prefix}{os.path.basename(root)}/\n")
            
            # Print files
            for idx, filename in enumerate(relevant_files):
                is_last = idx == len(relevant_files) - 1 and not dirs
                prefix = get_tree_prefix(depth + 1, is_last)
                outfile.write(f"{prefix}{filename}\n")

# Example usage
folder_path = "c:/Users/kkagiri/source/repos/Hyoung.Fms/"
output_file = "c:/Users/kkagiri/source/repos/Hyoung.Fms/TextContent/tree_structure.txt"
print_tree_structure(folder_path, output_file)