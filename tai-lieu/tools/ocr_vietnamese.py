"""OCR PDF tiếng Việt, có cache từng trang. Requires PyMuPDF and Tesseract vie+eng."""
import argparse
import concurrent.futures
import hashlib
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import fitz


def page_ocr(task):
    source, page_no, cache = task
    target = Path(cache) / f'{page_no + 1:04d}.txt'
    if target.exists():
        return page_no
    with fitz.open(source) as document:
        page = document[page_no]
        with tempfile.TemporaryDirectory() as tmp:
            image = Path(tmp) / 'page.png'
            page.get_pixmap(dpi=300, colorspace=fitz.csGRAY).save(image)
            result = subprocess.run(
                ['tesseract', str(image), 'stdout', '-l', 'vie+eng', '--psm', '3'],
                env={**os.environ, 'OMP_THREAD_LIMIT': '1'},
                capture_output=True, check=True,
            )
            temporary = target.with_suffix('.tmp')
            temporary.write_bytes(result.stdout)
            temporary.replace(target)
    return page_no


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--workers', type=int, default=4)
    args = parser.parse_args()
    if not shutil.which('tesseract'):
        parser.error('Không tìm thấy Tesseract trong PATH.')
    langs = subprocess.run(['tesseract', '--list-langs'], capture_output=True, text=True, check=True)
    available = (langs.stdout + langs.stderr).splitlines()
    if not {'vie', 'eng'}.issubset(set(available)):
        parser.error('Cần cài cả vie.traineddata và eng.traineddata trước khi chạy.')
    files = sorted(args.input.glob('*.pdf'))
    if not files:
        parser.error('Không có PDF trong thư mục đầu vào.')
    args.output.mkdir(parents=True, exist_ok=True)
    for source in files:
        digest = hashlib.sha256(source.read_bytes()).hexdigest()[:16]
        cache = args.output / '_cache' / digest
        cache.mkdir(parents=True, exist_ok=True)
        with fitz.open(source) as doc:
            count = len(doc)
        tasks = [(str(source), i, str(cache)) for i in range(count)]
        with concurrent.futures.ProcessPoolExecutor(max_workers=max(1, args.workers)) as pool:
            for n, _ in enumerate(pool.map(page_ocr, tasks), 1):
                print(f'{source.name}: {n}/{count}', flush=True)
        chunks = [f'# {source.name}\n\nOCR vie+eng, 300 dpi; chưa hiệu đính. Trang là thứ tự trong PDF.\n']
        for i in range(count):
            chunks.append(f'\n## Trang PDF {i+1}\n\n' + (cache / f'{i+1:04d}.txt').read_text(encoding='utf-8'))
        (args.output / (source.stem + '.md')).write_text('\n'.join(chunks), encoding='utf-8')


if __name__ == '__main__':
    main()
