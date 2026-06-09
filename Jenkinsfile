pipeline {

agent any

environment {

IMAGE = "pharmeasy-frontend:${BUILD_NUMBER}"

CONT = "pharmeasy-frontend"

}

stages {

stage('Checkout') {

steps { checkout scm }

}

stage('Build Docker Image') {

steps {

sh 'docker build -t ${IMAGE} .'

}

}

stage('Run Container') {

steps {

sh 'docker rm -f ${CONT} || true'

sh 'docker run -d --name ${CONT} -p 8081:80 ${IMAGE}'

}

}

}

}