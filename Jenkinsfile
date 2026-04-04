pipeline {
    agent {
        kubernetes {
            label 'develop-tool-portal-web-build'
            defaultContainer 'node'
            yamlFile 'cicd/podTemplates/kaniko-pod.yaml'
        }
    }

    environment {
        SERVICE_NAME = "develop-tool-portal-web"
        DOCKER_USERNAME = "lamld2510"
        IMAGE_TAG = "${BUILD_NUMBER}"
        DOCKER_REGISTRY = "docker.io"
        IMAGE_NAME = "${DOCKER_USERNAME}/${SERVICE_NAME}"
        CACHE_REPO = "${DOCKER_USERNAME}/${SERVICE_NAME}-cache"
        NAMESPACE = "dev-tool-application"
        CONFIGMAP_NAME = "${SERVICE_NAME}-config"
        DEPLOY_FILE = "cicd/k8s/deployment.yaml"
        NODE_PORT = 31200
    }

    stages {
        stage('Build Angular App') {
            steps {
                container('node') {
                    sh '''
                    echo "Installing dependencies..."
                    npm ci
                    echo "Building Angular..."
                    npm run build-prod
                    '''
                }
            }
        }

        stage('Build & Push Docker Image') {
            steps {
                container('kaniko') {
                    sh '''
                    echo "Building image with Kaniko..."
                    /kaniko/executor \
                      --dockerfile=Dockerfile \
                      --context=dir://$(pwd) \
                      --destination=${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} \
                      --destination=${DOCKER_REGISTRY}/${IMAGE_NAME}:latest \
                      --cache=true \
                      --cache-repo=${DOCKER_REGISTRY}/${CACHE_REPO} \
                      --verbosity=info
                    '''
                }
            }
        }

        stage('Generate & Apply ConfigMap') {
            steps {
                container('kubectl') {
                    sh '''
                    export KUBECONFIG=/root/.kube/kubeconfig &&
                    chmod +x cicd/scripts/create-configmap.sh
                    ./cicd/scripts/create-configmap.sh
                    '''
                }
            }
        }

        stage('Generate Deployment YAML') {
            steps {
                container('kubectl') {
                    sh '''
                    export KUBECONFIG=/root/.kube/kubeconfig &&
                    chmod +x cicd/scripts/generate-deployment.sh
                    ./cicd/scripts/generate-deployment.sh
                    '''
                }
            }
        }

        stage('Apply & Restart Deployment') {
            steps {
                container('kubectl') {
                    sh '''
                    export KUBECONFIG=/root/.kube/kubeconfig &&
                    chmod +x cicd/scripts/apply-deployment.sh
                    ./cicd/scripts/apply-deployment.sh
                    '''
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'k8s-*.yaml', allowEmptyArchive: true
            echo 'Build & Deploy finished.'
        }
        failure {
            echo 'Build or Deploy failed. Check logs for details.'
        }
    }
}
