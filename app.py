"""
WSGI приложение для запуска через gunicorn
"""
import os
from pathlib import Path
from wsgiref.simple_server import make_server
from urllib.parse import unquote

# Базовая директория проекта
BASE_DIR = Path(__file__).parent


def application(environ, start_response):
    """
    WSGI приложение для обслуживания статических файлов
    """
    # Получаем путь запроса
    path = unquote(environ.get('PATH_INFO', '/'))
    
    # Если корневой путь, возвращаем index.html
    if path == '/' or path == '':
        path = '/index.html'
    
    # Убираем начальный слэш
    file_path = BASE_DIR / path.lstrip('/')
    
    # Проверяем существование файла
    if not file_path.exists() or not file_path.is_file():
        # 404 Not Found
        status = '404 Not Found'
        headers = [('Content-Type', 'text/html; charset=utf-8')]
        start_response(status, headers)
        return [b'<h1>404 - File Not Found</h1>']
    
    # Определяем Content-Type
    content_type = 'text/html; charset=utf-8'
    if file_path.suffix == '.css':
        content_type = 'text/css; charset=utf-8'
    elif file_path.suffix == '.js':
        content_type = 'application/javascript; charset=utf-8'
    elif file_path.suffix == '.json':
        content_type = 'application/json; charset=utf-8'
    elif file_path.suffix == '.png':
        content_type = 'image/png'
    elif file_path.suffix == '.jpg' or file_path.suffix == '.jpeg':
        content_type = 'image/jpeg'
    elif file_path.suffix == '.svg':
        content_type = 'image/svg+xml'
    elif file_path.suffix == '.ico':
        content_type = 'image/x-icon'
    
    # Читаем файл
    try:
        with open(file_path, 'rb') as f:
            content = f.read()
        
        # Добавляем CORS заголовки
        headers = [
            ('Content-Type', content_type),
            ('Access-Control-Allow-Origin', '*'),
            ('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'),
            ('Access-Control-Allow-Headers', 'Content-Type'),
        ]
        
        status = '200 OK'
        start_response(status, headers)
        return [content]
        
    except Exception as e:
        # 500 Internal Server Error
        status = '500 Internal Server Error'
        headers = [('Content-Type', 'text/html; charset=utf-8')]
        start_response(status, headers)
        return [f'<h1>500 - Server Error</h1><p>{str(e)}</p>'.encode()]


# Для gunicorn
server = application

# Для локального запуска (опционально)
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    with make_server('', port, application) as httpd:
        print(f"🚀 Сервер запущен на http://localhost:{port}")
        httpd.serve_forever()
