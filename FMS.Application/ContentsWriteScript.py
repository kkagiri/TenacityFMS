"""
# Script to reorganize FMS.Application project structure
# This will update directory structure based on our refactoring plan

import os
import shutil

# New project structure
new_structure = {
    "Core": {
        "Common": {
            "Models": {},
            "Interfaces": {},
            "Exceptions": {},
            "Responses": {},
        },
        "Domain": {
            "Entities": {},
            "Events": {},
            "Validation": {},
        }
    },
    "Features": {
        "Fuel": {
            "Commands": {},
            "Queries": {},
            "DTOs": {},
        },
        "Tank": {
            "Commands": {},
            "Queries": {},
            "DTOs": {},
        },
        "Vehicle": {
            "Commands": {},
            "Queries": {},
            "DTOs": {},
        },
        "Site": {
            "Commands": {},
            "Queries": {},
            "DTOs": {},
        },
        "PTS": {
            "Commands": {},
            "Queries": {},
            "DTOs": {},
            "Services": {},
        },
    },
    "Infrastructure": {
        "Communication": {
            "Redis": {},
            "SignalR": {},
            "WebSocket": {},
            "HttpPolling": {},
            "Tracker": {},
        },
        "Persistence": {
            "Repositories": {},
            "UnitOfWork": {},
        },
        "Services": {
            "Authentication": {},
            "Logging": {},
            "EventBus": {},
        },
    },
}

def create_structure(base_path, structure, level=0):
    for dir_name, sub_dirs in structure.items():
        dir_path = os.path.join(base_path, dir_name)
        if not os.path.exists(dir_path):
            os.makedirs(dir_path)
            print(f"{' ' * level}Created: {dir_path}")

        if sub_dirs:
            create_structure(dir_path, sub_dirs, level + 2)

# Base path for FMS.Application
base_path = os.path.dirname(os.path.abspath(__file__))

# Create the new structure
print("Creating new directory structure...")
create_structure(base_path, new_structure)

print("Directory structure created. Now manually migrate files to appropriate locations.")
print("Run file migration script after reviewing the structure.")
"""

import os;


def read_and_write_contents(folder_path, output_file):
    skip_folders = {'.git', '.github', '.vs', '.vscode', 'node_modules','packages', 'bin', 'obj'}

    allowed_extensions = {'.cs', '.js'}
    with open(output_file, 'w',encoding='utf-8' ) as outfile:
        for root, dirs, files in os.walk(folder_path, topdown=True):
            dirs[:] = [d for d in dirs if d not in skip_folders and os.path.join(root, d) not in skip_folders]
            for filename in files:
             if os.path.splitext(filename)[1].lower() in allowed_extensions:
                file_path = os.path.join(root, filename)
                outfile.write(f"//filepath://  {file_path}\n\n")

                try:
                    with open(file_path, 'rb') as file:
                         contents= file.read()
                         try:
                          decoded_contents = contents.decode('utf-8')
                         except UnicodeDecodeError:
                           decoded_contents = contents.decode('latin-1')
                         outfile.write(f"{decoded_contents}\n\n")
                except Exception as e:
                    print(f"Error reading file {file_path}: {e}")

folder_path = "c:/Users/kkagiri/source/repos/Tenacy.Fms/FMS.Application";
output_file = "c:/Users/kkagiri/source/repos/Tenacy.Fms/FMS.Application/fmsapplicationcontext.txt";

read_and_write_contents(folder_path, output_file)


