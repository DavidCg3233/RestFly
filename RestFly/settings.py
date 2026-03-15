from pathlib import Path
import sys
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Agregar src al path para que Django encuentre las apps
sys.path.append(os.path.join(BASE_DIR, 'src'))

# Quick-start development settings - unsuitable for production
SECRET_KEY = 'django-insecure-trf)4rx5ezv_3dz7jc(snt!fbq=sj@(5dw!1s-%*qqte270ufk'
DEBUG = True
ALLOWED_HOSTS = []

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Tus módulos
    'modulos.autenticacion',
    'modulos.usuarios',
    'modulos.mesas',
    'modulos.pedidos',
    'modulos.cocina',
    'modulos.caja',
    'modulos.inventario',
    'modulos.tablero',
    'modulos.reportes',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'RestFly.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'src')],  # Para buscar templates en src
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'RestFly.wsgi.application'

# Database
# Aquí puedes cambiar a MySQL luego si quieres
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',  # Cambiar a mysql en el futuro
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',},
]

# Internationalization
LANGUAGE_CODE = 'es-co'   # Español Colombia
TIME_ZONE = 'America/Bogota'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JS, imágenes)
STATIC_URL = '/static/'
STATICFILES_DIRS = [os.path.join(BASE_DIR, 'src/compartido/utilidades')]  # opcional

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'