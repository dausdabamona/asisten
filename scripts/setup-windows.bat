@echo off
REM =============================================================================
REM ASISTEN - Windows Setup Script
REM Run this script to set up the database on Windows PostgreSQL
REM =============================================================================

echo.
echo ============================================
echo   ASISTEN - Phase 1 Core System Setup
echo ============================================
echo.

REM Check if PostgreSQL is installed
where psql >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: PostgreSQL not found in PATH
    echo Please install PostgreSQL and add it to your PATH
    echo Download from: https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)

echo PostgreSQL found!
echo.

REM Set default values
set /p PGHOST="Enter PostgreSQL host [localhost]: "
if "%PGHOST%"=="" set PGHOST=localhost

set /p PGPORT="Enter PostgreSQL port [5432]: "
if "%PGPORT%"=="" set PGPORT=5432

set /p PGUSER="Enter PostgreSQL username [postgres]: "
if "%PGUSER%"=="" set PGUSER=postgres

set /p PGPASSWORD="Enter PostgreSQL password: "

set /p PGDATABASE="Enter database name [asisten_db]: "
if "%PGDATABASE%"=="" set PGDATABASE=asisten_db

echo.
echo ============================================
echo   Creating Database
echo ============================================
echo.

REM Create database if not exists
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -c "CREATE DATABASE %PGDATABASE%;" 2>nul
if %ERRORLEVEL% neq 0 (
    echo Database might already exist, continuing...
)

echo.
echo ============================================
echo   Running Migration
echo ============================================
echo.

REM Run migration
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %PGDATABASE% -f prisma\migrations\20260115_init\migration.sql
if %ERRORLEVEL% neq 0 (
    echo ERROR: Migration failed
    pause
    exit /b 1
)

echo Migration completed successfully!

echo.
echo ============================================
echo   Running Seed Data
echo ============================================
echo.

REM Run seed
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %PGDATABASE% -f prisma\seed.sql
if %ERRORLEVEL% neq 0 (
    echo ERROR: Seed failed
    pause
    exit /b 1
)

echo Seed data inserted successfully!

echo.
echo ============================================
echo   Creating .env file
echo ============================================
echo.

REM Create .env file
echo DATABASE_URL="postgresql://%PGUSER%:%PGPASSWORD%@%PGHOST%:%PGPORT%/%PGDATABASE%?schema=asisten" > .env
echo NODE_ENV=development >> .env
echo APP_PORT=3000 >> .env

echo .env file created!

echo.
echo ============================================
echo   Setup Complete!
echo ============================================
echo.
echo Database: %PGDATABASE%
echo Schema: asisten
echo.
echo Next steps:
echo   1. npm install
echo   2. npm run db:generate
echo   3. Start building your application!
echo.
pause
