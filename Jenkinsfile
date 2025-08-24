pipeline {
  agent any
  environment {
    APP_DIR = 'iskolar'
  }
  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build') {
      steps {
        dir("${APP_DIR}") {
          script {
            if (isUnix()) {
              sh 'npm ci'
              sh 'npm run build'
            } else {
              bat 'npm ci'
              bat 'npm run build'
            }
          }
        }
      }
    }

    stage('Unit Test') {
      steps {
        dir("${APP_DIR}") {
          script {
            if (isUnix()) {
              sh 'if [ -f package.json ] && npm run | grep -q "test" ; then npm test ; else echo "no tests"; fi'
            } else {
              bat 'powershell -Command "if((Get-Content package.json) -match \\"test\\") { npm test } else { Write-Host \\"no tests\\" }"'
            }
          }
        }
      }
    }

    stage('Deploy To Test Env') {
      steps {
        dir("${APP_DIR}") {
          script {
            if (isUnix()) {
              sh 'nohup npm run dev &'
              sh 'sleep 8'
            } else {
              bat 'start /B npm run dev'
              bat 'ping -n 8 127.0.0.1 >nul'
            }
          }
        }
      }
    }

    stage('Integration Test') {
      steps {
        script {
          if (isUnix()) {
            sh '''
              for i in {1..30}; do
                if curl -s http://localhost:3000 > /dev/null; then
                  echo "App is running"
                  exit 0
                fi
                sleep 3
              done
              echo "App did not respond after 90s"
              exit 1
            '''
          } else {
            bat '''
              @echo off
              setlocal enabledelayedexpansion
              set success=false
              for /l %%x in (1,1,30) do (
                powershell -Command "try { Invoke-WebRequest http://localhost:3000/ -UseBasicParsing -TimeoutSec 5; exit 0 } catch { Start-Sleep -Seconds 3 }"
                if !errorlevel! == 0 (
                  set success=true
                  goto :break
                )
              )
              :break
              if "!success!"=="true" (
                echo App is running
                exit /b 0
              ) else (
                echo App did not respond after 90s
                exit /b 1
              )
            '''
          }
        }
      }
    }
  }
  post {
    always {
      cleanWs()
    }
  }
}
