import os

def print_directory_structure(folder_path, output_file):
    skip_folders = {'.git', '.github', '.vs', '.vscode', 'node_modules', 'packages', 'bin', 'obj','assests'}
    allowed_extensions = {'.cs', '.js'}
    
    with open(output_file, 'w', encoding='utf-8') as outfile:
        for root, dirs, files in os.walk(folder_path, topdown=True):
            # Filter out skip folders
            dirs[:] = [d for d in dirs if d not in skip_folders and os.path.join(root, d) not in skip_folders]
            
            # Get relative path for cleaner output
            rel_path = os.path.relpath(root, folder_path)
            if rel_path != '.':
                outfile.write(f"Folder: {rel_path}\n")
            
            # Filter and write filenames
            for filename in files:
                if os.path.splitext(filename)[1].lower() in allowed_extensions:
                    outfile.write(f"  File: {filename}\n")
            
            # Add blank line between folders for readability
            if files:
                outfile.write("\n")

# Example usage
folder_path = "c:/Users/kkagiri/source/repos/Hyoung.Fms/"
output_file = "c:/Users/kkagiri/source/repos/Hyoung.Fms/TextContent/directory_structure.txt"
print_directory_structure(folder_path, output_file)