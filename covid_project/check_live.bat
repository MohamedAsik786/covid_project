@echo off
curl -s http://localhost:5000/api/health > d:\covid_project\live_check.txt 2>&1
curl -s -o nul -w "HTTP_STATUS:%%{http_code}" http://localhost:5000/ >> d:\covid_project\live_check.txt 2>&1
