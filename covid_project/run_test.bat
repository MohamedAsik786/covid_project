@echo off
python d:\covid_project\backend\test_backend.py > d:\covid_project\test_output.txt 2>&1
echo Exit code: %errorlevel% >> d:\covid_project\test_output.txt
