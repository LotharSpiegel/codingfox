+++
title = 'Kubernetes Tutorial Chapter 1: Local Cluster Setup with Docker Desktop on Windows'
date = 2025-10-19T12:00:00+01:00
draft = false
wip = true
tags = ['K8s', 'Kubernetes', 'Docker', 'DevOps', 'Tutorial']
series = ['Kubernetes Tutoryial']
chapter = 1
+++

# Kubernetes Tutorial Chapter 1: Local Cluster Setup with Docker Desktop on Windows

## Introduction

This is the first chapter in a series of tutorials on Kubernetes (K8s). This series will provide practical guidance on Kubernetes deployment and management, beginning with local development environments and progressing to more advanced configurations.

## Prerequisites

- Windows 10 64-bit: Pro, Enterprise, or Education (Build 16299 or later)
- 4 GB RAM minimum (8 GB recommended)
- BIOS-level hardware virtualization support enabled
- 40 GB minimum free disk space

## Docker Desktop Installation

1. **Download and Install Docker Desktop**
   - Download from [Docker Desktop website](https://www.docker.com/products/docker-desktop)
   - Execute the installer (`Docker Desktop Installer.exe`)
   - Select "Use WSL 2 instead of Hyper-V" when prompted
   - Complete installation and restart system

2. **Verify Installation**
   ```powershell
   docker --version
   docker run hello-world
   ```

## Enabling Kubernetes

1. **Access Docker Desktop Settings**
   - Locate Docker icon in system tray
   - Select Settings

2. **Enable Kubernetes Feature**
   - Navigate to Kubernetes section in left sidebar
   - Check "Enable Kubernetes" option
   - Select "Apply & Restart"
   - Wait for component download and initialization (may take several minutes)

3. **Verify Kubernetes Activation**
   ```powershell
   kubectl version
   kubectl get nodes
   ```

   Expected output:
   ```
   NAME             STATUS   ROLES           AGE   VERSION
   docker-desktop   Ready    control-plane   10m   v1.19.7
   ```

   > **Understanding the output:**
   > - **NAME**: The hostname of the node (in this case, docker-desktop)
   > - **STATUS**: Indicates if the node is Ready to accept workloads
   > - **ROLES**: Shows "control-plane" which means this node functions as the cluster's brain, managing the overall state and making scheduling decisions
   > - **AGE**: How long the node has been part of the cluster
   > - **VERSION**: The Kubernetes version running on this node
   >
   > In a local Docker Desktop setup, you have a single-node cluster where this one node serves as both the control plane (master) and a worker node.

## Kubernetes Environment Configuration

Docker Desktop automatically configures the following:

- **Single-node cluster**: Both control-plane and worker processes run on the same node
  > **What is a Node?** A node is a worker machine in Kubernetes - either a physical server, virtual machine, or cloud instance. Nodes are where your containerized applications actually run.
  
  > **What is a Cluster?** A Kubernetes cluster is a set of nodes that run containerized applications managed by Kubernetes. For production environments, a cluster typically consists of multiple nodes to provide high availability and scalability.
- kubectl configuration for local cluster communication
- Default namespace for deployments
- hostpath storage class for persistent volumes

> **Key Kubernetes Concepts You'll Encounter:**
>
> - **Ingress**: An API object that manages external access to services within a cluster, typically HTTP. Ingress can provide load balancing, SSL termination, and name-based virtual hosting.
>
> - **ConfigMap**: A resource used to store non-confidential data in key-value pairs. Applications can consume ConfigMaps as environment variables, command-line arguments, or configuration files in a volume.
>
> - **Secret**: Similar to ConfigMap but designed for confidential data such as passwords, OAuth tokens, and SSH keys. Secrets are encoded in base64 when stored.
>
> - **StatefulSet**: Used for applications that require stable, unique network identifiers, stable persistent storage, and ordered deployment and scaling. Databases are a common use case for StatefulSets.

## Basic Kubernetes Commands

```powershell
# List available API resources
kubectl api-resources

# View all pods across namespaces
kubectl get pods --all-namespaces

# Examine Kubernetes system components
kubectl get pods -n kube-system

# Check cluster information
kubectl cluster-info
```

## Troubleshooting

For common issues and their solutions, please refer to our [Kubernetes Troubleshooting Guide]({{< relref "post/k8s-tutorial/local-k8s-cluster-troubleshooting.md" >}}).

## Creating a Simple React App

Let's create a minimal React application to deploy to our Kubernetes cluster using Vite, which is the modern recommended approach for React applications:

1. **Create a new React application with Vite**
   ```powershell
   # Create a new project with Vite
   npm create vite@latest k8s-demo-app -- --template react
   cd k8s-demo-app
   
   # Install dependencies
   npm install
   ```

2. **Test the application locally**
   ```powershell
   npm run dev
   ```
   This will launch the app at http://localhost:5173 (Vite's default port)

3. **Build the production version**
   ```powershell
   npm run build
   ```

> **What we've done**: We've created a simple React application using Vite, which offers faster development experience with Hot Module Replacement (HMR) and optimized production builds. Vite is the modern recommended approach for new React applications, replacing the older create-react-app. This application will be containerized and deployed to our Kubernetes cluster, representing a typical frontend application in a microservices architecture.

## Containerizing the React App

Now let's package our Vite-based React app into a Docker container:

1. **Create a Dockerfile in the project root**
   Create a file named `Dockerfile` with the following content:
   ```dockerfile
   # Build stage
   FROM node:20 as build
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build

   # Production stage
   FROM nginx:alpine
   # Vite builds to /dist instead of /build by default
   COPY --from=build /app/dist /usr/share/nginx/html
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Build the Docker image**
   ```powershell
   docker build -t k8s-demo-react-app:v1 .
   ```

3. **Test the containerized application**
   ```powershell
   docker run -p 8080:80 k8s-demo-react-app:v1
   ```
   Visit http://localhost:8080 to verify the app works in the container

> **What we've done**: We've packaged our Vite-based React application into a Docker container. The key difference from create-react-app is that Vite builds to a `/dist` directory instead of `/build`. The container uses Nginx to serve the static files produced by the Vite build process. This container image can now be deployed to any environment that supports Docker, including our Kubernetes cluster.
>
> **Understanding the Dockerfile in detail**:
>
> Our Dockerfile uses a multi-stage build process to create an optimized production image:
>
> 1. **Build Stage**:
>    - `FROM node:18 as build`: Uses Node.js 18 as the base image for building the application and labels this stage as "build"
>    - `WORKDIR /app`: Sets the working directory inside the container to /app
>    - `COPY package*.json ./`: Copies package.json and package-lock.json to leverage Docker's layer caching (if dependencies haven't changed, this layer can be reused)
>    - `RUN npm install`: Installs all dependencies defined in package.json
>    - `COPY . .`: Copies all application source code into the container
>    - `RUN npm run build`: Builds the production-ready static files (HTML, CSS, JS) into the /app/dist directory
>
> 2. **Production Stage**:
>    - `FROM nginx:alpine`: Uses a lightweight Alpine Linux-based Nginx image for serving the static files
>    - `COPY --from=build /app/dist /usr/share/nginx/html`: Copies only the built files from the build stage into Nginx's default web server directory
>    - `EXPOSE 80`: Documents that the container will listen on port 80
>    - `CMD ["nginx", "-g", "daemon off;"]`: Starts Nginx in the foreground
>
> The resulting image is a lightweight Nginx server containing only the production build of our React application, without any development dependencies or source code. This multi-stage approach significantly reduces the final image size and improves security by not including unnecessary development tools or source code in the production container.

## Deploying to Kubernetes

Now let's deploy our containerized Vite-based React app to the local Kubernetes cluster:

1. **Create a deployment manifest**
   Create a file named `react-app-deployment.yaml` with the following content:
   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: react-app
   spec:
     replicas: 2
     selector:
       matchLabels:
         app: react-app
     template:
       metadata:
         labels:
           app: react-app
       spec:
         containers:
         - name: react-app
           image: k8s-demo-react-app:v1
           ports:
           - containerPort: 80
   ```

   > **What is a Pod?** A Pod is the smallest deployable unit in Kubernetes and serves as a wrapper around one or more containers. In our deployment, each Pod will contain one container running our React app.

2. **Create a service manifest**
   Create a file named `react-app-service.yaml` with the following content:
   ```yaml
   apiVersion: v1
   kind: Service
   metadata:
     name: react-app-service
   spec:
     type: NodePort
     selector:
       app: react-app
     ports:
     - port: 80
       targetPort: 80
       nodePort: 30080
   ```

   > **What is a Service?** A Service is an abstraction that defines a logical set of Pods and a policy to access them. Our service will make the React app accessible from outside the cluster.
   
   When you run `kubectl get services`, you'll see output similar to:
   ```
   NAME                TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)        AGE
   kubernetes          ClusterIP   10.96.0.1        <none>        443/TCP        301d
   react-app-service   NodePort    10.106.227.148   <none>        80:30080/TCP   3d5h
   ```
   
   > **Understanding the output:**
   > - **NAME**: The name of the service. The "kubernetes" service is created by default and provides access to the Kubernetes API server.
   > - **TYPE**: The service type, which determines how the service is exposed:
   >   - **ClusterIP**: Exposes the service on an internal IP within the cluster (default). Only reachable from within the cluster.
   >   - **NodePort**: Exposes the service on each node's IP at a static port. Accessible from outside the cluster using `<NodeIP>:<NodePort>`.
   >   - **LoadBalancer**: Exposes the service externally using a cloud provider's load balancer.
   >   - **ExternalName**: Maps the service to a DNS name.
   > - **CLUSTER-IP**: The internal IP address assigned to the service within the cluster.
   > - **EXTERNAL-IP**: The external IP address (if any) where the service is exposed. Shows `<none>` for ClusterIP and NodePort types.
   > - **PORT(S)**: The port mappings. For our NodePort service, it shows `80:30080/TCP`, meaning:
   >   - Internal port 80 (the service port)
   >   - External port 30080 (the nodePort)
   >   - Using TCP protocol
   > - **AGE**: How long the service has been running.
   >
   > In our example, we have two services:
   > 1. The default "kubernetes" service (ClusterIP type) that provides access to the API server on port 443.
   > 2. Our "react-app-service" (NodePort type) that exposes our React application on port 30080 externally, mapping to port 80 internally.

3. **Apply the manifests to deploy the application**
   ```powershell
   kubectl apply -f react-app-deployment.yaml
   kubectl apply -f react-app-service.yaml
   ```

4. **Verify the deployment**
   ```powershell
   kubectl get deployments
   kubectl get pods
   kubectl get services
   ```

5. **Access the application**
   Visit http://localhost:30080 in your browser

> **What we've done**: We've deployed our Vite-based React application to Kubernetes. The Deployment creates and manages multiple replicas (Pods) of our application, while the Service makes it accessible from outside the cluster. This demonstrates how Kubernetes orchestrates containerized applications.

## Next Chapter Preview

Chapter 2 will cover:
- Installing ArgoCD in our Kubernetes cluster
- Setting up a GitOps workflow for continuous deployment
- Automating the deployment of our React application
- Understanding Kubernetes manifest management
- Implementing deployment strategies with GitOps

## References

- [Kubernetes Documentation](https://kubernetes.io/docs/home/)
- [Docker Desktop Documentation](https://docs.docker.com/desktop/)
- [kubectl Command Reference](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
