"""Import the supplied dataset without modifying its PDFs or ground truth."""
from pathlib import Path
from zipfile import ZipFile
import sys

destination = (Path(__file__).resolve().parent.parent / 'data' / (sys.argv[2] if len(sys.argv) > 2 else 'carra-estimates')).resolve()
with ZipFile(sys.argv[1]) as archive:
    for info in archive.infolist():
        if info.is_dir():
            continue
        relative = Path(*Path(info.filename).parts[1:])
        target = (destination / relative).resolve()
        if not target.is_relative_to(destination):
            raise ValueError('Archive path outside dataset directory')
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(archive.read(info))
print(f'Imported dataset to {destination}')
