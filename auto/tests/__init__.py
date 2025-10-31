from pathlib import Path
from sys import path

project = str(Path(__file__).parent.parent.parent.parent)
print(project)
path.insert(0, project)
