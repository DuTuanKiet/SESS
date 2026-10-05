@echo off
rem Ép console sang UTF-8 để log tiếng Việt hiển thị đúng (không còn "Ä£ káº¿t ná»‘i")
chcp 65001 >nul
npm run dev
