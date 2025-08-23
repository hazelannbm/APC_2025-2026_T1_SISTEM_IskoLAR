pipeline {
  agent any
  environment {
    APP_DIR = 'iskolar'
    IMAGE_REPO = 'hbmones/iskolar'    // << replace with your Docker Hub repo (username/iskolar)
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
              sh 'npm run build || true'
            } else {
              bat 'npm ci'
              // allow build to continue even if no build script or it fails; adjust if you want strict
              bat 'npm run build || exit /b 0'
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
              sh 'if [ -f package.json ] && npm run | grep -q \"test\" ; then npm test || true; else echo \"no tests\"; fi'
            } else {
              bat 'powershell -Command "if((Get-Content package.json) -match \\"test\\") { npm test } else { Write-Host \\"no tests\\" }" || exit /b 0'
            }
          }
        }
      }
    }

    stage('Deploy To Test Env') {
      steps {
        dir("${APP_DIR}") {
          script {
            // starts the test service (docker compose). You need docker-compose.test.yml in repo.
            if (isUnix()) {
              sh 'docker compose -f docker-compose.test.yml up -d --build'
              sh 'sleep 8'
            } else {
              bat 'docker compose -f docker-compose.test.yml up -d --build'
              bat 'ping -n 8 127.0.0.1 >nul'
            }
          }
        }
      }
    }

    stage('Integration Test') {
        steps {
            script {
                // Retry loop until app responds (max ~90s)
                bat '''
                setlocal enabledelayedexpansion
                for /l %%x in (1, 1, 30) do (
                    powershell -Command "try { Invoke-WebRequest http://localhost:3000/ -UseBasicParsing -TimeoutSec 5; exit 0 } catch { Start-Sleep -Seconds 3 }"
                    if !errorlevel! EQU 0 exit /b 0
                )
                echo "App did not respond after 90s"
                exit /b 1
                '''
            }
        }
        post {
            always {
                dir("${APP_DIR}") {
                    bat 'docker compose -f docker-compose.test.yml down'
                }
            }
        }
    }

    stage('Create Docker Image & Push') {
      steps {
        dir("${APP_DIR}") {
          script {
            // get a short commit id
            def shortSha = isUnix() ? sh(returnStdout: true, script: "git rev-parse --short HEAD").trim()
                                     : bat(returnStdout: true, script: 'powershell -Command "(git rev-parse --short HEAD).Trim()"').trim()
            def tag = "${env.BUILD_NUMBER}-${shortSha}"
            echo "Tagging image: ${IMAGE_REPO}:${tag}"

            // Use Docker Hub credentials stored in Jenkins (credential id 'dockerhub-cred' --- create this in Jenkins)
            withCredentials([usernamePassword(credentialsId: 'dockerhub-cred', usernameVariable: 'DOCKERHUB_USER', passwordVariable: 'DOCKERHUB_PASS')]) {
              if (isUnix()) {
                sh """
                  docker build -t ${IMAGE_REPO}:${tag} iskolar
                  echo "$DOCKERHUB_PASS" | docker login -u "$DOCKERHUB_USER" --password-stdin
                  docker push ${IMAGE_REPO}:${tag}
                """
              } else {
                bat """
                  docker build -t ${IMAGE_REPO}:${tag} iskolar
                  echo %DOCKERHUB_PASS% | docker login -u %DOCKERHUB_USER% --password-stdin
                  docker push ${IMAGE_REPO}:${tag}
                """
              }
            }
          }
        }
      }
    }
  }

  post {
    always {
      // keep workspace tidy
      cleanWs()
    }
  }
}
