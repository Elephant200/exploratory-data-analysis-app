from .base import *

DEBUG = False

ALLOWED_HOSTS = ["exploratory-data-analysis.replit.app", "127.0.0.1", "0.0.0.0"]

CSRF_TRUSTED_ORIGINS = ["https://exploratory-data-analysis.replit.app", "http://127.0.0.1"]

MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'