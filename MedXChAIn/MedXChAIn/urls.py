"""
URL configuration for MedXChAIn project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
import sys
import os

# Add parent directory to path to import views
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from views import (
    index, 
    api_training_metrics, 
    api_hospital_metrics, 
    api_model_performance,
    api_dashboard_summary
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', index, name='home'),
    path('api/training-metrics/', api_training_metrics, name='api_training_metrics'),
    path('api/hospital-metrics/', api_hospital_metrics, name='api_hospital_metrics'),
    path('api/model-performance/', api_model_performance, name='api_model_performance'),
    path('api/dashboard-summary/', api_dashboard_summary, name='api_dashboard_summary'),
]


if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])

