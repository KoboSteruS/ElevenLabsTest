"""
Конфигурация Gunicorn для production
"""
import os
import multiprocessing

# Количество воркеров (обычно 2-4 * количество CPU)
workers = multiprocessing.cpu_count() * 2 + 1

# Порт (будет переопределен через переменную окружения PORT)
bind = f"0.0.0.0:{os.environ.get('PORT', '8000')}"

# Таймауты
timeout = 120
keepalive = 5

# Логирование
accesslog = "-"  # stdout
errorlog = "-"   # stderr
loglevel = "info"

# Перезапуск при изменении кода (только для разработки)
reload = False

# Имя приложения
wsgi_app = "app:server"
