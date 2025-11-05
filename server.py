#!/usr/bin/env python3
"""
Простой HTTP сервер для демонстрации AI Тренера
Запуск: python server.py
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

# Настройки сервера
PORT = 8000
HOST = 'localhost'

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Кастомный обработчик HTTP запросов с поддержкой CORS"""
    
    def end_headers(self):
        # Добавляем CORS заголовки
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_OPTIONS(self):
        # Обработка preflight запросов
        self.send_response(200)
        self.end_headers()
    
    def log_message(self, format, *args):
        # Кастомное логирование
        print(f"🌐 {self.address_string()} - {format % args}")

def main():
    """Основная функция запуска сервера"""
    
    # Проверяем наличие необходимых файлов
    required_files = ['index.html', 'styles.css', 'script.js']
    missing_files = [f for f in required_files if not Path(f).exists()]
    
    if missing_files:
        print(f"❌ Отсутствуют файлы: {', '.join(missing_files)}")
        print("Убедитесь, что все файлы находятся в текущей директории")
        sys.exit(1)
    
    # Создаем сервер
    try:
        with socketserver.TCPServer((HOST, PORT), CustomHTTPRequestHandler) as httpd:
            print("🚀 AI Тренер - Демо сервер")
            print("=" * 50)
            print(f"📍 Адрес: http://{HOST}:{PORT}")
            print(f"📁 Директория: {os.getcwd()}")
            print("=" * 50)
            print("🎯 Откройте браузер и перейдите по адресу выше")
            print("⏹️  Для остановки нажмите Ctrl+C")
            print("=" * 50)
            
            # Автоматически открываем браузер
            try:
                webbrowser.open(f'http://{HOST}:{PORT}')
                print("🌐 Браузер открыт автоматически")
            except Exception as e:
                print(f"⚠️  Не удалось открыть браузер: {e}")
            
            print("\n🔄 Сервер запущен...")
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n⏹️  Сервер остановлен")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Порт {PORT} уже используется")
            print(f"Попробуйте другой порт или остановите процесс на порту {PORT}")
        else:
            print(f"❌ Ошибка запуска сервера: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Неожиданная ошибка: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()