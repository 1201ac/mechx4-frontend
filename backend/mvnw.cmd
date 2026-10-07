@echo off
set MVN_EXEC="C:\Users\rpkop\.m2\wrapper\dists\apache-maven-3.9.16-bin\5grr65jo27hi51sujmtcldfovl\apache-maven-3.9.16\bin\mvn.cmd"
if exist %MVN_EXEC% (
    %MVN_EXEC% %*
) else (
    where mvn >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        mvn %*
    ) else (
        echo Maven executable not found
        exit /b 1
    )
)
