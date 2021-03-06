@echo off

NET SESSION >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
	echo This setup needs admin permissions. Please run this file as admin.
	pause
	exit
)

set NODE_VER=null
set NODE_EXEC=node.exe
set SETUP_DIR=%CD%
node -v >tmp.txt
set /p NODE_VER=<tmp.txt
del tmp.txt
IF %NODE_VER% NEQ null (
	echo INSTALLING node ...
	mkdir tmp
	IF NOT EXIST tmp/%NODE_EXEC% (
		echo Node setup file does not exist. Downloading ...
		cd ../bin
		START /WAIT wget https://nodejs.org/dist/v12.8.1/win-x64/%NODE_EXEC%
		move %NODE_EXEC% %SETUP_DIR%/tmp
	)
	cd %SETUP_DIR%/tmp
	START /WAIT %NODE_EXEC%
	cd %SETUP_DIR%
) ELSE (
	echo Node is already installed. Proceeding ...
)

cd ../..
echo Instalando PM2 ...
call npm install -g pm2
REM echo INSTALLING grunt-less grunt-copy grunt-clean grunt-compress ...
REM call npm install grunt-contrib-less grunt-contrib-copy grunt-contrib-clean grunt-contrib-compress
cd %SETUP_DIR%
echo DONE!