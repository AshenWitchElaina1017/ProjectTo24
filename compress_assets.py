import os
import cssmin
import jsmin
import sys
import traceback # Import traceback for detailed error logging

# Define log file paths
LOG_FILE = 'compress_log.txt'
ERR_FILE = 'compress_err.txt'

# Clear previous logs
if os.path.exists(LOG_FILE): os.remove(LOG_FILE)
if os.path.exists(ERR_FILE): os.remove(ERR_FILE)

def log_message(message, is_error=False):
    """Logs message to the appropriate file."""
    filepath = ERR_FILE if is_error else LOG_FILE
    try:
        with open(filepath, 'a', encoding='utf-8') as f:
            print(message, file=f)
        # Also print to standard streams for immediate feedback if possible
        print(message, file=sys.stderr if is_error else sys.stdout)
    except Exception as e:
        # Fallback print if logging fails
        print(f"Logging failed: {e}. Original message: {message}", file=sys.stderr)


# 定义要压缩的文件列表
ASSETS = {
    'css': [
        'static/css/template.css',
        'static/css/game.css',
        'static/css/index.css',
        'static/css/qa.css',
        'static/css/song.css',
    ],
    'js': [
        'static/js/template.js',
        'static/js/game.js',
        'static/js/index.js',
        'static/js/qa.js',
        'static/js/song.js',
    ]
}

def get_min_path(filepath):
    """生成 .min 文件路径"""
    root, ext = os.path.splitext(filepath)
    return f"{root}.min{ext}"

def compress_file(filepath, compressor):
    """读取、压缩并写入文件"""
    min_filepath = get_min_path(filepath)
    log_message(f"Processing: {filepath}")
    try:
        with open(filepath, 'r', encoding='utf-8') as infile:
             content = infile.read()

        log_message(f"Read {len(content)} characters from {filepath}")

        # 检查内容是否为空
        if not content.strip():
            log_message(f"Skipping empty file: {filepath}")
            with open(min_filepath, 'w', encoding='utf-8') as outfile:
                outfile.write('') # 写入空内容
            log_message(f"Wrote empty file to {min_filepath} for skipped empty source.")
            return

        # 执行压缩
        minified_content = compressor(content)
        log_message(f"Compressed content length: {len(minified_content)}")

        # 写入压缩后的文件
        with open(min_filepath, 'w', encoding='utf-8') as outfile:
            outfile.write(minified_content)
        log_message(f"Successfully compressed and wrote: {filepath} -> {min_filepath}")

    except FileNotFoundError:
        log_message(f"Error: Input file not found - {filepath}", is_error=True)
    except Exception as e:
        # Log detailed error including traceback
        error_details = f"Error compressing {filepath}: {e}\n{traceback.format_exc()}"
        log_message(error_details, is_error=True)
        # 如果压缩失败，尝试写入空文件以避免引用错误，但打印错误
        try:
            with open(min_filepath, 'w', encoding='utf-8') as outfile:
                outfile.write('')
            log_message(f"Wrote empty file to {min_filepath} due to compression error.", is_error=True)
        except Exception as write_e:
             log_message(f"Error writing empty file {min_filepath} after compression error: {write_e}", is_error=True)


if __name__ == "__main__":
    log_message("Starting asset compression...")

    # 压缩 CSS
    log_message("\nCompressing CSS files...")
    for css_file in ASSETS['css']:
        compress_file(css_file, cssmin.cssmin)

    # 压缩 JS
    log_message("\nCompressing JS files...")
    for js_file in ASSETS['js']:
        # jsmin 需要一个非空的字符串
        compress_file(js_file, lambda content: jsmin.jsmin(content) if content.strip() else '')

    log_message("\nAsset compression finished.")